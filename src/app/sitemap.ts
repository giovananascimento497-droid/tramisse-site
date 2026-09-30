import type { MetadataRoute } from "next";
import { PRODS, rotasCategorias } from "@/lib/catalog";
import { PAGINAS } from "@/lib/paginas";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const caminhos = [
    "/",
    "/sobre",
    ...rotasCategorias().map((r) => `/categoria/${r.join("/")}`),
    ...PRODS.map((p) => `/produto/${p.slug}`),
    ...PAGINAS.map((p) => `/pagina/${p.slug}`),
  ];
  return caminhos.map((c) => ({ url: `${base}${c}` }));
}
