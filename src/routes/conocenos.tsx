import { createFileRoute } from "@tanstack/react-router";
import hero from "@/assets/hero-moto.jpg";
import logoImg from "@/assets/logo-megalujos.jpg";

export const Route = createFileRoute("/conocenos")({
  head: () => ({
    meta: [
      { title: "Conócenos | Megalujos Cúcuta" },
      { name: "description", content: "Tienda especializada en lujos y accesorios para motocicletas en Cúcuta. Tuning, iluminación y estilo." },
      { property: "og:title", content: "Conócenos | Megalujos Cúcuta" },
      { property: "og:description", content: "La historia y pasión de Megalujos Cúcuta: lujos y accesorios para tu moto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Conocenos,
});

function Conocenos() {
  return (
    <>
      <section className="relative flex h-[50vh] items-end bg-ink text-ink-foreground">
        <img src={hero} alt="Megalujos Cúcuta - Tuning y accesorios" className="absolute inset-0 h-full w-full object-cover opacity-70" width={1920} height={1088} />
        <div className="absolute inset-0 bg-bottom-overlay" />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 flex items-center gap-6 lg:px-8">
          <img src={logoImg} alt="Megalujos Logo" className="h-20 w-20 rounded-full border-2 border-primary shadow-xl hidden sm:block object-cover" />
          <div>
            <span className="font-display text-sm uppercase tracking-widest text-primary font-bold">Cúcuta, Colombia</span>
            <h1 className="text-5xl sm:text-6xl font-bold">Megalujos Cúcuta</h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold font-display uppercase tracking-wider">
            Especialistas en lujos, tuning y accesorios para motocicletas
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            En <strong>Megalujos Cúcuta</strong> nos apasiona el mundo de las dos ruedas. Nacimos con el objetivo de brindar a los motociclistas de Cúcuta y toda la región los mejores accesorios de lujo, iluminación LED, protección y personalización tuning para llevar cada motocicleta al siguiente nivel.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            [
              "Tuning & Personalización",
              "Los mejores accesorios estéticos, iluminación de alto rendimiento y detalles de lujo seleccionados para que tu moto destaque en cualquier lugar.",
            ],
            [
              "Asesoría Personalizada",
              "Te orientamos directamente en nuestro punto de atención en Cúcuta o vía WhatsApp (320-3031735) para encontrar exactamente la pieza que le sirve a tu modelo.",
            ],
            [
              "Calidad y Respaldo",
              "Productos probados y garantizados con excelente durabilidad para soportar el clima y las exigencias del día a día.",
            ],
          ].map(([t, d]) => (
            <div key={t} className="border-t-4 border-primary pt-5 bg-card p-6 border shadow-sm">
              <h3 className="text-xl font-bold">{t}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
