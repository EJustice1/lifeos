import { createClient } from '@supabase/supabase-js'

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

/**
 * Returns the Supabase admin client with service role privileges.
 * Uses lazy initialization to avoid build-time errors when env vars aren't set.
 * This should only be used in server-side code (Server Actions, API routes).
 */
export function getSupabaseAdmin() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey)
  return supabaseAdminInstance
}
