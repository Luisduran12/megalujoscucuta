import { useState, useEffect } from "react";
import cascos from "@/assets/cat-cascos.jpg";
import casco2 from "@/assets/prod-casco2.jpg";
import indumentaria from "@/assets/cat-indumentaria.jpg";
import chaqueta2 from "@/assets/prod-chaqueta2.jpg";
import intercom from "@/assets/cat-intercom.jpg";
import maletas from "@/assets/cat-maletas.jpg";
import limpieza from "@/assets/cat-limpieza.jpg";
import bolsas from "@/assets/cat-bolsas.jpg";
import pantalon from "@/assets/prod-pantalon.jpg";
import guantes from "@/assets/prod-guantes.jpg";
import tiendaFoto from "@/assets/tienda-megalujos.png";

export type CategoryId = string;

export interface CategoryItem {
  id: string;
  name: string;
  image?: string;
}

export interface ProductColor {
  name: string;
  hex?: string;
  image?: string;
}

export interface Product {
  id: string;
  ref: string;
  name: string;
  price: number;
  oldPrice?: number | undefined;
  image: string;
  category: CategoryId;
  colors?: ProductColor[];
}

/** Database row shape for a product. */
export interface ProductRow {
  id: string;
  ref: string;
  name: string;
  price: number;
  old_price: number | null;
  category: string;
  image_key: string | null;
  image_url: string | null;
  sort_order: number;
  colors?: ProductColor[];
}

/** Built-in photos that ship with the site; products can point at one by key. */
export const builtInImages: Record<string, string> = {
  tienda: tiendaFoto,
  cascos,
  casco2,
  indumentaria,
  chaqueta2,
  intercom,
  maletas,
  limpieza,
  bolsas,
  pantalon,
  guantes,
};

export const defaultCategories: CategoryItem[] = [
  { id: "espejos", name: "Espejos" },
  { id: "luces-led", name: "Luces LED y Exploradoras" },
  { id: "sliders-defensas", name: "Sliders y Defensas" },
  { id: "manubrios-maniguetas", name: "Manubrios y Maniguetas" },
  { id: "tapizados-cojines", name: "Tapizados y Forros para Cojín" },
  { id: "tornillerias-posapies", name: "Tornillerías y Posapiés" },
  { id: "cascos", name: "Cascos y Protección", image: cascos },
  { id: "maletas", name: "Maletas y Baúles", image: maletas },
];

export const allCategories = defaultCategories;
export const categories = defaultCategories;

export function getStoredCategories(): CategoryItem[] {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("moto_demo_categories_v2");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
  }
  return defaultCategories;
}

export function saveStoredCategories(cats: CategoryItem[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("moto_demo_categories_v2", JSON.stringify(cats));
    window.dispatchEvent(new CustomEvent("moto_categories_changed", { detail: cats }));
  }
}

export function useCategoriesList(): CategoryItem[] {
  const [cats, setCats] = useState<CategoryItem[]>(() => getStoredCategories());

  useEffect(() => {
    const handleUpdate = () => {
      setCats(getStoredCategories());
    };
    window.addEventListener("moto_categories_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("moto_categories_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return cats;
}

export function productImage(row: Pick<ProductRow, "image_url" | "image_key">) {
  return row.image_url || (row.image_key && builtInImages[row.image_key]) || tiendaFoto;
}

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    image: productImage(row),
    category: row.category as CategoryId,
    colors: row.colors || [],
  };
}

export const outletOf = (list: Product[]) => list.filter((p) => p.oldPrice);
export const byCategory = (list: Product[], cat: CategoryId) =>
  list.filter((p) => p.category === cat && !p.oldPrice);

export const formatCOP = (value: number) =>
  "$" + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value);

export const discountPercent = (p: Product) =>
  p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

