import { Link } from "@tanstack/react-router";
import { MessageCircle, Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatCOP } from "@/lib/catalog";
import { openDirectWhatsApp } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

export const FREE_SHIPPING_FROM = 300000;

export function CartDrawer() {
  const { open, setOpen, lines, total, setQty, remove } = useCart();
  if (!open) return null;
  const missing = Math.max(0, FREE_SHIPPING_FROM - total);

  const handleWhatsAppCheckout = () => {
    if (lines.length === 0) return;
    const itemsList = lines
      .map(
        (l) =>
          `• ${l.qty}x ${l.product.name}${l.selectedColor ? ` [Color: ${l.selectedColor}]` : ""} (${formatCOP(l.product.price * l.qty)})`
      )
      .join("\n");
    const message = `¡Hola Megalujos Cúcuta! Deseo realizar el siguiente pedido:\n\n${itemsList}\n\n*Total:* ${formatCOP(total)}\n\n¿Tienen disponibilidad para entrega en Cúcuta o envío?`;
    openDirectWhatsApp(message);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-xs" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-card animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-2xl font-bold font-display uppercase tracking-wide">Tu carrito</h2>
          <button aria-label="Cerrar carrito" onClick={() => setOpen(false)} className="hover:text-primary transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <h3 className="text-2xl font-bold font-display">Tu carrito está vacío</h3>
            <p className="text-sm text-muted-foreground">Explora nuestros lujos y accesorios para equipar tu moto.</p>
            <Button asChild className="font-display uppercase tracking-wide mt-2">
              <Link to="/tienda" onClick={() => setOpen(false)}>Ver catálogo</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-secondary px-5 py-3 text-sm">
              {missing > 0 ? (
                <>Te faltan <strong>{formatCOP(missing)}</strong> para el envío gratis</>
              ) : (
                <strong className="text-primary font-bold">¡Tienes envío gratis!</strong>
              )}
            </div>
            <ul className="flex-1 divide-y overflow-y-auto px-5">
              {lines.map(({ lineId, product, selectedColor, qty }) => (
                <li key={lineId} className="flex gap-4 py-4">
                  <img src={product.image} alt={product.name} className="h-20 w-20 object-contain border p-1" loading="lazy" />
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-semibold uppercase leading-tight">{product.name}</p>
                    {selectedColor && (
                      <span className="inline-block mt-1 text-xs text-muted-foreground font-medium">
                        Color: <strong className="text-foreground">{selectedColor}</strong>
                      </span>
                    )}
                    <p className="mt-1 text-sm font-bold text-primary">{formatCOP(product.price)}</p>
                    <div className="mt-auto flex items-center gap-3">
                      <div className="flex items-center border">
                        <button
                          aria-label="Restar"
                          className="p-1.5 hover:bg-muted"
                          onClick={() => setQty(lineId, qty - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                        <button
                          aria-label="Sumar"
                          className="p-1.5 hover:bg-muted"
                          onClick={() => setQty(lineId, qty + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        aria-label="Quitar"
                        onClick={() => remove(lineId)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t p-5 bg-card">
              <div className="mb-4 flex justify-between font-display text-xl uppercase font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCOP(total)}</span>
              </div>
              <Button
                onClick={handleWhatsAppCheckout}
                className="h-12 w-full font-display text-base uppercase tracking-wide bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground gap-2 shadow-md"
              >
                <MessageCircle className="h-5 w-5" /> Pedir por WhatsApp
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Te responderemos directamente al WhatsApp 320-3031735 para coordinar el pago y entrega.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
