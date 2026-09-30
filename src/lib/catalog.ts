import dados from "@data/products.json";
import colecoes from "@data/colecoes.json";
import { CFG } from "./config";
import { precoVitrine } from "./payment/pricing";
import type { Catalogo, Produto } from "./types";

// Camada de acesso ao catálogo. Única parte do site que lê data/products.json:
// para usar banco/API (painel administrativo), trocar só este arquivo.
const bruto = dados as Catalogo;
// Preço de vitrine = preço base + taxa do cartão (Mercado Pago), já embutida.
export const PRODS: Produto[] = bruto.produtos.map((p) => ({
  ...p,
  preco: precoVitrine(CFG, p.preco),
  precoDe: p.precoDe ? precoVitrine(CFG, p.precoDe) : 0,
}));
export const catalogo: Catalogo = { ...bruto, produtos: PRODS };
export const CL = catalogo.cores;
export const TREE = catalogo.categorias;
export const INFO: Record<string, { titulo: string; texto: string }> = colecoes;

export const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const SO = ["PP", "P", "M", "G", "GG"];
const sk = (x: string) => (SO.includes(x) ? SO.indexOf(x) : 10 + Number(x));
export const ordenaTamanhos = (l: string[]) => [...new Set(l)].sort((a, b) => sk(a) - sk(b));

export const cores = (p: Produto) => [...new Set(p.variantes.map((v) => v.cor))];
export const tamanhos = (p: Produto) => ordenaTamanhos(p.variantes.map((v) => v.tamanho));
export const temEstoque = (p: Produto) => !p.emBreve && p.variantes.some((v) => v.estoque > 0);
// Tamanho pré-selecionado quando a cor só tem um tamanho.
export const tamanhoUnico = (p: Produto, cor: string) => {
  const t = p.variantes.filter((v) => v.cor === cor).map((v) => v.tamanho);
  return t.length === 1 ? t[0] : null;
};

export const TODOS_TAMANHOS = ordenaTamanhos(PRODS.flatMap(tamanhos));
export const TODAS_CORES = [...new Set(PRODS.flatMap(cores))];

export const porId = (id: number) => PRODS.find((p) => p.id === id);
export const porSlug = (s: string) => PRODS.find((p) => p.slug === s);

// Lista de uma coleção/categoria (mesma regra do site original).
// Peças "coming soon" (emBreve) só aparecem na coleção coming-soon.
export function listar(k: string, sub?: string): Produto[] {
  if (k === "coming-soon") return PRODS.filter((p) => p.emBreve);
  const l = PRODS.filter((p) => !p.emBreve);
  if (k === "new-in") return l.filter((p) => p.flags.novo);
  if (k === "curadoria") return l.filter((p) => p.flags.curadoria);
  if (k === "sale") return l.filter((p) => p.precoDe);
  if (k === "estilo") return l.filter((p) => slug(p.estilo) === sub);
  if (k === "todos") return l;
  return l.filter((p) => p.categoria === k && (!sub || slug(p.subcategoria) === sub));
}

// Estoque de uma variante (cor + tamanho).
export const estoqueDe = (p: Produto, cor: string, tamanho: string) =>
  p.variantes.find((v) => v.cor === cor && v.tamanho === tamanho)?.estoque ?? 0;

// Todas as rotas de categoria válidas (para o sitemap e geração estática).
export function rotasCategorias(): string[][] {
  const r: string[][] = Object.keys(INFO).filter((k) => k !== "estilo").map((k) => [k]);
  for (const [k, c] of Object.entries(TREE)) for (const l of Object.values(c.grupos)) for (const s of l) r.push([k, slug(s)]);
  for (const e of new Set(PRODS.map((p) => p.estilo).filter(Boolean))) r.push(["estilo", slug(e)]);
  return r;
}
