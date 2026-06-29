import { CurrencyProvider } from "@/components/currency-context"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { TrustBar } from "@/components/trust-bar"
import { Packages } from "@/components/packages"
import { Verticals } from "@/components/verticals"
import { Migration } from "@/components/migration"
import { Markets } from "@/components/markets"
import { AssessmentSection } from "@/components/assessment-section"
import { Footer } from "@/components/footer"
import { getPublicPackages, getPublicFxRates } from "@/lib/publicProductData"

// Pricing/FX data is server-fetched and cached for an hour rather than hit on
// every single visitor's page load — it only changes when the catalog or the
// FX feed updates (FX itself refreshes at most every 6h), so this is plenty fresh.
export const revalidate = 3600

export default async function Page() {
  const [packages, fxRates] = await Promise.all([getPublicPackages(), getPublicFxRates()])

  return (
    <CurrencyProvider liveRates={fxRates}>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Packages packages={packages} />
        <Verticals />
        <Migration />
        <Markets />
        <AssessmentSection />
      </main>
      <Footer />
    </CurrencyProvider>
  )
}
