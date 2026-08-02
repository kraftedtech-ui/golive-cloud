import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireSession } from '@/lib/apiAuth'
import { SalesDocument, allocateInvoiceNumber } from '@/models/SalesDocument'

/**
 * GET   /api/sales-documents/[id]        -> full document, including the archived HTML
 * PATCH /api/sales-documents/[id]        -> record an outcome
 *
 * PATCH body: { outcome: 'accepted' | 'declined' | 'expired', note?: string }
 *
 * Accepting is the moment a proposal becomes an invoice: it is the only point
 * at which a gapless invoice number is allocated. Quotes that never close
 * therefore leave no holes in the invoice sequence.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDB()
    const { id } = await params
    const item = await SalesDocument.findById(id)
    if (!item) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, item })
  } catch (err) {
    console.error('GET /api/sales-documents/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const outcome = body.outcome as string

    if (!['accepted', 'declined', 'expired'].includes(outcome)) {
      return NextResponse.json(
        { success: false, error: 'outcome must be accepted, declined or expired' },
        { status: 400 }
      )
    }

    const doc = await SalesDocument.findById(id)
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    // A closed document is frozen. Reopening it would break the invoice
    // sequence and the audit trail both.
    if (doc.outcome === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'This version has already been accepted and cannot be changed.' },
        { status: 409 }
      )
    }
    if (doc.outcome === 'superseded') {
      return NextResponse.json(
        {
          success: false,
          error: 'This version was superseded by a later one. Act on the current version instead.',
        },
        { status: 409 }
      )
    }

    const now = new Date()
    // auth.email is string | null | undefined; the schema field is string | undefined
    const actorEmail = auth.email ?? undefined

    if (outcome === 'accepted') {
      const alreadyClosed = await SalesDocument.findOne({
        revisionGroupId: doc.revisionGroupId,
        outcome: 'accepted',
      })
        .select('reference invoiceNumber')
        .lean()
      if (alreadyClosed) {
        return NextResponse.json(
          {
            success: false,
            error: `Deal already closed on ${(alreadyClosed as any).invoiceNumber || (alreadyClosed as any).reference}.`,
          },
          { status: 409 }
        )
      }

      doc.invoiceNumber = await allocateInvoiceNumber()
      doc.documentType = 'invoice'
      doc.acceptedAt = now
      doc.acceptedByEmail = actorEmail
      doc.auditTrail.push({
        at: now,
        actorEmail,
        action: 'accepted',
        detail: `Invoice ${doc.invoiceNumber} issued${body.note ? ' — ' + body.note : ''}`,
      })
    } else {
      doc.auditTrail.push({
        at: now,
        actorEmail,
        action: outcome,
        detail: body.note || undefined,
      })
    }

    doc.outcome = outcome as typeof doc.outcome
    if (body.note) doc.outcomeNote = body.note

    try {
      await doc.save()
    } catch (err: unknown) {
      // The partial unique index on (revisionGroupId, outcome: 'accepted') is
      // the real guard against two people closing the same deal at once.
      if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
        return NextResponse.json(
          { success: false, error: 'This deal was closed by someone else a moment ago. Reload to see it.' },
          { status: 409 }
        )
      }
      throw err
    }

    return NextResponse.json({ success: true, item: doc })
  } catch (err) {
    console.error('PATCH /api/sales-documents/[id] failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}
