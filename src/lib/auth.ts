import { supabase } from './supabase';

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) {
    return { success: false as const, message: error?.message || 'Не вдалося увійти.' };
  }
  return { success: true as const, user: data.user };
}
