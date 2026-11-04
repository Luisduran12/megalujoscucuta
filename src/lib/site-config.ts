import { useState, useEffect } from "react";
import heroDefault from "@/assets/hero-moto.jpg";
import bannerLimpiezaDefault from "@/assets/banner-limpieza.jpg";
import { getSiteConfigData } from "./content.functions";

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

/**
 * Shared merge: stored partial config (from the database or the local cache)
 * over the defaults. Empty-string image on hero/promo means "use the default
 * image that ships with the site"; heavy base64 leftovers never survive.
 */
export function mergeStoredConfig(parsed: Record<string, unknown> | null | undefined): SiteConfig {
  const p = (parsed || {}) as {
    hero?: Record<string, unknown>;
    promoBanner?: Record<string, unknown>;
    outlet?: Record<string, unknown>;
  };
  const clean = (v: unknown): string | undefined =>
    typeof v === "string" && v.startsWith("data:") ? "" : (v as string | undefined);
  const hero = p.hero || {};
  const promo = p.promoBanner || {};
  const outlet = p.outlet || {};
  return {
    ...defaultSiteConfig,
    hero: {
      ...defaultSiteConfig.hero,
      ...(hero as object),
      image: clean(hero["image"]) || defaultSiteConfig.hero.image,
      videoUrl: clean(hero["videoUrl"]),
      posX: (hero["posX"] as number) ?? 50,
      posY: (hero["posY"] as number) ?? 50,
      scale: (hero["scale"] as number) ?? 100,
      fit: (hero["fit"] as "cover" | "contain") ?? "cover",
      mediaType: (hero["mediaType"] as "image" | "video") ?? (clean(hero["videoUrl"]) ? "video" : "image"),
    },
    promoBanner: {
      ...defaultSiteConfig.promoBanner,
      ...(promo as object),
      image: clean(promo["image"]) || defaultSiteConfig.promoBanner.image,
      videoUrl: clean(promo["videoUrl"]),
      posX: (promo["posX"] as number) ?? 50,
      posY: (promo["posY"] as number) ?? 50,
      scale: (promo["scale"] as number) ?? 100,
      fit: (promo["fit"] as "cover" | "contain") ?? "cover",
      mediaType: (promo["mediaType"] as "image" | "video") ?? (clean(promo["videoUrl"]) ? "video" : "image"),
    },
    outlet: {
      ...defaultSiteConfig.outlet,
      ...(outlet as object),
      image: clean(outlet["image"]),
      videoUrl: clean(outlet["videoUrl"]),
      posX: (outlet["posX"] as number) ?? 50,
      posY: (outlet["posY"] as number) ?? 50,
      scale: (outlet["scale"] as number) ?? 100,
      fit: (outlet["fit"] as "cover" | "contain") ?? "cover",
    },
  };
}

/**
 * Config ready to store in the database: default asset URLs (which change with
 * every deploy) are replaced by "" so the site always uses the current ones.
 */
export function toStorableConfig(c: SiteConfig): SiteConfig {
  const strip = (v: string | undefined, def: string | undefined) =>
    v === def || (v && v.startsWith("data:")) ? "" : v;
  return {
    ...c,
    hero: {
      ...c.hero,
      image: strip(c.hero.image, defaultSiteConfig.hero.image) ?? "",
      videoUrl: strip(c.hero.videoUrl, undefined),
    },
    promoBanner: {
      ...c.promoBanner,
      image: strip(c.promoBanner.image, defaultSiteConfig.promoBanner.image) ?? "",
      videoUrl: strip(c.promoBanner.videoUrl, undefined),
    },
    outlet: {
      ...c.outlet,
      image: strip(c.outlet.image, undefined),
      videoUrl: strip(c.outlet.videoUrl, undefined),
    },
  };
}

export function getSiteConfig(): SiteConfig {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("moto_site_config_v1");
    if (raw) {
      try {
        return mergeStoredConfig(JSON.parse(raw));
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
    let alive = true;
    // The real design lives in the database (table site_config): every device
    // shows what the admin saved. localStorage is only the fast first paint.
    (async () => {
      try {
        const data = await getSiteConfigData();
        if (!alive || !data) return;
        const merged = mergeStoredConfig(data);
        try {
          localStorage.setItem("moto_site_config_v1", JSON.stringify(merged));
        } catch {}
        setConfig(merged);
      } catch {}
    })();

    const handleUpdate = () => {
      setConfig(getSiteConfig());
    };
    window.addEventListener("moto_site_config_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      alive = false;
      window.removeEventListener("moto_site_config_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return config;
}
