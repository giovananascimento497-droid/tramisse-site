// Lista de espera do "Avise-me" (peças Coming Soon e esgotadas). SÓ SERVIDOR.
// Nome e WhatsApp de quem quer ser avisada, por peça. Guardado no Netlify Blobs (store "espera"),
// privado; nunca no GitHub. Testes locais: PEDIDOS_DIR=<pasta>.
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";

export type Interessada = { nome: string; tel: string; tam?: string; em: string; avisada?: string };
export type ListaEspera = { produtoId: number; pessoas: Interessada[] };

const MAX_POR_PECA = 500;

type Armazem = { get(k: string): Promise<ListaEspera | null>; set(k: string, v: ListaEspera): Promise<void>; del(k: string): Promise<void>; keys(): Promise<string[]> };
function armazem(): Armazem {
  const dir = process.env.PEDIDOS_DIR ? path.join(process.env.PEDIDOS_DIR, "_espera") : "";
  if (dir) {
    const f = (k: string) => path.join(dir, `${k}.json`);
    return {
      get: (k) => readFile(f(k), "utf8").then((t) => JSON.parse(t) as ListaEspera).catch(() => null),
      set: async (k, v) => { await mkdir(dir, { recursive: true }); await writeFile(f(k), JSON.stringify(v)); },
      del: async (k) => { await rm(f(k), { force: true }); },
      keys: async () => (await readdir(dir).catch(() => [] as string[])).filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)),
    };
  }
  const s = getStore({ name: "espera", consistency: "strong" });
  return {
    get: async (k) => ((await s.get(k, { type: "json" })) as ListaEspera | null) ?? null,
    set: async (k, v) => { await s.setJSON(k, v); },
    del: async (k) => { await s.delete(k); },
    keys: async () => (await s.list()).blobs.map((b) => b.key),
  };
}

const chave = (id: number) => `p${id}`;
export const soNumeros = (t: string) => t.replace(/\D/g, "");

// Entra na lista (a mesma pessoa na mesma peça não repete; atualiza nome e tamanho).
export async function entrarNaLista(produtoId: number, nome: string, tel: string, tam?: string) {
  const a = armazem();
  const l = (await a.get(chave(produtoId))) ?? { produtoId, pessoas: [] };
  const i = l.pessoas.findIndex((p) => p.tel === tel);
  const pessoa: Interessada = { nome, tel, ...(tam ? { tam } : {}), em: new Date().toISOString() };
  if (i >= 0) l.pessoas[i] = { ...l.pessoas[i], nome, ...(tam ? { tam } : {}), avisada: undefined };
  else {
    if (l.pessoas.length >= MAX_POR_PECA) return false;
    l.pessoas.push(pessoa);
  }
  await a.set(chave(produtoId), l);
  return true;
}

export async function listasDeEspera(): Promise<ListaEspera[]> {
  const a = armazem();
  const ks = await a.keys();
  return (await Promise.all(ks.map((k) => a.get(k)))).filter((l): l is ListaEspera => !!l && l.pessoas.length > 0);
}

// Marca como avisada ou tira da lista.
export async function mudarNaLista(produtoId: number, tel: string, acao: "avisada" | "remover") {
  const a = armazem();
  const l = await a.get(chave(produtoId));
  if (!l) return null;
  if (acao === "remover") l.pessoas = l.pessoas.filter((p) => p.tel !== tel);
  else l.pessoas = l.pessoas.map((p) => (p.tel === tel ? { ...p, avisada: new Date().toISOString() } : p));
  if (l.pessoas.length) await a.set(chave(produtoId), l);
  else await a.del(chave(produtoId));
  return l;
}
