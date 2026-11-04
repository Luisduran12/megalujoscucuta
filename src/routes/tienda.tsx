import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCategoriesList, type CategoryId } from "@/lib/catalog";
import { productsQuery, useProducts } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/tienda")({
  head: () => ({
    meta: [
      { title: "Tienda Virtual | Megalujos Cúcuta" },
      { name: "description", content: "Catálogo de lujos, tuning, iluminación y accesorios para tu motocicleta en Cúcuta." },
      { property: "og:title", content: "Tienda Virtual | Megalujos Cúcuta" },
      { property: "og:description", content: "Lujos y accesorios para motocicletas en Cúcuta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Tienda,
});

function Tienda() {
  const categories = useCategoriesList();
  const [filter, setFilter] = useState<string>("todos");
  const [q, setQ] = useState("");
  const products = useProducts();

  const filters = useMemo(() => {
    return [
      { id: "todos", name: "Todos" },
      ...categories.map((c) => ({ id: c.id, name: c.name })),
      { id: "outlet", name: "Outlet" },
    ];
  }, [categories]);

  const list = useMemo(() => {
    return products.filter((p) => {
      if (filter === "outlet" && !p.oldPrice) return false;
      if (filter !== "todos" && filter !== "outlet" && p.category !== filter) return false;
      return p.name.toLowerCase().includes(q.toLowerCase());
    });
  }, [filter, q, products]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="text-5xl font-bold">Tienda virtual</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar productos..."
        className="mt-6 h-12 w-full border border-input px-4 outline-none focus:border-primary"
      />
      <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 border px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
              filter === f.id ? "border-ink bg-ink text-ink-foreground" : "hover:border-ink"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{list.length} productos</p>
      <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
