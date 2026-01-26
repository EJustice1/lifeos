import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StrategyHubClient } from './StrategyHubClient'

export default async function StrategyHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <StrategyHubClient />
}
