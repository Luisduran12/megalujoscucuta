import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function ProductRow({ title, products, cta = "Conócelos todos" }: { title: string; products: Product[]; cta?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        <div className="flex items-center gap-3">
          <Link to="/tienda" className="hidden font-display text-sm uppercase tracking-wide underline underline-offset-4 hover:text-primary sm:block">
            {cta}
          </Link>
          <button aria-label="Anterior" onClick={() => scroll(-1)} className="border p-2 hover:bg-ink hover:text-ink-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button aria-label="Siguiente" onClick={() => scroll(1)} className="border p-2 hover:bg-ink hover:text-ink-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="scrollbar-none -mx-4 flex snap-x gap-6 overflow-x-auto px-4">
        {products.map((p) => (
          <div key={p.id} className="w-[70%] shrink-0 snap-start sm:w-[40%] lg:w-[calc(25%-18px)]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
