import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import type { PedidoSalvo } from "./tipos";

export { SITUACOES, type PedidoSalvo, type Situacao } from "./tipos";

// Pedidos guardados para o painel /admin. Ficam no Netlify Blobs (armazenamento privado da
// Netlify, já ligado ao site; não precisa de token). Nunca vão para o GitHub (o repositório
// pode ser público e os pedidos têm dados pessoais). Fora da Netlify (testes locais), use
// PEDIDOS_DIR=<pasta> para guardar em arquivos.

const ID_OK = /^T[0-9A-Z]{6,20}$/;
export const idValido = (id: unknown): id is string => typeof id === "string" && ID_OK.test(id);

type Armazem = {
  get(id: string): Promise<PedidoSalvo | null>;
  set(p: PedidoSalvo): Promise<void>;
  del(id: string): Promise<void>;
  ids(): Promise<string[]>;
};

function blobs(): Armazem {
  const s = getStore({ name: "pedidos", consistency: "strong" });
  return {
    get: async (id) => ((await s.get(id, { type: "json" })) as PedidoSalvo | null) ?? null,
    set: async (p) => { await s.setJSON(p.id, p); },
    del: async (id) => { await s.delete(id); },
    ids: async () => (await s.list()).blobs.map((b) => b.key),
  };
}

function arquivos(dir: string): Armazem {
  const f = (id: string) => path.join(dir, `${id}.json`);
  return {
    get: async (id) => readFile(f(id), "utf8").then((t) => JSON.parse(t) as PedidoSalvo).catch(() => null),
    set: async (p) => { await mkdir(dir, { recursive: true }); await writeFile(f(p.id), JSON.stringify(p)); },
    del: async (id) => { await rm(f(id), { force: true }); },
    ids: async () => (await readdir(dir).catch(() => [] as string[])).filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)),
  };
}

const armazem = (): Armazem => (process.env.PEDIDOS_DIR ? arquivos(process.env.PEDIDOS_DIR) : blobs());

export const lerPedido = (id: string) => (idValido(id) ? armazem().get(id) : Promise.resolve(null));
export const apagarPedido = (id: string) => armazem().del(id);

export async function salvarPedido(p: Omit<PedidoSalvo, "criadoEm" | "atualizadoEm">) {
  const a = armazem();
  const antigo = await a.get(p.id);
  if (antigo) return antigo; // o mesmo pedido não é registrado duas vezes
  const agora = new Date().toISOString();
  const novo: PedidoSalvo = { ...p, criadoEm: agora, atualizadoEm: agora };
  await a.set(novo);
  return novo;
}

export async function alterarPedido(id: string, mudar: (p: PedidoSalvo) => Partial<PedidoSalvo> | null) {
  const a = armazem();
  const p = await a.get(id);
  if (!p) return null;
  const m = mudar(p);
  if (!m) return p;
  const novo = { ...p, ...m, id: p.id, criadoEm: p.criadoEm, atualizadoEm: new Date().toISOString() };
  await a.set(novo);
  return novo;
}

// Mais novos primeiro.
export async function listarPedidos() {
  const a = armazem();
  const ids = await a.ids();
  const todos = await Promise.all(ids.map((id) => a.get(id)));
  return todos.filter((p): p is PedidoSalvo => !!p).sort((x, y) => y.criadoEm.localeCompare(x.criadoEm));
}

// Situação do pagamento no Mercado Pago → situação do pedido. Só avança pedidos que ainda
// aguardam pagamento (não desfaz o que a loja já marcou à mão, como "Enviado").
export async function atualizarPorMercadoPago(referencia: string, pagamento: { id: string; status: string }) {
  if (!idValido(referencia)) return null;
  return alterarPedido(referencia, (p) => {
    if (p.mercadoPago?.id === pagamento.id && p.mercadoPago.status === pagamento.status) return null;
    const m: Partial<PedidoSalvo> = { mercadoPago: pagamento };
    if (p.situacao === "aguardando" && pagamento.status === "approved") m.situacao = "pago";
    // Pagamento devolvido/estornado depois de aprovado: volta a pedir atenção.
    if (p.situacao === "pago" && ["refunded", "charged_back"].includes(pagamento.status)) m.situacao = "cancelado";
    return m;
  });
}
