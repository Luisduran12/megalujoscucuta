import { useState, useEffect } from "react";
import heroDefault from "@/assets/hero-moto.jpg";
import bannerLimpiezaDefault from "@/assets/banner-limpieza.jpg";

export interface BannerMediaConfig {
  mediaType: "image" | "video";
  image: string;
  videoUrl?: string;
  posX: number; // 0 a 100 (% horizontal, 50 es centro)
  posY: number; // 0 a 100 (% vertical, 50 es centro)
  scale: number; // 100 a 200 (% zoom)
  fit: "cover" | "contain";
}

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
    mediaType?: ("image" | "video") | undefined;
    videoUrl?: string | undefined;
    posX?: number | undefined;
    posY?: number | undefined;
    scale?: number | undefined;
    fit?: ("cover" | "contain") | undefined;
  };
  promoBanner: {
    line1: string;
    line2: string;
    highlight: string;
    description: string;
    btnText: string;
    btnLink: string;
    image: string;
    mediaType?: ("image" | "video") | undefined;
    videoUrl?: string | undefined;
    posX?: number | undefined;
    posY?: number | undefined;
    scale?: number | undefined;
    fit?: ("cover" | "contain") | undefined;
  };
  outlet: {
    title: string;
    badge: string;
    description: string;
    btnText: string;
    btnLink: string;
    image?: string | undefined;
    mediaType?: ("image" | "video") | undefined;
    videoUrl?: string | undefined;
    posX?: number | undefined;
    posY?: number | undefined;
    scale?: number | undefined;
    fit?: ("cover" | "contain") | undefined;
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
      "https://api.whatsapp.com/send?phone=573203031735&type=phone_number&app_absent=0",
    image: heroDefault,
    mediaType: "image",
    videoUrl: "",
    posX: 50,
    posY: 50,
    scale: 100,
    fit: "cover",
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
    mediaType: "image",
    videoUrl: "",
    posX: 50,
    posY: 50,
    scale: 100,
    fit: "cover",
  },
  outlet: {
    title: "Outlet",
    badge: "Hasta 60%",
    description: "Descuento en lujos y accesorios seleccionados",
    btnText: "Ver todo el Outlet",
    btnLink: "/tienda",
    image: "",
    mediaType: "image",
    videoUrl: "",
    posX: 50,
    posY: 50,
    scale: 100,
    fit: "cover",
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
          hero: {
            ...defaultSiteConfig.hero,
            ...(parsed.hero || {}),
            posX: parsed.hero?.posX ?? 50,
            posY: parsed.hero?.posY ?? 50,
            scale: parsed.hero?.scale ?? 100,
            fit: parsed.hero?.fit ?? "cover",
            mediaType: parsed.hero?.mediaType ?? (parsed.hero?.videoUrl ? "video" : "image"),
          },
          promoBanner: {
            ...defaultSiteConfig.promoBanner,
            ...(parsed.promoBanner || {}),
            posX: parsed.promoBanner?.posX ?? 50,
            posY: parsed.promoBanner?.posY ?? 50,
            scale: parsed.promoBanner?.scale ?? 100,
            fit: parsed.promoBanner?.fit ?? "cover",
            mediaType: parsed.promoBanner?.mediaType ?? (parsed.promoBanner?.videoUrl ? "video" : "image"),
          },
          outlet: {
            ...defaultSiteConfig.outlet,
            ...(parsed.outlet || {}),
            posX: parsed.outlet?.posX ?? 50,
            posY: parsed.outlet?.posY ?? 50,
            scale: parsed.outlet?.scale ?? 100,
            fit: parsed.outlet?.fit ?? "cover",
          },
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
