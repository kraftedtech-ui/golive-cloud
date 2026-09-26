import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import DealsPanel from '@/components/dashboard/DealsPanel'

export const dynamic = 'force-dynamic'

/** /portal/partners/deals: partner deal registrations. Admin only. */
export default async function PartnerDealsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/portal/login')
  if ((session.user as { role?: string }).role !== 'admin') redirect('/portal')

  return (
    <div data-theme="portal" className="min-h-screen bg-background">
      <Sidebar active="partner_deals" />
      <div className="pt-14 lg:pl-[268px]">
        <Topbar page="partner_deals" />
        <main className="mx-auto max-w-[1600px] space-y-6 px-5 pb-10 pt-4 md:px-8">
          <DealsPanel />
        </main>
      </div>
    </div>
  )
}
