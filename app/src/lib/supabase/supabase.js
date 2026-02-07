import { createClient } from '@supabase/supabase-js'

let supabase = null

export function getSupabase() {
  if (supabase) return supabase

  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  supabase = createClient(url, key)
  return supabase
}