import { Link } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-ink text-ink-foreground border-t border-ink-foreground/10">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-ink-foreground/75 leading-relaxed">
            Tienda especializada en lujos y accesorios para tu motocicleta en la ciudad de Cúcuta. Tuning, protección y el mejor estilo sobre dos ruedas.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="https://www.instagram.com/megalujoscucuta"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram @megalujoscucuta"
              className="flex items-center gap-2 rounded border border-ink-foreground/20 px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition-colors"
            >
              <Instagram className="h-4 w-4 text-primary" />
              <span>@megalujoscucuta</span>
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-bold font-display uppercase tracking-wider text-primary">Tienda</h4>
          <ul className="space-y-2 text-sm text-ink-foreground/70">
            <li><Link to="/tienda" className="hover:text-primary transition-colors">Ver catálogo completo</Link></li>
            <li><Link to="/tienda" className="hover:text-primary transition-colors">Cascos y protección</Link></li>
            <li><Link to="/tienda" className="hover:text-primary transition-colors">Lujos y tuning</Link></li>
            <li><Link to="/tienda" className="hover:text-primary transition-colors">Ofertas y Outlet</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-bold font-display uppercase tracking-wider text-primary">Información</h4>
          <ul className="space-y-2 text-sm text-ink-foreground/70">
            <li><Link to="/conocenos" className="hover:text-primary transition-colors">Conócenos</Link></li>
            <li><Link to="/contacto" className="hover:text-primary transition-colors">Contacto directo</Link></li>
            <li><Link to="/contacto" className="hover:text-primary transition-colors">Garantía y asesoría</Link></li>
            <li><Link to="/contacto" className="hover:text-primary transition-colors">Envíos y entregas</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-bold font-display uppercase tracking-wider text-primary">Visítanos y Contacto</h4>
          <ul className="space-y-3 text-sm text-ink-foreground/75">
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <a
                href="https://maps.app.goo.gl/ki7SJXgUVrnAWctw9"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors underline-offset-2 hover:underline"
                title="Abrir ubicación en Google Maps"
              >
                Cúcuta, Norte de Santander, Colombia (Ver en Google Maps)
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a href="tel:+573203031735" className="hover:text-primary transition-colors font-medium">
                +57 320 303 1735
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span className="text-xs leading-relaxed text-ink-foreground/70">
                Lun a Sáb: 9:00 a.m. – 1:00 p.m.<br />
                y 2:00 p.m. – 6:30 p.m.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-foreground/10 py-5 text-center text-xs text-ink-foreground/50">
        © {new Date().getFullYear()} MEGALUJOS Cúcuta. Tuning y Accesorios para tu motocicleta.
      </div>
    </footer>
  );
}
