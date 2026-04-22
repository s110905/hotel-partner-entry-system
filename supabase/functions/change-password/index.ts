import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://esm.sh/bcryptjs@2.4.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { id, role, currentPassword, newPassword } = await req.json() as {
      id: string
      role: 'partner' | 'admin'
      currentPassword: string
      newPassword: string
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const table = role === 'partner' ? 'partners' : 'admin_users'

    const { data, error } = await supabase
      .from(table)
      .select('password_hash')
      .eq('id', id)
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: '帳號不存在' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const match = await bcrypt.compare(currentPassword, data.password_hash)
    if (!match) {
      return new Response(
        JSON.stringify({ error: '目前密碼錯誤' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: '新密碼至少需要 6 個字元' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await supabase.from(table).update({ password_hash: newHash }).eq('id', id)

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: '伺服器錯誤' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
