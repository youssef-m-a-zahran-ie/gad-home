import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";
import { createMockClient, MOCK } from "./mock";

/** Supabase client with the admin's session (Server Components, Server Actions, Route Handlers). */
export async function createClient(): Promise<SupabaseClient<Database>> {
  if (MOCK) return createMockClient();
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client for store pages: no cookies, so shoppers never touch auth. */
export function createPublicClient(): SupabaseClient<Database> {
  if (MOCK) return createMockClient();
  return createPlainClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
