import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Server-side Supabase client for PUBLIC reads (site config, categories).
 * Same pattern as products.functions.ts: uses only the publishable key and
 * falls back to null when the backend is not configured.
 */
function readClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key || key === "mock-key") return null;

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Stored design of the storefront (hero, banners, outlet). Null = never saved. */
export type StoredSiteConfig = { [key: string]: any };

export const getSiteConfigData = createServerFn({ method: "GET" }).handler(async (): Promise<StoredSiteConfig | null> => {
  const client = readClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("site_config")
      .select("data")
      .eq("id", "default")
      .maybeSingle();
    if (error || !data) return null;
    return data.data as StoredSiteConfig;
  } catch {
    return null;
  }
});

/** Categories of the store, in display order. Null = table unavailable. */
export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const client = readClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("categories")
      .select("id, name, image_url, sort_order")
      .order("sort_order", { ascending: true });
    if (error || !data) return null;
    return data as { id: string; name: string; image_url: string | null; sort_order: number }[];
  } catch {
    return null;
  }
});
