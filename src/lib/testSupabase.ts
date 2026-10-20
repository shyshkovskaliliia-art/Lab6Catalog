import { supabase } from './supabase';

export async function testSupabaseConnection() {
  const { data, error } = await supabase.from('categories').select('id, name').limit(5);
  if (error) {
    console.log('❌ Помилка Supabase:', error);
    return { success: false, message: error.message };
  }
  console.log('✅ Supabase підключено! Категорії:', data);
  return { success: true, data };
}
