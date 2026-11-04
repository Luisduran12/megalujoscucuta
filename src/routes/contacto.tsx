import { createFileRoute } from "@tanstack/react-router";
import { Clock, ExternalLink, Instagram, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import tiendaFoto from "@/assets/tienda-megalujos.png";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto y Ubicación | Megalujos Cúcuta" },
      { name: "description", content: "Visita nuestra tienda de lujos y accesorios para moto en Cúcuta o escríbenos por WhatsApp: 320-3031735. Ubicación en Google Maps." },
      { property: "og:title", content: "Contacto y Ubicación | Megalujos Cúcuta" },
      { property: "og:description", content: "Lujos, tuning y accesorios para motocicletas en Cúcuta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contacto,
});

const MAPS_URL = "https://maps.app.goo.gl/ki7SJXgUVrnAWctw9";

function Contacto() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-16">
      {/* Top Header & Details */}
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <span className="font-display text-sm uppercase tracking-wider text-primary font-bold">Atención personalizada</span>
          <h1 className="mt-1 text-5xl font-bold font-display">Contáctanos y Visítanos</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Somos <strong>MEGALUJOS CÚCUTA</strong>, tu tienda especializada en lujos, iluminación, tuning, cojines y accesorios para tu motocicleta. Te esperamos en nuestro local físico en Cúcuta o te asesoramos al instante por WhatsApp.
          </p>

          <ul className="mt-8 space-y-5">
            <li className="flex items-start gap-3">
              <MapPin className="text-primary h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-foreground">Dirección y Ubicación:</strong>
                <span className="text-muted-foreground block">Cúcuta, Norte de Santander, Colombia</span>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline mt-1"
                >
                  <Navigation className="h-3.5 w-3.5" /> Ver en Google Maps (Cómo llegar)
                </a>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <Phone className="text-primary h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-foreground">Celular y WhatsApp:</strong>
                <a href="tel:+573203031735" className="text-primary hover:underline font-semibold mr-3">
                  320-3031735
                </a>
                <span className="text-muted-foreground">(+57 320 303 1735)</span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <Instagram className="text-primary h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-foreground">Instagram oficial:</strong>
                <a
                  href="https://www.instagram.com/megalujoscucuta"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  @megalujoscucuta
                </a>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <Clock className="text-primary h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-foreground">Horarios de atención en tienda:</strong>
                <span className="text-muted-foreground block">
                  Lunes a sábado: <strong>9:00 a.m. – 1:00 p.m.</strong> y <strong>2:00 p.m. – 6:30 p.m.</strong>
                </span>
              </div>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-4 pt-4 border-t">
            <a
              href="https://api.whatsapp.com/send?phone=573203031735&text=Hola%20Megalujos%20C%C3%BAcuta%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20un%20producto&type=phone_number&app_absent=0"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded bg-whatsapp px-6 py-3 font-display text-sm uppercase tracking-wider text-whatsapp-foreground font-bold shadow-md hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-5 w-5" /> Escribir al WhatsApp
            </a>

            <a
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded border border-primary px-6 py-3 font-display text-sm uppercase tracking-wider text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Navigation className="h-4 w-4" /> Abrir en Google Maps
            </a>
          </div>
        </div>

        {/* Store Front Photo Card */}
        <div className="flex flex-col border bg-card overflow-hidden shadow-card">
          <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-ink">
            <img
              src={tiendaFoto}
              alt="Fachada Tienda Megalujos Cúcuta"
              className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute top-4 left-4 rounded bg-primary/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow">
              Tienda Física en Cúcuta
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold font-display uppercase tracking-wider">
              Megalujos Tuning &amp; Accesorios
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Encuentra vitrinas equipadas con espejos, exploradoras, iluminación LED, manubrios, sliders, forros para cojín, espumas y tornillería de lujo.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Google Map Section */}
      <div className="border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold font-display uppercase tracking-wide flex items-center gap-2">
              <MapPin className="text-primary h-6 w-6" /> Ubicación en Google Maps
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Haz clic en el mapa o en el botón para trazar tu ruta directa hasta el local.
            </p>
          </div>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-xs font-display uppercase tracking-wider text-ink-foreground hover:bg-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Abrir en Google Maps
          </a>
        </div>

        <div className="relative w-full h-[380px] rounded overflow-hidden border">
          <iframe
            title="Ubicación Megalujos Cúcuta"
            src="https://maps.google.com/maps?q=7.8977000,-72.4817000&hl=es&z=17&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* Message Form Section */}
      <div className="grid gap-12 lg:grid-cols-2 items-center bg-secondary p-8 border">
        <div>
          <span className="font-display text-xs uppercase tracking-wider text-primary font-bold">Respuesta rápida</span>
          <h3 className="text-3xl font-bold font-display mt-1">¿Tienes preguntas sobre un repuesto o lujo?</h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Escríbenos tu duda o solicitud y nuestro equipo de Megalujos Cúcuta te responderá al correo o por WhatsApp.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center bg-background p-8 text-center border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              ✓
            </div>
            <h4 className="text-2xl font-bold">¡Mensaje recibido!</h4>
            <p className="mt-2 text-muted-foreground text-xs max-w-sm">
              Gracias por escribirnos. Nos pondremos en contacto contigo pronto.
            </p>
          </div>
        ) : (
          <form
            className="space-y-3 bg-background p-6 border shadow-xs"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <input required placeholder="Tu Nombre completo" className="h-11 w-full border border-input px-3 outline-none focus:border-primary text-sm" />
            <input required type="email" placeholder="Correo electrónico" className="h-11 w-full border border-input px-3 outline-none focus:border-primary text-sm" />
            <input placeholder="Teléfono / WhatsApp" className="h-11 w-full border border-input px-3 outline-none focus:border-primary text-sm" />
            <textarea required rows={3} placeholder="¿Qué accesorio o lujo buscas para tu moto?" className="w-full border border-input p-3 outline-none focus:border-primary text-sm" />
            <Button type="submit" size="lg" className="w-full font-display uppercase tracking-wide">
              Enviar mensaje
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
