import * as XLSX from 'xlsx'

export type ParsedPricingRow = {
  distributor: string
  productId: string
  skuTitle: string
  termDuration: string
  billingPlan: 'Monthly' | 'Annual' | 'Triennial' | 'None'
  customerType: 'corporate' | 'academic' | 'charity'
  retailUSD: number
  resellerUSD: number
  marginUSD: number
  marginPercent: number
  segment?: string
  solutionArea?: string
  granularWorkload?: string
}

export type ParseResult = {
  rows: ParsedPricingRow[]
  warnings: string[]
  sheetCounts: Record<string, number>
}

// Fixed column order shared by the Corporate / Academic / Charity tabs in the
// 4Sight Dynamics Africa CSP reference pricelist. We read by position rather
// than header name because "Reseller  USD" has an inconsistent double space
// and "Product Id" vs "Product ID" differs by sheet.
const COL = {
  productId: 0,
  skuTitle: 1,
  termDuration: 2,
  billingPlan: 3,
  retailUSD: 4,
  resellerUSD: 5,
  marginUSD: 6,
  segment: 7,
  solutionArea: 8,
  granularWorkload: 9,
}

const SHEET_TO_CUSTOMER_TYPE: Record<string, ParsedPricingRow['customerType']> = {
  Corporate: 'corporate',
  Academic: 'academic',
  Charity: 'charity',
}

function normalizeBillingPlan(value: unknown): ParsedPricingRow['billingPlan'] {
  const s = String(value ?? '').trim()
  if (s === 'Monthly' || s === 'Annual' || s === 'Triennial') return s
  return 'None'
}

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

/**
 * Parses the distributor pricelist workbook (Buffer) into normalized rows.
 * Only the Corporate / Academic / Charity tabs are imported — the ISV
 * category tabs (Security, Human Resources, etc.) are reference-only and
 * not priced per-SKU in the same structure.
 */
export function parsePricelistWorkbook(buffer: Buffer, distributor = '4Sight Dynamics Africa'): ParseResult {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const rows: ParsedPricingRow[] = []
  const warnings: string[] = []
  const sheetCounts: Record<string, number> = {}

  for (const [sheetName, customerType] of Object.entries(SHEET_TO_CUSTOMER_TYPE)) {
    const sheet = wb.Sheets[sheetName]
    if (!sheet) {
      warnings.push(`Sheet "${sheetName}" not found in workbook — skipped.`)
      continue
    }

    const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false })
    let count = 0

    // Row 0 is the header row; data starts at row 1.
    for (let i = 1; i < raw.length; i++) {
      const r = raw[i]
      const skuTitle = String(r[COL.skuTitle] ?? '').trim()
      const productId = String(r[COL.productId] ?? '').trim()
      if (!skuTitle || !productId) continue // skip blank/section-break rows

      const retailUSD = toNumber(r[COL.retailUSD])
      const resellerUSD = toNumber(r[COL.resellerUSD])
      const marginUSD = toNumber(r[COL.marginUSD])
      const marginPercent = retailUSD > 0 ? marginUSD / retailUSD : 0

      rows.push({
        distributor,
        productId,
        skuTitle,
        termDuration: String(r[COL.termDuration] ?? '').trim() || 'P1M',
        billingPlan: normalizeBillingPlan(r[COL.billingPlan]),
        customerType,
        retailUSD,
        resellerUSD,
        marginUSD,
        marginPercent,
        segment: r[COL.segment] ? String(r[COL.segment]).trim() : undefined,
        solutionArea: r[COL.solutionArea] ? String(r[COL.solutionArea]).trim() : undefined,
        granularWorkload: r[COL.granularWorkload] ? String(r[COL.granularWorkload]).trim() : undefined,
      })
      count++
    }

    sheetCounts[sheetName] = count
    if (count === 0) warnings.push(`Sheet "${sheetName}" parsed but yielded zero priced rows — check the source file.`)
  }

  if (rows.length === 0) {
    warnings.push('No rows parsed at all. Confirm this is the 4Sight Dynamics Africa CSP reference pricelist with Corporate/Academic/Charity tabs.')
  }

  return { rows, warnings, sheetCounts }
}
