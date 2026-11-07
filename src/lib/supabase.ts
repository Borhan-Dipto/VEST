import { createServerClient, createBrowserClient } from '@supabase/ssr';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Server client that carries the visitor's session (used by admin + account). */
export async function serverClient() {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  return createServerClient(URL, KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {}
      },
    },
  });
}

/** Cookie-less client for public catalog reads (cacheable). */
export function publicClient() {
  return createServerClient(URL, KEY, { cookies: { getAll: () => [], setAll: () => {} } });
}

export function browserClient() {
  return createBrowserClient(URL, KEY);
}