export const fallbackProducts: ProductRow[] = [
  // ESPEJOS
  {
    id: "esp-1",
    ref: "ESP-101",
    name: "Espejos Tipo Tomok Aluminio CNC",
    price: 85000,
    old_price: 110000,
    category: "espejos",
    image_key: "tienda",
    image_url: null,
    sort_order: 1,
    colors: [
      { name: "Negro", hex: "#18181b" },
      { name: "Rojo", hex: "#ef4444" },
      { name: "Azul", hex: "#3b82f6" },
      { name: "Dorado", hex: "#eab308" },
    ],
  },
  {
    id: "esp-2",
    ref: "ESP-102",
    name: "Espejos Stealth Wing Aerodinámicos Deportivos",
    price: 95000,
    old_price: null,
    category: "espejos",
    image_key: "tienda",
    image_url: null,
    sort_order: 2,
    colors: [
      { name: "Negro Mate", hex: "#18181b" },
      { name: "Fibra de Carbono", hex: "#27272a" },
      { name: "Rojo", hex: "#ef4444" },
    ],
  },
  {
    id: "esp-3",
    ref: "ESP-103",
    name: "Espejos Bar End Para Puntera de Manubrio",
    price: 65000,
    old_price: null,
    category: "espejos",
    image_key: "tienda",
    image_url: null,
    sort_order: 3,
    colors: [
      { name: "Negro", hex: "#18181b" },
      { name: "Plata / Titanio", hex: "#71717a" },
      { name: "Dorado", hex: "#eab308" },
    ],
  },

  // LUCES LED Y EXPLORADORAS
  {
    id: "led-1",
    ref: "LED-201",
    name: "Par de Exploradoras Dual Color con Ojo de Ángel",
    price: 120000,
    old_price: 150000,
    category: "luces-led",
    image_key: "tienda",
    image_url: null,
    sort_order: 4,
    colors: [
      { name: "Ojo de Ángel Azul", hex: "#3b82f6" },
      { name: "Ojo de Ángel Rojo", hex: "#ef4444" },
      { name: "Blanco Puro", hex: "#ffffff" },
    ],
  },
  {
    id: "led-2",
    ref: "LED-202",
    name: "Bombillo LED H4 Turbo Canbus Alta Potencia",
    price: 45000,
    old_price: null,
    category: "luces-led",
    image_key: "tienda",
    image_url: null,
    sort_order: 5,
    colors: [
      { name: "Luz Blanca 6500K", hex: "#ffffff" },
      { name: "Luz Cálida 4300K", hex: "#fef08a" },
    ],
  },
  {
    id: "led-3",
    ref: "LED-203",
    name: "Tiras LED Direccionales Secuenciales Flexibles",
    price: 35000,
    old_price: 50000,
    category: "luces-led",
    image_key: "tienda",
    image_url: null,
    sort_order: 6,
    colors: [
      { name: "Ámbar / Blanco", hex: "#f59e0b" },
      { name: "Ámbar / Rojo", hex: "#ef4444" },
      { name: "Ámbar / Azul", hex: "#3b82f6" },
    ],
  },

  // SLIDERS Y DEFENSAS
  {
    id: "sld-1",
    ref: "SLD-301",
    name: "Sliders de Motor en Aluminio CNC Anticaída",
    price: 130000,
    old_price: 160000,
    category: "sliders-defensas",
    image_key: "tienda",
    image_url: null,
    sort_order: 7,
    colors: [
      { name: "Rojo Anodizado", hex: "#ef4444" },
      { name: "Negro", hex: "#18181b" },
      { name: "Azul", hex: "#3b82f6" },
      { name: "Dorado", hex: "#eab308" },
      { name: "Verde Fluor", hex: "#84cc16" },
    ],
  },
  {
    id: "sld-2",
    ref: "SLD-302",
    name: "Sliders de Eje Universal Delantero y Trasero",
    price: 55000,
    old_price: null,
    category: "sliders-defensas",
    image_key: "tienda",
    image_url: null,
    sort_order: 8,
    colors: [
      { name: "Negro", hex: "#18181b" },
      { name: "Rojo", hex: "#ef4444" },
      { name: "Azul", hex: "#3b82f6" },
      { name: "Dorado", hex: "#eab308" },
    ],
  },
  {
    id: "sld-3",
    ref: "SLD-303",
    name: "Defensas Tubulares Reforzadas con Sliders",
    price: 210000,
    old_price: null,
    category: "sliders-defensas",
    image_key: "tienda",
    image_url: null,
    sort_order: 9,
    colors: [
      { name: "Negro Mate Epóxico", hex: "#18181b" },
      { name: "Punteras Rojas", hex: "#ef4444" },
      { name: "Punteras Azules", hex: "#3b82f6" },
    ],
  },

  // MANUBRIOS Y MANIGUETAS
  {
    id: "man-1",
    ref: "MAN-401",
    name: "Par de Maniguetas Graduables Abatibles Aluminio CNC",
    price: 75000,
    old_price: 95000,
    category: "manubrios-maniguetas",
    image_key: "tienda",
    image_url: null,
    sort_order: 10,
    colors: [
      { name: "Rojo", hex: "#ef4444" },
      { name: "Negro", hex: "#18181b" },
      { name: "Dorado", hex: "#eab308" },
      { name: "Azul", hex: "#3b82f6" },
      { name: "Titanio", hex: "#71717a" },
    ],
  },
  {
    id: "man-2",
    ref: "MAN-402",
    name: "Manubrio Deportivo Fatbar Reforzado 28mm",
    price: 140000,
    old_price: null,
    category: "manubrios-maniguetas",
    image_key: "tienda",
    image_url: null,
    sort_order: 11,
    colors: [
      { name: "Negro Mate", hex: "#18181b" },
      { name: "Rojo", hex: "#ef4444" },
      { name: "Azul", hex: "#3b82f6" },
      { name: "Dorado", hex: "#eab308" },
    ],
  },
  {
    id: "man-3",
    ref: "MAN-403",
    name: "Mangos / Empuñaduras Ergonómicas de Lujo",
    price: 38000,
    old_price: 50000,
    category: "manubrios-maniguetas",
    image_key: "tienda",
    image_url: null,
    sort_order: 12,
    colors: [
      { name: "Rojo / Negro", hex: "#ef4444" },
      { name: "Negro Total", hex: "#18181b" },
      { name: "Azul / Negro", hex: "#3b82f6" },
      { name: "Dorado / Negro", hex: "#eab308" },
    ],
  },

  // TAPIZADOS Y FORROS
  {
    id: "tap-1",
    ref: "TAP-501",
    name: "Forro Antideslizante Impermeable para Cojín",
    price: 42000,
    old_price: null,
    category: "tapizados-cojines",
    image_key: "tienda",
    image_url: null,
    sort_order: 13,
    colors: [
      { name: "Negro / Rojo", hex: "#b91c1c" },
      { name: "Negro Total", hex: "#18181b" },
      { name: "Negro / Azul", hex: "#1d4ed8" },
      { name: "Negro / Verde", hex: "#15803d" },
    ],
  },
  {
    id: "tap-2",
    ref: "TAP-502",
    name: "Malla Térmica Aislante para Cojín Transpirable",
    price: 28000,
    old_price: 38000,
    category: "tapizados-cojines",
    image_key: "tienda",
    image_url: null,
    sort_order: 14,
    colors: [
      { name: "Negro Clásico", hex: "#18181b" },
      { name: "Negro con Borde Rojo", hex: "#ef4444" },
    ],
  },
  {
    id: "tap-3",
    ref: "TAP-503",
    name: "Espuma de Confort Alta Densidad para Asiento",
    price: 55000,
    old_price: null,
    category: "tapizados-cojines",
    image_key: "tienda",
    image_url: null,
    sort_order: 15,
  },

  // TORNILLERIA Y POSAPIES
  {
    id: "tor-1",
    ref: "TOR-601",
    name: "Kit de Tornillería de Lujo en Aluminio / Titanio",
    price: 35000,
    old_price: 45000,
    category: "tornillerias-posapies",
    image_key: "tienda",
    image_url: null,
    sort_order: 16,
    colors: [
      { name: "Tornasol / Multicolor", hex: "linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)" },
      { name: "Dorado", hex: "#eab308" },
      { name: "Azul Anodizado", hex: "#3b82f6" },
      { name: "Rojo Anodizado", hex: "#ef4444" },
      { name: "Negro", hex: "#18181b" },
    ],
  },
  {
    id: "tor-2",
    ref: "TOR-602",
    name: "Posapiés Deportivos Universales en Aluminio CNC",
    price: 68000,
    old_price: null,
    category: "tornillerias-posapies",
    image_key: "tienda",
    image_url: null,
    sort_order: 17,
    colors: [
      { name: "Negro", hex: "#18181b" },
      { name: "Rojo", hex: "#ef4444" },
      { name: "Azul", hex: "#3b82f6" },
      { name: "Dorado", hex: "#eab308" },
      { name: "Titanio", hex: "#71717a" },
    ],
  },

  // CASCOS Y BAÚLES
  {
    id: "c1",
    ref: "CS-1001",
    name: "Casco Thunder R Integral Certificado DOT",
    price: 759000,
    old_price: null,
    category: "cascos",
    image_key: "cascos",
    image_url: null,
    sort_order: 18,
    colors: [
      { name: "Negro / Rojo Brillo", hex: "#b91c1c" },
      { name: "Negro Mate", hex: "#18181b" },
      { name: "Gris / Fluor", hex: "#84cc16" },
      { name: "Azul Eléctrico", hex: "#2563eb" },
      { name: "Blanco / Perla", hex: "#f4f4f5" },
    ],
  },
  {
    id: "m1",
    ref: "MA-4001",
    name: "Baúl Trasero S350 Negro con Base y Llaves",
    price: 389000,
    old_price: null,
    category: "maletas",
    image_key: "maletas",
    image_url: null,
    sort_order: 19,
    colors: [
      { name: "Negro con Reflectivo Rojo", hex: "#ef4444" },
      { name: "Negro con Reflectivo Humo", hex: "#52525b" },
    ],
  },
];
