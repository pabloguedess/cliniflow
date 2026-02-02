import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    return { client: null, error: 'SUPABASE_URL não configurado' as const }
  }
  if (!serviceRoleKey) {
    return { client: null, error: 'SUPABASE_SERVICE_ROLE_KEY não configurado' as const }
  }

  if (!cached) {
    cached = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }

  return { client: cached, error: null as const }
}
