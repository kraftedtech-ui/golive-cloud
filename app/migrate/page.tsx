import MigrateClient from './MigrateClient'
import { getPublicPackages } from '@/lib/publicProductData'

// Same caching approach as the landing page — pricing rarely changes, no
// need to hit the database on every visitor's page load.
export const revalidate = 3600

export default async function MigratePage() {
  const pricing = await getPublicPackages()
  return <MigrateClient pricing={pricing} />
}
