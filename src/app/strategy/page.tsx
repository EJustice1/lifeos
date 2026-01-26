import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StrategyHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Redirect to Vision page (new strategy view)
  redirect('/vision')
}
