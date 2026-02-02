import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type SupabaseAdminResult =
  | { client: SupabaseClient; error: null }
  | { client: null; error: string }

let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseAdminResult {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    return { client: null, error: 'SUPABASE_URL não configurado' }
  }
  if (!serviceRoleKey) {
    return { client: null, error: 'SUPABASE_SERVICE_ROLE_KEY não configurado' }
  }

  if (!cached) {
    cached = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }

  return { client: cached, error: null }
}
