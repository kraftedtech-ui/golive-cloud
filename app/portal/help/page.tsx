import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import HelpCenter from '@/components/dashboard/HelpCenter'

export const dynamic = 'force-dynamic'

/** /portal/help: role-based SOP and how-to guides. Every signed-in officer. */
export default async function HelpPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/portal/login')
  const role = (session.user as { role?: string }).role || 'viewer'

  return (
    <div data-theme="portal" className="min-h-screen bg-background">
      <Sidebar active="help" />
      <div className="pt-14 lg:pl-[268px]">
        <Topbar page="help" />
        <main className="mx-auto max-w-[1600px] space-y-6 px-5 pb-10 pt-4 md:px-8">
          <HelpCenter role={role} />
        </main>
      </div>
    </div>
  )
}
