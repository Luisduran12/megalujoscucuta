import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, MapPin, MessageCircle, Navigation, ShieldCheck, Store, Truck } from "lucide-react";
import hero from "@/assets/hero-moto.jpg";
import bannerLimpieza from "@/assets/banner-limpieza.jpg";
import tiendaFoto from "@/assets/tienda-megalujos.png";
import { byCategory, useCategoriesList, builtInImages, outletOf } from "@/lib/catalog";
import { productsQuery, useProducts } from "@/lib/products";
import { useSiteConfig } from "@/lib/site-config";
import { ProductRow } from "@/components/site/ProductRow";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Megalujos Cúcuta | Lujos, Tuning y Accesorios para Moto" },
      { name: "description", content: "Tienda especializada en lujos y accesorios para tu motocicleta en Cúcuta. Cel / WhatsApp: 320-3031735. Instagram @megalujoscucuta." },
      { property: "og:title", content: "Megalujos Cúcuta | Lujos y Accesorios para tu Moto" },
      { property: "og:description", content: "Lujos, iluminación, tuning y accesorios para motocicletas en Cúcuta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Index,
});

const benefits = [
  { icon: Truck, title: "Envíos seguros", text: "En Cúcuta y despachos a todo el país" },
  { icon: MessageCircle, title: "WhatsApp Asesor", text: "320-3031735 atención personalizada" },
  { icon: Box, title: "Compra segura", text: "Productos verificados y de calidad" },
  { icon: ShieldCheck, title: "Garantía", text: "Respaldo y soporte en cada compra" },
  { icon: Store, title: "Horarios en Cúcuta", text: "9am a 1pm / 2pm a 6:30pm" },
];

