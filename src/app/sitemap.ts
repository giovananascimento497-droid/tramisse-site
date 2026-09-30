import type { MetadataRoute } from "next";
import { getCategorias, getProdutos } from "@/lib/catalog";
import { getPaginas } from "@/lib/paginas";
import type { Categoria } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const caminhos: string[] = ["/"];
  const cats = (lista: Categoria[], pai: string) =>
    lista.forEach((c) => {
      const p = `${pai}/${c.slug}`;
      caminhos.push(`/categoria${p}`);
      if (c.filhas) cats(c.filhas, p);
    });
  cats(await getCategorias(), "");
  (await getProdutos()).forEach((p) => caminhos.push(`/produto/${p.slug}`));
  (await getPaginas()).forEach((p) => caminhos.push(`/institucional/${p.slug}`));
  return caminhos.map((c) => ({ url: `${base}${c}` }));
}
