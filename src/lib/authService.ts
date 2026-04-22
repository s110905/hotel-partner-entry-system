import { supabase } from './supabase'

export type AuthRole = 'partner' | 'admin'

export type AuthSession = {
  role: AuthRole
  id: string
  name: string
  account: string
}

export async function loginPartner(account: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, account, password_hash, status')
    .eq('account', account)
    .single()

  if (error || !data) throw new Error('帳號不存在')
  if (data.status !== 'active') throw new Error('此帳號已停用')
  if (data.password_hash !== password) throw new Error('密碼錯誤')

  return { role: 'partner', id: data.id, name: data.name, account: data.account }
}

export async function loginAdmin(account: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, name, account, password_hash, status')
    .eq('account', account)
    .single()

  if (error || !data) throw new Error('帳號不存在')
  if (data.status !== 'active') throw new Error('此帳號已停用')
  if (data.password_hash !== password) throw new Error('密碼錯誤')

  return { role: 'admin', id: data.id, name: data.name, account: data.account }
}
