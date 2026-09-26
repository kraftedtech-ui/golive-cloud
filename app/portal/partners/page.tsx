import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManagePartners } from '@/lib/roles'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import PartnersPanel from '@/components/dashboard/PartnersPanel'

export const dynamic = 'force-dynamic'

/**
 * /portal/partners: GoLive Partner Network applications, inside the same Fluent
 * shell as the portal. Admin only, checked on the server.
 */
export default async function PortalPartnersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/portal/login')
  if (!canManagePartners((session.user as { role?: string }).role)) redirect('/portal')

  return (
    <div data-theme="portal" className="min-h-screen bg-background">
      <Sidebar active="partners" />
      <div className="pt-14 lg:pl-[268px]">
        <Topbar page="partners" />
        <main className="mx-auto max-w-[1600px] space-y-6 px-5 pb-10 pt-4 md:px-8">
          <PartnersPanel />
        </main>
      </div>
    </div>
  )
}
