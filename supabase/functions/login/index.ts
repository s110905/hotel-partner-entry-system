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
    const { account, password, role } = await req.json() as {
      account: string
      password: string
      role: 'partner' | 'admin'
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const table = role === 'partner' ? 'partners' : 'admin_users'

    const { data, error } = await supabase
      .from(table)
      .select('id, name, account, password_hash, status')
      .eq('account', account)
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: '帳號或密碼錯誤' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (data.status !== 'active') {
      return new Response(
        JSON.stringify({ error: '此帳號已停用' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const passwordMatch = await bcrypt.compare(password, data.password_hash)
    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: '帳號或密碼錯誤' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        name: data.name,
        account: data.account,
        role,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: '伺服器錯誤' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
