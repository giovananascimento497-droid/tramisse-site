// Compras não concluídas (carrinho abandonado). SÓ SERVIDOR.
// Quando a cliente se identifica no checkout (nome, e-mail, telefone), a sacola fica guardada aqui
// (Netlify Blobs, store "carrinhos", privado). Se ela não concluir em `recuperacao.horas`, recebe
// um e-mail com o cupom; no painel dá para mandar por WhatsApp. Ao concluir, o carrinho é marcado.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";

export type ItemCarrinho = { id: number; slug: string; nome: string; cor: string; corNome: string; tam: string; q: number; preco: number };
export type Carrinho = {
  id: string;
  criadoEm: string;
  atualizadoEm: string;
  nome: string;
  email: string;
  tel: string;
  itens: ItemCarrinho[];
  total: number; // vitrine, sem desconto
  concluido?: string; // quando virou pedido
  lembreteEmail?: string; // quando o e-mail saiu
  lembreteWhats?: string; // quando a loja mandou pelo WhatsApp
  semLembrete?: boolean; // a cliente pediu para não receber
};

export const idCarrinhoValido = (id: unknown): id is string => typeof id === "string" && /^c[a-z0-9]{16,40}$/.test(id);

type Armazem = { get(k: string): Promise<Carrinho | null>; set(c: Carrinho): Promise<void>; del(k: string): Promise<void>; keys(): Promise<string[]> };
function armazem(): Armazem {
  if (process.env.PEDIDOS_DIR) {
    const dir = path.join(process.env.PEDIDOS_DIR, "_carrinhos");
    const f = (k: string) => path.join(dir, `${k}.json`);
    return {
      get: (k) => readFile(f(k), "utf8").then((t) => JSON.parse(t) as Carrinho).catch(() => null),
      set: async (c) => { await mkdir(dir, { recursive: true }); await writeFile(f(c.id), JSON.stringify(c)); },
      del: async (k) => { await rm(f(k), { force: true }); },
      keys: async () => (await readdir(dir).catch(() => [] as string[])).filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)),
    };
  }
  const s = getStore({ name: "carrinhos", consistency: "strong" });
  return {
    get: async (k) => ((await s.get(k, { type: "json" })) as Carrinho | null) ?? null,
    set: async (c) => { await s.setJSON(c.id, c); },
    del: async (k) => { await s.delete(k); },
    keys: async () => (await s.list()).blobs.map((b) => b.key),
  };
}

export const lerCarrinho = (id: string) => (idCarrinhoValido(id) ? armazem().get(id) : Promise.resolve(null));

// Cria ou atualiza (mesmo id = mesma compra). Se já tinha sido concluído, não mexe.
export async function salvarCarrinho(c: Omit<Carrinho, "criadoEm" | "atualizadoEm">) {
  const a = armazem();
  const antes = await a.get(c.id);
  if (antes?.concluido) return antes;
  const agora = new Date().toISOString();
  // Mudou a sacola depois de um lembrete: vale um lembrete novo.
  const mudou = antes && JSON.stringify(antes.itens) !== JSON.stringify(c.itens);
  const novo: Carrinho = {
    ...(antes ?? {}),
    ...c,
    criadoEm: antes?.criadoEm ?? agora,
    atualizadoEm: agora,
    ...(mudou ? { lembreteEmail: undefined } : {}),
    semLembrete: antes?.semLembrete,
  };
  await a.set(novo);
  return novo;
}

export async function alterarCarrinho(id: string, m: Partial<Carrinho>) {
  const a = armazem();
  const c = await a.get(id);
  if (!c) return null;
  const novo = { ...c, ...m, id: c.id };
  await a.set(novo);
  return novo;
}

export async function listarCarrinhos() {
  const a = armazem();
  const ks = await a.keys();
  const l = (await Promise.all(ks.map((k) => a.get(k)))).filter((c): c is Carrinho => !!c);
  return l.sort((x, y) => y.atualizadoEm.localeCompare(x.atualizadoEm));
}

export const apagarCarrinho = (id: string) => armazem().del(id);

// Chave do agendamento (netlify/functions/lembrete-carrinho.mts): derivada da ADMIN_SENHA, nunca exposta.
// A mesma conta é feita lá (a função agendada não importa este arquivo).
export const chaveAgendamento = () => {
  const s = (process.env.ADMIN_SENHA || "").trim();
  return s ? createHash("sha256").update(`lembrete:${s}`).digest("hex") : "";
};
