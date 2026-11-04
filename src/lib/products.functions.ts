import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fallbackProducts, type ProductRow } from "./catalog";

/** Public read of the catalog (prices, names, images). Safe for anyone. */
export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key || key === "mock-key") {
    return fallbackProducts;
  }

  try {
    const client = createClient<Database>(url, key, {
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
    const { data, error } = await client
      .from("products")
      .select("id, ref, name, price, old_price, category, image_key, image_url, sort_order, colors")
      .order("sort_order", { ascending: true });

    if (error || !data) {
      console.warn("Supabase products fetch failed, falling back to local catalog:", error?.message);
      return fallbackProducts;
    }
    return data as ProductRow[];
  } catch (err) {
    console.warn("Supabase query error, falling back to local catalog:", err);
    return fallbackProducts;
  }
});
