import { createBrowserClient } from '@supabase/ssr';

// Create client - let @supabase/ssr handle cookies automatically
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found in environment variables');
  }

  // Don't override cookie handling - let the library handle it
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
