import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { name, account } = await req.json() as { name: string; account: string }

    if (!name || !account) {
      return new Response(
        JSON.stringify({ error: '名稱與帳號為必填' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const passwordHash = await bcrypt.hash('1234', 12)

    const { data, error } = await supabase
      .from('partners')
      .insert({ name, account, password_hash: passwordHash, status: 'active' })
      .select('id, name, account')
      .single()

    if (error) {
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ error: '此帳號已存在' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw error
    }

    return new Response(
      JSON.stringify({ ok: true, partner: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: '伺服器錯誤' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
