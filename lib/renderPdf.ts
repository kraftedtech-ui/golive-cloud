import { proposalFooterTemplate } from './proposalTemplate'

/**
 * Renders a complete HTML document to a PDF buffer with headless Chrome.
 *
 * Shared by the generate route (renders from a live payload) and the archive
 * route (renders from the HTML stored on the SalesDocument), so a re-download
 * is byte-identical in layout to what the customer originally received.
 */
export async function renderPdfFromHtml(
  html: string,
  headerHtml: string
): Promise<Buffer> {
  const puppeteer = (await import('puppeteer')).default

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    // setContent applies screen styles unless told otherwise.
    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerHtml,
      footerTemplate: proposalFooterTemplate(),
      // Must match the @page margins in the template or the running header
      // and footer overlap the body.
      margin: { top: '20mm', bottom: '18mm', left: '18mm', right: '18mm' },
      preferCSSPageSize: false,
    })

    return Buffer.from(pdf)
  } finally {
    // A leaked Chromium survives the request and accumulates until the box
    // runs out of memory.
    if (browser) {
      try { await browser.close() } catch { /* already gone */ }
    }
  }
}

/** Minimal running header for an archived document. */
export function archiveHeaderTemplate(company: string, reference: string): string {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
    )
  return `
    <div style="width:100%;font-family:'Liberation Sans',Arial,sans-serif;font-size:7pt;
                color:#8a99a5;padding:0 18mm;display:flex;justify-content:space-between;">
      <span>${esc(company)}</span>
      <span>${esc(reference)}</span>
    </div>`
}
