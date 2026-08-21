import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { requireSession } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import { SalesDocument } from '@/models/SalesDocument'
import {
  renderProposalHtml,
  proposalHeaderTemplate,
  proposalFooterTemplate,
  type ProposalData,
} from '@/lib/proposalTemplate'

export const dynamic = 'force-dynamic'
// Chromium start-up plus render. Comfortably over what a two-page document
// needs, but a cold launch after a restart is slower than a warm one.
export const maxDuration = 60

/**
 * POST /api/proposals/pdf
 *
 * Renders the proposal document to PDF with headless Chrome.
 *
 * The payload is built client-side and posted here rather than re-derived
 * from the SalesDocument, deliberately: every figure on the document comes
 * from the same computation the rep saw on screen. Re-deriving server-side
 * would mean a second implementation of the totals pipeline, and a second
 * implementation is how the preview, the print output and the archived
 * record drifted apart in the first place.
 *
 * The reference must be a saved document reference — the caller saves the
 * version first, so the number the customer quotes on their transfer always
 * matches a record.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let browser: Awaited<ReturnType<typeof import('puppeteer').launch>> | null = null

  try {
    const data = (await req.json()) as ProposalData

    if (!data?.reference || !data?.buyer?.company) {
      return NextResponse.json(
        { error: 'reference and buyer.company are required' },
        { status: 400 }
      )
    }

    // Chromium has no base URL when given setContent, so a relative image
    // path resolves to nothing. Inline the logo instead — it also removes a
    // network round trip from every render.
    if (!data.logoDataUri) {
      try {
        const logo = await readFile(
          path.join(process.cwd(), 'public', 'images', 'logo-dark-trimmed.png')
        )
        data.logoDataUri = `data:image/png;base64,${logo.toString('base64')}`
      } catch {
        // A missing logo should not stop a proposal going out.
        console.warn('[proposals/pdf] logo not found — rendering without it')
      }
    }

    const puppeteer = (await import('puppeteer')).default
    browser = await puppeteer.launch({
      // No sandbox: this runs as an unprivileged service account inside a
      // trusted container, and the sandbox needs kernel features the host
      // does not expose. dev-shm is small by default and Chromium will
      // crash under it on larger documents.
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })

    const html = renderProposalHtml(data)
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    // Chromium applies screen styles to setContent by default.
    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: proposalHeaderTemplate(data),
      footerTemplate: proposalFooterTemplate(),
      // Must match the @page margins in the template, or the running header
      // and footer overlap the body text.
      margin: { top: '20mm', bottom: '18mm', left: '18mm', right: '18mm' },
      preferCSSPageSize: false,
    })

    await browser.close()
    browser = null

    // Archive the document exactly as rendered. Without this a re-download
    // would rebuild from current catalog pricing and today's FX rate, which
    // would silently rewrite what the customer was actually sent — and this
    // record is retained for six years.
    const documentId = (data as unknown as { documentId?: string }).documentId
    if (documentId) {
      try {
        await connectDB()
        await SalesDocument.findByIdAndUpdate(documentId, {
          $set: { renderedHtml: html },
          $push: {
            auditTrail: {
              at: new Date(),
              actorEmail: auth.email ?? undefined,
              action: 'pdf_generated',
              detail: `Document rendered and archived (${(pdf.length / 1024).toFixed(0)} KB)`,
            },
          },
        })
      } catch (e) {
        // A failed archive must not stop the rep sending the proposal.
        console.error('[proposals/pdf] could not archive rendered document:', e)
      }
    }

    const filename = `${data.reference}.pdf`

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[proposals/pdf] render failed:', err)
    return NextResponse.json({ error: 'Could not generate the PDF' }, { status: 500 })
  } finally {
    // A leaked Chromium process survives the request and accumulates until
    // the box runs out of memory.
    if (browser) {
      try { await browser.close() } catch { /* already gone */ }
    }
  }
}
