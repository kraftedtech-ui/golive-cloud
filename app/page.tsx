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

export default function Page() {
  return (
    <CurrencyProvider>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Packages />
        <Verticals />
        <Migration />
        <Markets />
        <AssessmentSection />
      </main>
      <Footer />
    </CurrencyProvider>
  )
}
