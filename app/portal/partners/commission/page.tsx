import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManagePartners } from '@/lib/roles'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import CommissionSchedulePanel from '@/components/dashboard/CommissionSchedulePanel'

export const dynamic = 'force-dynamic'

/** /portal/partners/commission: the versioned partner commission schedule. Admin only. */
export default async function CommissionSchedulePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/portal/login')
  if (!canManagePartners((session.user as { role?: string }).role)) redirect('/portal')

  return (
    <div data-theme="portal" className="min-h-screen bg-background">
      <Sidebar active="partner_commission" />
      <div className="pt-14 lg:pl-[268px]">
        <Topbar page="partner_commission" />
        <main className="mx-auto max-w-[1600px] space-y-6 px-5 pb-10 pt-4 md:px-8">
          <CommissionSchedulePanel />
        </main>
      </div>
    </div>
  )
}
