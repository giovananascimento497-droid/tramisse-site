import dados from "@data/products.json";
import type { Catalogo, Categoria, Produto } from "./types";

// Camada de acesso ao catálogo. As funções já são assíncronas para que a troca
// do JSON por banco de dados/API (painel administrativo) não mude as telas.
const catalogo = dados as Catalogo;

export async function getCategorias(): Promise<Categoria[]> {
  return catalogo.categorias;
}

export async function getCores() {
  return catalogo.cores;
}

export async function getProdutos(): Promise<Produto[]> {
  return catalogo.produtos;
}

export async function getProduto(slug: string): Promise<Produto | undefined> {
  return catalogo.produtos.find((p) => p.slug === slug);
}

// Encontra a categoria pelo caminho (ex.: ["roupas", "vestidos"]).
export async function getCategoria(caminho: string[]): Promise<Categoria | undefined> {
  let nivel: Categoria[] | undefined = catalogo.categorias;
  let atual: Categoria | undefined;
  for (const slug of caminho) {
    atual = nivel?.find((c) => c.slug === slug);
    if (!atual) return undefined;
    nivel = atual.filhas;
  }
  return atual;
}

// Produtos de uma categoria e de todas as suas subcategorias.
export async function getProdutosDaCategoria(categoria: Categoria): Promise<Produto[]> {
  const slugs = new Set<string>();
  const coleta = (c: Categoria) => {
    slugs.add(c.slug);
    c.filhas?.forEach(coleta);
  };
  coleta(categoria);
  return catalogo.produtos.filter((p) => slugs.has(p.categoria));
}
