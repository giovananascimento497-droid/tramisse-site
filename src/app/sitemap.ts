import type { MetadataRoute } from "next";
import { listar, PRODS, rotasCategorias } from "@/lib/catalog";
import { PAGINAS } from "@/lib/paginas";
import { SITE } from "@/lib/site";

// Mapa do site para o Google: home, categorias com peças, todas as peças (com a foto) e páginas.
export default function sitemap(): MetadataRoute.Sitemap {
  const hoje = new Date();
  return [
    { url: `${SITE}/`, lastModified: hoje, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    ...rotasCategorias()
      .filter(([k, s]) => listar(k, s).length > 0)
      .map((r) => ({ url: `${SITE}/categoria/${r.join("/")}`, lastModified: hoje, changeFrequency: "daily" as const, priority: 0.8 })),
    ...PRODS.map((p) => ({
      url: `${SITE}/produto/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: p.emBreve ? 0.5 : 0.7,
      images: p.imagens.slice(0, 3).map((i) => `${SITE}${i}`),
    })),
    ...PAGINAS.map((p) => ({ url: `${SITE}/pagina/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