function Index() {
  const products = useProducts();
  const categoriesList = useCategoriesList();
  const config = useSiteConfig();

  return (
    <>
      {/* Hero con Imagen/Video de fondo y ajuste manual de resolución/posición */}
      <section className="relative -mt-px flex min-h-[80vh] items-end overflow-hidden bg-ink text-ink-foreground">
        {config.hero.mediaType === "video" && config.hero.videoUrl ? (
          <video
            src={config.hero.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full pointer-events-none transition-all duration-300"
            style={{
              objectFit: config.hero.fit || "cover",
              objectPosition: `${config.hero.posX ?? 50}% ${config.hero.posY ?? 50}%`,
              transform: `scale(${(config.hero.scale ?? 100) / 100})`,
              transformOrigin: `${config.hero.posX ?? 50}% ${config.hero.posY ?? 50}%`,
            }}
          />
        ) : (
          <img
            src={config.hero.image || hero}
            alt={config.hero.title}
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full transition-all duration-300"
            style={{
              objectFit: config.hero.fit || "cover",
              objectPosition: `${config.hero.posX ?? 50}% ${config.hero.posY ?? 50}%`,
              transform: `scale(${(config.hero.scale ?? 100) / 100})`,
              transformOrigin: `${config.hero.posX ?? 50}% ${config.hero.posY ?? 50}%`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 bg-bottom-overlay" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 lg:px-8">
          <p className="font-display text-sm uppercase italic tracking-wider text-primary font-bold">
            {config.hero.badge}
          </p>
          <h1 className="mt-2 text-6xl font-bold leading-none text-white sm:text-8xl font-display">
            {config.hero.title} <span className="text-primary">{config.hero.highlight}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-ink-foreground/90 sm:text-base leading-relaxed">
            {config.hero.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button asChild size="lg" className="font-display uppercase tracking-wide">
              <Link to={config.hero.btn1Link || "/tienda"}>
                {config.hero.btn1Text || "Comprar en tienda"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-display uppercase tracking-wide border-ink-foreground/30 text-ink-foreground hover:bg-ink-foreground hover:text-ink">
              <a href={config.hero.btn2Link || "https://api.whatsapp.com/send?phone=573203031735&type=phone_number&app_absent=0"} target="_blank" rel="noreferrer">
                {config.hero.btn2Text || "WhatsApp 320-3031735"}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="bg-primary text-primary-foreground">
        <div className="scrollbar-none mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-6 lg:grid lg:grid-cols-5 lg:px-8">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex min-w-[180px] flex-col items-center text-center">
              <Icon className="h-9 w-9" strokeWidth={1.5} />
              <h4 className="mt-2 text-sm font-bold">{title}</h4>
              <p className="text-xs opacity-90">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl font-display uppercase tracking-wide">
          Compra por categorías de lujos
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
          {categoriesList.map((c) => (
            <Link key={c.id} to="/tienda" className="group flex flex-col items-center">
              <div className="aspect-square w-full overflow-hidden rounded-full border bg-background transition-colors group-hover:border-primary">
                <img
                  src={c.image || (builtInImages[c.id] ?? tiendaFoto)}
                  alt={c.name}
                  loading="lazy"
                  width={816}
                  height={816}
                  className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span className="mt-2 text-center font-display text-xs uppercase tracking-wide group-hover:text-primary line-clamp-2">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Product Rows */}
      <div className="bg-secondary">
        <ProductRow title="Espejos para moto" products={byCategory(products, "espejos")} />
      </div>
      <ProductRow title="Luces LED y Exploradoras" products={byCategory(products, "luces-led")} />

      {/* Store Location Showcase Section */}
      <section className="bg-ink text-ink-foreground py-16 border-y border-ink-foreground/10">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 grid gap-10 lg:grid-cols-2 items-center">
          <div className="overflow-hidden border border-ink-foreground/20 bg-background shadow-2xl">
            <img
              src={tiendaFoto}
              alt="Megalujos Tienda en Cúcuta"
              className="w-full h-[420px] object-cover object-top hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div>
            <span className="font-display text-xs uppercase tracking-widest text-primary font-bold">
              Ubicación oficial en Cúcuta
            </span>
            <h2 className="mt-2 text-4xl sm:text-5xl font-bold font-display uppercase leading-tight">
              Visita nuestra tienda física
            </h2>
            <p className="mt-4 text-ink-foreground/80 leading-relaxed text-sm sm:text-base">
              Ven y equipa tu moto con los mejores lujos: espejos, luces LED, exploradoras, manubrios, defensas, sliders, maniguetas, forros para cojín, tapizados, espumas, tornillería y posapiés.
            </p>

            <div className="mt-6 space-y-3 text-sm text-ink-foreground/90">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Dirección:</strong> Cúcuta, Norte de Santander, Colombia
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Store className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Horarios:</strong> Lunes a sábado de 9:00 a.m. a 1:00 p.m. y 2:00 p.m. a 6:30 p.m.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>WhatsApp directo:</strong> +57 320 303 1735
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="font-display uppercase tracking-wide gap-2">
                <a href="https://maps.app.goo.gl/ki7SJXgUVrnAWctw9" target="_blank" rel="noreferrer">
                  <Navigation className="h-4 w-4" /> Cómo llegar (Google Maps)
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-display uppercase tracking-wide border-ink-foreground/30 text-ink-foreground hover:bg-ink-foreground hover:text-ink">
                <Link to="/contacto">Ver mapa y detalles</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Intermedio Promocional (Limpia, lubrica, protege) con Imagen/Video y Ajuste Manual */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        {config.promoBanner.mediaType === "video" && config.promoBanner.videoUrl ? (
          <video
            src={config.promoBanner.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="h-[420px] w-full pointer-events-none transition-all duration-300"
            style={{
              objectFit: config.promoBanner.fit || "cover",
              objectPosition: `${config.promoBanner.posX ?? 50}% ${config.promoBanner.posY ?? 50}%`,
              transform: `scale(${(config.promoBanner.scale ?? 100) / 100})`,
              transformOrigin: `${config.promoBanner.posX ?? 50}% ${config.promoBanner.posY ?? 50}%`,
            }}
          />
        ) : (
          <img
            src={config.promoBanner.image || bannerLimpieza}
            alt={config.promoBanner.highlight}
            loading="lazy"
            width={1920}
            height={800}
            className="h-[420px] w-full transition-all duration-300 opacity-90"
            style={{
              objectFit: config.promoBanner.fit || "cover",
              objectPosition: `${config.promoBanner.posX ?? 50}% ${config.promoBanner.posY ?? 50}%`,
              transform: `scale(${(config.promoBanner.scale ?? 100) / 100})`,
              transformOrigin: `${config.promoBanner.posX ?? 50}% ${config.promoBanner.posY ?? 50}%`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 flex items-center justify-end">
          <div className="mx-auto w-full max-w-7xl px-4 text-right lg:px-8">
            <h2 className="text-5xl font-bold leading-none sm:text-7xl font-display uppercase tracking-wide">
              {config.promoBanner.line1}<br />
              {config.promoBanner.line2}<br />
              <span className="text-primary">{config.promoBanner.highlight}</span>
            </h2>
            {config.promoBanner.description && (
              <p className="mt-4 max-w-lg ml-auto text-sm text-ink-foreground/85 sm:text-base leading-relaxed">
                {config.promoBanner.description}
              </p>
            )}
            <Button asChild size="lg" className="mt-6 font-display uppercase tracking-wide">
              <Link to={config.promoBanner.btnLink || "/tienda"}>
                {config.promoBanner.btnText || "Comprar ahora"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="bg-secondary">
        <ProductRow title="Sliders y Defensas" products={byCategory(products, "sliders-defensas")} />
      </div>
      <ProductRow title="Manubrios, Maniguetas y Cojines" products={[...byCategory(products, "manubrios-maniguetas"), ...byCategory(products, "tapizados-cojines")]} />

      {/* Outlet y Descuentos Editable */}
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[320px_1fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <h2 className="text-6xl font-bold text-primary font-display">{config.outlet.title}</h2>
            <p className="font-display text-4xl font-bold uppercase">{config.outlet.badge}</p>
            <p className="font-display text-sm uppercase tracking-wider text-ink-foreground/70 mt-1">
              {config.outlet.description}
            </p>
            <Button asChild variant="outline" className="mt-6 w-fit border-ink-foreground bg-transparent font-display uppercase tracking-wide text-ink-foreground hover:bg-ink-foreground hover:text-ink">
              <Link to={config.outlet.btnLink || "/tienda"}>
                {config.outlet.btnText || "Ver todo el Outlet"}
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {outletOf(products).slice(0, 3).map((p) => (
              <div key={p.id} className="bg-background p-3 text-foreground shadow-sm">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner de asesoría WhatsApp */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="rounded-lg bg-primary p-8 sm:p-12 text-primary-foreground flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display uppercase">
              ¿No encuentras el accesorio que buscas?
            </h2>
            <p className="mt-2 text-primary-foreground/90 max-w-xl text-sm sm:text-base">
              Escríbenos directamente a WhatsApp y te confirmamos disponibilidad o te conseguimos el lujo específico para tu modelo de moto.
            </p>
          </div>
          <Button asChild size="lg" className="bg-ink text-ink-foreground hover:bg-ink/90 font-display uppercase tracking-wide shrink-0">
            <a href="https://api.whatsapp.com/send?phone=573203031735&text=Hola%20Megalujos%2C%20busco%20un%20accesorio%20para%20mi%20moto&type=phone_number&app_absent=0" target="_blank" rel="noreferrer">
              Escribir al 320-3031735
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
