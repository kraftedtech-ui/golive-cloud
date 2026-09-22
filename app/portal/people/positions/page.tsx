import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import PositionsEditor from "@/components/dashboard/PositionsEditor"

export const dynamic = 'force-dynamic'

/**
 * /portal/people/positions: the Positions register behind /careers.
 *
 * Deliberately independent of the single-page portal shell: the admin check
 * runs on the SERVER (getServerSession), and the page shell is server-rendered,
 * so this screen cannot be hidden by sidebar state, client page state, or a
 * stale client bundle. It is also verifiable with curl from the server.
 */
export default async function PortalPositionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/portal/login')
  if ((session.user as { role?: string }).role !== 'admin') redirect('/portal')

  return (
    <div data-theme="portal" className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              GoLive Cloud portal
            </p>
            <h1 className="text-lg font-semibold text-gray-900">Positions</h1>
          </div>
          <Link
            href="/portal/people"
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-border hover:bg-gray-50"
          >
            Back to People
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] space-y-6 px-5 py-6 md:px-8">
        <PositionsEditor />
      </main>
    </div>
  )
}
