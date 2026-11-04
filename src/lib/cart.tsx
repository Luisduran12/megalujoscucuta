import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./catalog";

export interface CartLine {
  lineId: string;
  product: Product;
  selectedColor?: string | undefined;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: Product, color?: string) => void;
  remove: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
}

const CartContext = createContext<CartState | null>(null);

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  const value = useMemo<CartState>(
    () => ({
      lines,
      open,
      setOpen,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: cartTotal(lines),
      add: (p, color) => {
        const lineId = `${p.id}-${color || "default"}`;
        setLines((prev) => {
          const found = prev.find((l) => l.lineId === lineId);
          if (found) {
            return prev.map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + 1 } : l));
          }
          return [...prev, { lineId, product: p, selectedColor: color, qty: 1 }];
        });
        setOpen(true);
      },
      remove: (lineId) =>
        setLines((prev) => prev.filter((l) => l.lineId !== lineId && l.product.id !== lineId)),
      setQty: (lineId, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.lineId !== lineId && l.product.id !== lineId)
            : prev.map((l) => (l.lineId === lineId || l.product.id === lineId ? { ...l, qty } : l))
        ),
    }),
    [lines, open]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
