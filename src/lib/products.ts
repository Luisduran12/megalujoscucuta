import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "./products.functions";
import { fallbackProducts, rowToProduct, type ProductRow } from "./catalog";

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("moto_demo_products_v3");
      if (stored) {
        try {
          return JSON.parse(stored) as ProductRow[];
        } catch {}
      }
      // Initialize with latest catalog
      localStorage.setItem("moto_demo_products_v3", JSON.stringify(fallbackProducts));
      return fallbackProducts;
    }
    return listProducts();
  },
  staleTime: 30_000,
});

export function useProducts() {
  const { data } = useSuspenseQuery(productsQuery);
  return data.map(rowToProduct);
}
