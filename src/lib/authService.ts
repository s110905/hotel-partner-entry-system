import { supabase } from './supabase'

export type AuthRole = 'partner' | 'admin'

export type AuthSession = {
  role: AuthRole
  id: string
  name: string
  account: string
}

async function loginViaEdgeFunction(
  account: string,
  password: string,
  role: AuthRole
): Promise<AuthSession> {
  const { data, error } = await supabase.functions.invoke('login', {
    body: { account, password, role },
  })

  if (error) throw new Error('登入失敗，請稍後再試')
  if (data?.error) throw new Error(data.error)

  return { ...data, role } as AuthSession
}

export async function loginPartner(account: string, password: string): Promise<AuthSession> {
  return loginViaEdgeFunction(account, password, 'partner')
}

export async function loginAdmin(account: string, password: string): Promise<AuthSession> {
  return loginViaEdgeFunction(account, password, 'admin')
}
