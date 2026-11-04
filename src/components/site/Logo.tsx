import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/logo-megalujos.jpg";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Megalujos Cúcuta - Inicio"
      className={`flex items-center gap-3 group transition-transform ${className ?? ""}`}
    >
      <div className="relative flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/90 bg-ink shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
        <img
          src={logoImg}
          alt="Megalujos Cúcuta"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col">
        <span className="font-display text-xl sm:text-2xl font-black uppercase leading-none tracking-wider text-ink-foreground group-hover:text-primary transition-colors">
          MEGALUJOS
        </span>
        <span className="font-display text-[10px] sm:text-[11px] uppercase tracking-widest text-primary font-bold leading-tight mt-0.5">
          Tuning &amp; Accesorios
        </span>
      </div>
    </Link>
  );
}
