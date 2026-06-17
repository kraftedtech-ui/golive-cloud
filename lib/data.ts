export type PipelineStage = "new-lead" | "assessment-done" | "quote-sent" | "negotiating" | "won"

export const STAGES: { id: PipelineStage; label: string }[] = [
  { id: "new-lead", label: "New Lead" },
  { id: "assessment-done", label: "Assessment Done" },
  { id: "quote-sent", label: "Quote Sent" },
  { id: "negotiating", label: "Negotiating" },
  { id: "won", label: "Won" },
]

export type Deal = {
  id: string; company: string; country: string; flag: string
  users: number; ref: string; stage: PipelineStage; value: number; owner: string
}

export const deals: Deal[] = [
  { id: "1", company: "Kilimanjaro Logistics", country: "Tanzania", flag: "🇹🇿", users: 48, ref: "GL-2041", stage: "new-lead", value: 720, owner: "AM" },
  { id: "2", company: "Sahara FinTech", country: "Egypt", flag: "🇪🇬", users: 120, ref: "GL-2042", stage: "new-lead", value: 1840, owner: "TK" },
  { id: "3", company: "Accra Health Group", country: "Ghana", flag: "🇬🇭", users: 65, ref: "GL-2039", stage: "assessment-done", value: 980, owner: "NB" },
  { id: "4", company: "Rift Valley Agro", country: "Kenya", flag: "🇰🇪", users: 32, ref: "GL-2036", stage: "assessment-done", value: 540, owner: "AM" },
  { id: "5", company: "Lagos Media House", country: "Nigeria", flag: "🇳🇬", users: 210, ref: "GL-2030", stage: "quote-sent", value: 3150, owner: "TK" },
  { id: "6", company: "Cape Solar Energy", country: "South Africa", flag: "🇿🇦", users: 88, ref: "GL-2028", stage: "quote-sent", value: 1320, owner: "NB" },
  { id: "7", company: "Kigali Smart City", country: "Rwanda", flag: "🇷🇼", users: 150, ref: "GL-2021", stage: "negotiating", value: 2400, owner: "AM" },
  { id: "8", company: "Atlas Manufacturing", country: "Morocco", flag: "🇲🇦", users: 95, ref: "GL-2019", stage: "negotiating", value: 1580, owner: "TK" },
  { id: "9", company: "Victoria Falls Resorts", country: "Zambia", flag: "🇿🇲", users: 54, ref: "GL-2012", stage: "won", value: 860, owner: "NB" },
  { id: "10", company: "Nairobi Edu Trust", country: "Kenya", flag: "🇰🇪", users: 320, ref: "GL-2008", stage: "won", value: 4100, owner: "AM" },
]

export type Lead = {
  company: string; country: string; flag: string; contact: string
  package: string; users: number; status: "Hot" | "Warm" | "Cold"; added: string
}

export const recentLeads: Lead[] = [
  { company: "Kilimanjaro Logistics", country: "Tanzania", flag: "🇹🇿", contact: "Joseph Mwangi", package: "Microsoft 365 E3", users: 48, status: "Hot", added: "2h ago" },
  { company: "Sahara FinTech", country: "Egypt", flag: "🇪🇬", contact: "Layla Hassan", package: "Microsoft 365 E5", users: 120, status: "Hot", added: "5h ago" },
  { company: "Accra Health Group", country: "Ghana", flag: "🇬🇭", contact: "Kwame Mensah", package: "Business Premium", users: 65, status: "Warm", added: "1d ago" },
  { company: "Rift Valley Agro", country: "Kenya", flag: "🇰🇪", contact: "Grace Wanjiru", package: "Business Standard", users: 32, status: "Warm", added: "1d ago" },
  { company: "Cape Solar Energy", country: "South Africa", flag: "🇿🇦", contact: "Pieter van Wyk", package: "Microsoft 365 E3", users: 88, status: "Cold", added: "2d ago" },
  { company: "Atlas Manufacturing", country: "Morocco", flag: "🇲🇦", contact: "Youssef Alami", package: "Azure + M365", users: 95, status: "Warm", added: "3d ago" },
]

export const mrrByCountry = [
  { country: "Kenya", flag: "🇰🇪", mrr: 18400 },
  { country: "Nigeria", flag: "🇳🇬", mrr: 14200 },
  { country: "South Africa", flag: "🇿🇦", mrr: 11800 },
  { country: "Egypt", flag: "🇪🇬", mrr: 8600 },
  { country: "Ghana", flag: "🇬🇭", mrr: 6100 },
  { country: "Morocco", flag: "🇲🇦", mrr: 4300 },
]

export const mrrByPackage = [
  { name: "Microsoft 365 E5", value: 24800, fill: "var(--chart-1)" },
  { name: "Microsoft 365 E3", value: 18200, fill: "var(--chart-2)" },
  { name: "Business Premium", value: 12400, fill: "var(--chart-4)" },
  { name: "Azure Consumption", value: 6900, fill: "var(--chart-3)" },
  { name: "Business Standard", value: 3100, fill: "var(--chart-5)" },
]

export const stats = [
  { label: "Total MRR", value: "$63,400", change: "+12.4%", trend: "up" as const, hint: "vs last month", spark: [42,45,44,49,52,51,56,58,57,61,63] },
  { label: "Active Customers", value: "184", change: "+8", trend: "up" as const, hint: "across 11 countries", spark: [160,163,165,168,170,172,175,176,179,182,184] },
  { label: "New Leads this week", value: "27", change: "+5", trend: "up" as const, hint: "6 marked hot", spark: [12,18,14,22,19,25,21,28,24,23,27] },
  { label: "Renewal alerts", value: "9", change: "Due ≤ 30 days", trend: "alert" as const, hint: "$8,200 at risk", spark: [3,4,4,5,6,6,7,8,8,9,9] },
]
