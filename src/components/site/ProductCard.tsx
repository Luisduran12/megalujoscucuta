import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { discountPercent, formatCOP, type Product, type ProductColor } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const off = discountPercent(product);
  const colors = product.colors || [];
  const firstColor = colors.length > 0 ? (colors[0] ?? null) : null;
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(firstColor);

  useEffect(() => {
    if (colors.length > 0 && (!selectedColor || !colors.some((c) => c.name === selectedColor.name))) {
      setSelectedColor(colors[0] ?? null);
    } else if (colors.length === 0) {
      setSelectedColor(null);
    }
  }, [colors, selectedColor]);

  const currentImage = selectedColor?.image || product.image;

  return (
    <article className="group flex flex-col h-full justify-between">
      <div>
        <div className="relative aspect-square overflow-hidden bg-background border rounded-xs">
          {off > 0 && (
            <span className="absolute left-2 top-2 z-10 bg-primary px-2 py-1 font-display text-xs font-bold text-primary-foreground shadow">
              -{off}%
            </span>
          )}

          {selectedColor && (
            <span className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-0.5 text-[10px] text-ink-foreground backdrop-blur-xs font-medium">
              <span
                className="h-2 w-2 rounded-full border border-white/40 shrink-0"
                style={{
                  background: selectedColor.hex?.includes("gradient")
                    ? selectedColor.hex
                    : selectedColor.hex || "#71717a",
                }}
              />
              <span className="truncate max-w-[100px]">{selectedColor.name}</span>
            </span>
          )}

          <img
            src={currentImage}
            alt={`${product.name} ${selectedColor ? `- ${selectedColor.name}` : ""}`}
            loading="lazy"
            width={816}
            height={816}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />

          <button
            onClick={() => add(product, selectedColor?.name)}
            className="absolute inset-x-0 bottom-0 translate-y-full bg-ink py-3 font-display text-sm uppercase tracking-wide text-ink-foreground transition-transform duration-300 hover:bg-primary group-hover:translate-y-0 cursor-pointer"
          >
            Agregar al carrito {selectedColor ? `(${selectedColor.name})` : ""}
          </button>
        </div>

        <h3 className="mt-3 font-sans text-sm font-semibold uppercase leading-snug line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{product.ref}</p>

        {/* Color Variants Swatches */}
        {colors.length > 0 && (
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {colors.map((c) => {
                const isSelected = selectedColor?.name === c.name;
                const isGradient = c.hex?.includes("gradient");

                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    title={c.name}
                    aria-label={`Color ${c.name}`}
                    className={`relative h-5 w-5 rounded-full transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-sm"
                        : "opacity-80 hover:opacity-100 hover:scale-105 border border-muted-foreground/30"
                    }`}
                    style={{
                      background: isGradient ? c.hex : c.hex || "#71717a",
                    }}
                  />
                );
              })}
            </div>
            {selectedColor && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Color: <span className="text-foreground font-semibold">{selectedColor.name}</span>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-base text-foreground">{formatCOP(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCOP(product.oldPrice)}
            </span>
          )}
        </div>

        <button
          onClick={() => add(product, selectedColor?.name)}
          className="mt-2.5 w-full border border-ink py-2 font-display text-xs uppercase tracking-wide transition-colors hover:bg-ink hover:text-ink-foreground lg:hidden cursor-pointer"
        >
          Agregar {selectedColor ? `• ${selectedColor.name}` : ""}
        </button>
      </div>
    </article>
  );
}
