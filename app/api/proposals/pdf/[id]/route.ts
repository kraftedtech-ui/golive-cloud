import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import { SalesDocument } from '@/models/SalesDocument'
import { renderPdfFromHtml, archiveHeaderTemplate } from '@/lib/renderPdf'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/proposals/pdf/[id]
 *
 * Re-downloads a previously issued proposal or invoice from the HTML stored
 * on the document at the time it was generated.
 *
 * This renders the ARCHIVED document, not a fresh one. A proposal issued last
 * month reproduces last month's figures and last month's exchange rate, which
 * is the whole point of an archive — it is the record of what the customer
 * actually received, and it is what the six-year retention requirement is
 * for. Regenerating from current data would quietly rewrite history.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    await connectDB()

    const doc = await SalesDocument.findById(id)
      .select('renderedHtml reference invoiceNumber buyerName')
      .lean()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const d = doc as unknown as {
      renderedHtml?: string
      reference: string
      invoiceNumber?: string
      buyerName: string
    }

    if (!d.renderedHtml) {
      // Versions issued before archiving was added have no stored copy.
      return NextResponse.json(
        {
          error:
            'No archived copy exists for this version. It was issued before documents were archived — generate a new version instead.',
        },
        { status: 409 }
      )
    }

    const label = d.invoiceNumber || d.reference

    const pdf = await renderPdfFromHtml(
      d.renderedHtml,
      archiveHeaderTemplate(d.buyerName, label)
    )

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${label}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[proposals/pdf/[id]] render failed:', err)
    return NextResponse.json({ error: 'Could not generate the PDF' }, { status: 500 })
  }
}
