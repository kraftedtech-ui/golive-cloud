import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireSession } from '@/lib/apiAuth'
import {
  SalesDocument,
  nextVersion,
  retentionDateFrom,
} from '@/models/SalesDocument'
import crypto from 'crypto'

/**
 * GET  /api/sales-documents?leadId=...&groupId=...
 * POST /api/sales-documents            -> saves a new version
 *
 * Every save creates a version. Nothing is ever edited in place, so the record
 * of what was actually sent to a customer stays intact even after the deal is
 * re-quoted three times.
 */

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')
    const groupId = searchParams.get('groupId')
    const outcome = searchParams.get('outcome')

    const filter: Record<string, unknown> = {}
    if (leadId) filter.leadId = leadId
    if (groupId) filter.revisionGroupId = groupId
    if (outcome) filter.outcome = outcome

    const docs = await SalesDocument.find(filter)
      .sort({ revisionGroupId: 1, version: -1 })
      .limit(200)
      .lean()

    // renderedHtml is ~30 KB per document — far too much to ship for a list.
    // The client only needs to know whether a re-download is possible, so
    // send a boolean and drop the payload.
    const items = docs.map((d) => {
      const { renderedHtml, ...rest } = d as Record<string, unknown>
      return { ...rest, hasArchive: typeof renderedHtml === 'string' && renderedHtml.length > 0 }
    })

    return NextResponse.json({ success: true, items })
  } catch (err) {
    console.error('GET /api/sales-documents failed:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDB()
    const body = await req.json()

    if (!body.buyerName || !body.currency) {
      return NextResponse.json(
        { success: false, error: 'buyerName and currency are required' },
        { status: 400 }
      )
    }

    // A revision group is per-deal. Reusing the group id from the client means
    // "this is another version of the same quote"; omitting it starts a new one.
    const revisionGroupId: string = body.revisionGroupId || crypto.randomUUID()

    // Refuse to add versions to a deal that has already closed. Changing a
    // closed deal is a new revision group or a credit note, never an edit.
    const accepted = await SalesDocument.findOne({ revisionGroupId, outcome: 'accepted' })
      .select('reference invoiceNumber')
      .lean()
    if (accepted) {
      return NextResponse.json(
        {
          success: false,
          error: `This deal already closed on ${(accepted as any).invoiceNumber || (accepted as any).reference}. Start a new quote instead of revising a closed one.`,
        },
        { status: 409 }
      )
    }

    const version = await nextVersion(revisionGroupId)
    const year = new Date().getFullYear()
    const shortId = revisionGroupId.replace(/-/g, '').slice(0, 6).toUpperCase()
    const reference = `GL-PROP-${year}-${shortId}-v${version}`

    const issuedAt = new Date()
    const actorEmail = auth.email ?? undefined

    // Supersede whatever was current. Declined versions stay declined so the
    // history shows the customer actually said no at that point.
    await SalesDocument.updateMany(
      { revisionGroupId, outcome: 'open' },
      {
        $set: { outcome: 'superseded' },
        $push: {
          auditTrail: {
            at: issuedAt,
            actorEmail,
            action: 'superseded',
            detail: `Replaced by v${version}`,
          },
        },
      }
    )

    const doc = await SalesDocument.create({
      ...body,
      documentType: 'proposal',
      revisionGroupId,
      version,
      reference,
      outcome: 'open',
      issuedAt,
      issuedByEmail: actorEmail,
      issuedByName: auth.name ?? undefined,
      retentionUntil: retentionDateFrom(issuedAt),
      auditTrail: [
        {
          at: issuedAt,
          actorEmail,
          action: 'created',
          detail: `Version ${version} issued`,
        },
      ],
    })

    return NextResponse.json({ success: true, item: doc }, { status: 201 })
  } catch (err) {
    console.error('POST /api/sales-documents failed:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to save document' },
      { status: 500 }
    )
  }
}
