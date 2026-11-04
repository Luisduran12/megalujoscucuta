import { useState, useEffect } from "react";
import heroDefault from "@/assets/hero-moto.jpg";
import bannerLimpiezaDefault from "@/assets/banner-limpieza.jpg";

export interface SiteConfig {
  hero: {
    badge: string;
    title: string;
    highlight: string;
    description: string;
    btn1Text: string;
    btn1Link: string;
    btn2Text: string;
    btn2Link: string;
    image: string;
  };
  promoBanner: {
    line1: string;
    line2: string;
    highlight: string;
    description: string;
    btnText: string;
    btnLink: string;
    image: string;
  };
  outlet: {
    title: string;
    badge: string;
    description: string;
    btnText: string;
    btnLink: string;
  };
}

export const defaultSiteConfig: SiteConfig = {
  hero: {
    badge: "Tienda especializada en Cúcuta",
    title: "MEGALUJOS",
    highlight: "CÚCUTA",
    description:
      "Equipa y personaliza tu motocicleta con los mejores lujos, tuning, iluminación y accesorios de alto nivel. Calidad, estilo y asesoría especializada.",
    btn1Text: "Comprar en tienda",
    btn1Link: "/tienda",
    btn2Text: "WhatsApp 320-3031735",
    btn2Link:
      "https://wa.me/573203031735?text=Hola%20Megalujos%20C%C3%BAcuta%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n",
    image: heroDefault,
  },
  promoBanner: {
    line1: "Limpia,",
    line2: "lubrica,",
    highlight: "protege",
    description:
      "Productos de mantenimiento, lubricación, detallado y estética para que tu moto luzca siempre impecable.",
    btnText: "Comprar ahora",
    btnLink: "/tienda",
    image: bannerLimpiezaDefault,
  },
  outlet: {
    title: "Outlet",
    badge: "Hasta 60%",
    description: "Descuento en lujos y accesorios seleccionados",
    btnText: "Ver todo el Outlet",
    btnLink: "/tienda",
  },
};

export function getSiteConfig(): SiteConfig {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("moto_site_config_v1");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          ...defaultSiteConfig,
          ...parsed,
          hero: { ...defaultSiteConfig.hero, ...(parsed.hero || {}) },
          promoBanner: { ...defaultSiteConfig.promoBanner, ...(parsed.promoBanner || {}) },
          outlet: { ...defaultSiteConfig.outlet, ...(parsed.outlet || {}) },
        };
      } catch {}
    }
  }
  return defaultSiteConfig;
}

export function saveSiteConfig(config: SiteConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("moto_site_config_v1", JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("moto_site_config_changed", { detail: config }));
  }
}

export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getSiteConfig());
    };
    window.addEventListener("moto_site_config_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("moto_site_config_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return config;
}
