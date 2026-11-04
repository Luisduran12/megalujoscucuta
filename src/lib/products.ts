import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "./products.functions";
import { rowToProduct } from "./catalog";

export const productsQuery = queryOptions({
  queryKey: ["products"],
  // The catalog always comes from the Supabase `products` table (public read).
  // No localStorage copy: what the admin saves is what every customer sees.
  queryFn: () => listProducts(),
  staleTime: 30_000,
});

export function useProducts() {
  const { data } = useSuspenseQuery(productsQuery);
  return data.map(rowToProduct);
}
