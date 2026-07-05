import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

function adminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return createClient(url, key)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { ids } = req.body ?? {}
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Missing ids' })

  const { error } = await adminClient().from('meter_readings').update({ hidden: true }).in('id', ids)
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
