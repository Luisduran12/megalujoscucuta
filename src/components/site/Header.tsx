import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Logo } from "./Logo";

const nav = [
  { to: "/", label: "Inicio" },
  { to: "/tienda", label: "Tienda virtual" },
  { to: "/conocenos", label: "Conócenos" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function Header() {
  const { count, setOpen } = useCart();
  const [menu, setMenu] = useState(false);

  return (
    <>
      <div className="bg-ink py-2 text-center font-display text-xs uppercase tracking-wide text-ink-foreground sm:text-sm border-b border-ink-foreground/10">
        <a
          href="https://wa.me/573203031735?text=Hola%20Megalujos%20C%C3%BAcuta%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n"
          target="_blank"
          rel="noreferrer"
          className="hover:text-primary transition-colors flex items-center justify-center gap-2"
        >
          <span>¿Asesoría en Cúcuta? WhatsApp: <strong className="text-primary font-bold">320-3031735</strong></span>
        </a>
      </div>
      <header className="sticky top-0 z-40 border-b border-ink-foreground/10 bg-ink text-ink-foreground">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-3 items-center px-4 lg:px-8">
          <nav className="flex items-center gap-6">
            <button className="lg:hidden" aria-label="Abrir menú" onClick={() => setMenu(true)}>
              <Menu className="h-6 w-6" />
            </button>
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="hidden font-display text-sm uppercase tracking-wide text-ink-foreground/70 transition-colors hover:text-ink-foreground lg:block"
                activeProps={{ className: "text-ink-foreground" }}
                activeOptions={{ exact: true }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="flex items-center justify-end gap-5">
            <Link to="/tienda" aria-label="Buscar" className="hover:text-primary">
              <Search className="h-5 w-5" />
            </Link>
            <Link to="/contacto" aria-label="Mi cuenta" className="hidden hover:text-primary sm:block">
              <User className="h-5 w-5" />
            </Link>
            <button aria-label="Carrito" onClick={() => setOpen(true)} className="relative hover:text-primary">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 bg-ink text-ink-foreground lg:hidden">
          <div className="flex h-20 items-center justify-between px-4">
            <Logo />
            <button aria-label="Cerrar menú" onClick={() => setMenu(false)}>
              <X className="h-7 w-7" />
            </button>
          </div>
          <nav className="flex flex-col gap-6 px-6 pt-8">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMenu(false)} className="font-display text-3xl uppercase">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
