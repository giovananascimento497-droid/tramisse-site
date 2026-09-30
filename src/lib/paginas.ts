import paginas from "@data/paginas.json";

export type Pagina = { slug: string; titulo: string; paragrafos: string[] };

export async function getPaginas(): Promise<Pagina[]> {
  return paginas;
}

export async function getPagina(slug: string): Promise<Pagina | undefined> {
  return paginas.find((p) => p.slug === slug);
}
