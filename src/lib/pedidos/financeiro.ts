// Financeiro da loja (SÓ SERVIDOR): custo de cada peça, compras de mercadoria (investimento) e vendas
// feitas fora do site. Dados sensíveis: ficam no Netlify Blobs (store "financeiro", privado), NUNCA no
// GitHub nem no site (o catálogo é público). Testes locais: PEDIDOS_DIR=<pasta>.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";

export type Compra = { id: string; data: string; descricao: string; valor: number };
export type VendaFora = {
  id: string;
  data: string; // AAAA-MM-DD
  produtoId: number;
  nome: string;
  cor: string;
  tam: string;
  q: number;
  valor: number; // total cobrado da cliente
  taxa: number; // taxa da maquininha etc. (R$)
  forma: "pix" | "dinheiro" | "cartao" | "outro";
  estoque: boolean; // baixou do estoque do site
  obs?: string;
};
export type Financeiro = { custos: Record<string, number>; compras: Compra[]; vendas: VendaFora[] };

const vazio = (): Financeiro => ({ custos: {}, compras: [], vendas: [] });
const CHAVE = "dados";

async function ler(): Promise<Financeiro> {
  if (process.env.PEDIDOS_DIR) {
    const f = path.join(process.env.PEDIDOS_DIR, "_financeiro.json");
    return readFile(f, "utf8").then((t) => ({ ...vazio(), ...JSON.parse(t) })).catch(() => vazio());
  }
  const d = (await getStore({ name: "financeiro", consistency: "strong" }).get(CHAVE, { type: "json" })) as Financeiro | null;
  return { ...vazio(), ...(d ?? {}) };
}
async function gravar(d: Financeiro) {
  if (process.env.PEDIDOS_DIR) {
    await mkdir(process.env.PEDIDOS_DIR, { recursive: true });
    await writeFile(path.join(process.env.PEDIDOS_DIR, "_financeiro.json"), JSON.stringify(d));
    return;
  }
  await getStore({ name: "financeiro", consistency: "strong" }).setJSON(CHAVE, d);
}

export const lerFinanceiro = ler;
export async function mudarFinanceiro(f: (d: Financeiro) => void | Promise<void>) {
  const d = await ler();
  await f(d);
  await gravar(d);
  return d;
}
export const novoIdFin = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
