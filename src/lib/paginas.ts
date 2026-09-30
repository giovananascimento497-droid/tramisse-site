import paginas from "@data/paginas.json";

export type Pagina = { slug: string; titulo: string; html: string };

export const PAGINAS: Pagina[] = paginas;
export const getPagina = (slug: string) => PAGINAS.find((p) => p.slug === slug);
