// Avaliações das peças (SÓ SERVIDOR). Só entram avaliações reais: de quem comprou no site (pelo
// link enviado depois da entrega) ou cadastradas pela loja no painel (recebidas no WhatsApp/Instagram).
// As do site só aparecem depois de aprovadas no painel (aba AVALIAÇÕES). Guardadas no Netlify Blobs
// (store "avaliacoes", uma lista por peça); testes locais: PEDIDOS_DIR=<pasta>.
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { urlAbsoluta } from "../site";

export type Avaliacao = {
  id: string;
  produtoId: number;
  nota: number; // 1 a 5
  texto: string;
  nome: string; // como aparece no site (ex.: "Ana S.")
  cidade?: string;
  tam?: string;
  origem: "site" | "painel";
  pedidoId?: string; // compra verificada
  status: "pendente" | "aprovada" | "recusada";
  criadaEm: string;
};
// O que o site mostra (sem pedido nem situação).
export type AvaliacaoPublica = Pick<Avaliacao, "id" | "produtoId" | "nota" | "texto" | "nome" | "cidade" | "tam" | "criadaEm"> & { verificada: boolean };

type Lista = { produtoId: number; avaliacoes: Avaliacao[] };
type Armazem = { get(k: string): Promise<Lista | null>; set(k: string, v: Lista): Promise<void>; del(k: string): Promise<void>; keys(): Promise<string[]> };
function armazem(): Armazem {
  const dir = process.env.PEDIDOS_DIR ? path.join(process.env.PEDIDOS_DIR, "_avaliacoes") : "";
  if (dir) {
    const f = (k: string) => path.join(dir, `${k}.json`);
    return {
      get: (k) => readFile(f(k), "utf8").then((t) => JSON.parse(t) as Lista).catch(() => null),
      set: async (k, v) => { await mkdir(dir, { recursive: true }); await writeFile(f(k), JSON.stringify(v)); },
      del: async (k) => { await rm(f(k), { force: true }); },
      keys: async () => (await readdir(dir).catch(() => [] as string[])).filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)),
    };
  }
  const s = getStore({ name: "avaliacoes", consistency: "strong" });
  return {
    get: async (k) => ((await s.get(k, { type: "json" })) as Lista | null) ?? null,
    set: async (k, v) => { await s.setJSON(k, v); },
    del: async (k) => { await s.delete(k); },
    keys: async () => (await s.list()).blobs.map((b) => b.key),
  };
}
const chave = (id: number) => `p${id}`;
const MAX_POR_PECA = 300;

// Link de avaliação do pedido (só quem recebeu o link consegue avaliar as peças daquele pedido).
const segredo = () => `avaliar:${(process.env.ADMIN_SENHA || "").trim()}`;
export const chaveAvaliacao = (pedidoId: string) => createHmac("sha256", segredo()).update(pedidoId).digest("hex").slice(0, 24);
export function chaveValida(pedidoId: string, k: string) {
  if (!(process.env.ADMIN_SENHA || "").trim() || typeof k !== "string") return false;
  const a = Buffer.from(chaveAvaliacao(pedidoId)), b = Buffer.from(k);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const linkAvaliacao = (pedidoId: string) => urlAbsoluta(`/avaliar?p=${encodeURIComponent(pedidoId)}&k=${chaveAvaliacao(pedidoId)}`);

export const publica = (a: Avaliacao): AvaliacaoPublica => ({
  id: a.id, produtoId: a.produtoId, nota: a.nota, texto: a.texto, nome: a.nome, ...(a.cidade ? { cidade: a.cidade } : {}), ...(a.tam ? { tam: a.tam } : {}),
  criadaEm: a.criadaEm, verificada: a.origem === "site" && !!a.pedidoId,
});

// Nova avaliação (a mesma peça do mesmo pedido não repete: reenviar atualiza e volta para aprovação).
export async function salvarAvaliacao(n: Omit<Avaliacao, "id" | "criadaEm">) {
  const a = armazem();
  const l = (await a.get(chave(n.produtoId))) ?? { produtoId: n.produtoId, avaliacoes: [] };
  const i = n.pedidoId ? l.avaliacoes.findIndex((x) => x.pedidoId === n.pedidoId) : -1;
  const agora = new Date().toISOString();
  if (i >= 0) l.avaliacoes[i] = { ...l.avaliacoes[i], ...n, criadaEm: agora };
  else {
    if (l.avaliacoes.length >= MAX_POR_PECA) return null;
    l.avaliacoes.push({ ...n, id: `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, criadaEm: agora });
  }
  await a.set(chave(n.produtoId), l);
  return true;
}

export async function avaliacoesDaPeca(produtoId: number) {
  return (await armazem().get(chave(produtoId)))?.avaliacoes ?? [];
}

export async function todasAvaliacoes(): Promise<Avaliacao[]> {
  const a = armazem();
  const ks = await a.keys();
  return (await Promise.all(ks.map((k) => a.get(k)))).flatMap((l) => l?.avaliacoes ?? []).sort((x, y) => y.criadaEm.localeCompare(x.criadaEm));
}

export async function mudarAvaliacao(produtoId: number, id: string, acao: "aprovar" | "recusar" | "apagar") {
  const a = armazem();
  const l = await a.get(chave(produtoId));
  if (!l) return false;
  if (acao === "apagar") l.avaliacoes = l.avaliacoes.filter((x) => x.id !== id);
  else l.avaliacoes = l.avaliacoes.map((x) => (x.id === id ? { ...x, status: acao === "aprovar" ? "aprovada" : "recusada" } : x));
  if (l.avaliacoes.length) await a.set(chave(produtoId), l);
  else await a.del(chave(produtoId));
  return true;
}

// Nome curto para o site: "Ana Silva" → "Ana S.".
export const nomeCurto = (n: string, sn = "") => {
  const p = `${n} ${sn}`.trim().split(/\s+/).filter(Boolean);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0] || "Cliente";
};
