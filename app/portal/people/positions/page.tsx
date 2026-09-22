import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import PositionsEditor from '@/components/dashboard/PositionsEditor'

export const dynamic = 'force-dynamic'

/**
 * /portal/people/positions: the Positions register behind /careers, inside the same Fluent shell as the portal. The admin check
 * runs on the server, so the page cannot be reached by a non-admin.
 */
export default async function PortalPositionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/portal/login')
  if ((session.user as { role?: string }).role !== 'admin') redirect('/portal')

  return (
    <div data-theme="portal" className="min-h-screen bg-background">
      <Sidebar active="positions" />
      <div className="pt-14 lg:pl-[268px]">
        <Topbar page="positions" />
        <main className="mx-auto max-w-[1600px] space-y-6 px-5 pb-10 pt-4 md:px-8">
          <PositionsEditor />
        </main>
      </div>
    </div>
  )
}
