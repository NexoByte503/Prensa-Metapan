import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return Response.json({ error: 'Método no permitido.' }, { status: 405, headers: corsHeaders })

  const authorization = request.headers.get('Authorization')
  const token = authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return Response.json({ error: 'Se requiere una sesión.' }, { status: 401, headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return Response.json({ error: 'La función no está configurada.' }, { status: 500, headers: corsHeaders })
  }

  const authClient = createClient(supabaseUrl, anonKey)
  const { data: authData, error: authError } = await authClient.auth.getUser(token)
  if (authError || !authData.user) return Response.json({ error: 'Sesión inválida.' }, { status: 401, headers: corsHeaders })

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const { data: profile, error: profileError } = await adminClient
    .from('profiles').select('role').eq('id', authData.user.id).maybeSingle()
  if (profileError || profile?.role !== 'admin') {
    return Response.json({ error: 'Solo un administrador puede invitar editores.' }, { status: 403, headers: corsHeaders })
  }

  let payload: { email?: unknown; fullName?: unknown }
  try { payload = await request.json() } catch {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400, headers: corsHeaders })
  }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName || fullName.length > 120) {
    return Response.json({ error: 'Escribe un nombre y correo válidos.' }, { status: 400, headers: corsHeaders })
  }

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  })
  if (inviteError) return Response.json({ error: inviteError.message }, { status: 400, headers: corsHeaders })

  return Response.json({ ok: true }, { status: 200, headers: corsHeaders })
})
