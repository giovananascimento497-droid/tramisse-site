// Estatísticas do site guardadas no Netlify Blobs (store "estatisticas"). SÓ SERVIDOR.
// Cada evento vira um registro pequeno do dia (e/AAAA-MM-DD/...); dias passados são somados num
// resumo (r/AAAA-MM-DD) e os registros apagados. Nada identifica a pessoa.
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";

export type Evento = { t: "visita" | "peca" | "sacola" | "checkout" | "pedido"; o?: string; d?: "celular" | "computador"; p?: number; q?: number };
export type ResumoDia = {
  dia: string;
  visitas: number;
  sacola: number; // vezes que alguém pôs peça na sacola
  checkouts: number;
  pedidos: number;
  origens: Record<string, number>;
  dispositivos: Record<string, number>;
  pecasVistas: Record<string, number>;
  pecasSacola: Record<string, number>;
};

type Armazem = {
  get<T>(k: string): Promise<T | null>;
  set(k: string, v: unknown): Promise<void>;
  del(k: string): Promise<void>;
  keys(prefixo: string): Promise<string[]>;
};
function armazem(): Armazem {
  const dir = process.env.PEDIDOS_DIR ? path.join(process.env.PEDIDOS_DIR, "_estatisticas") : "";
  if (dir) {
    const f = (k: string) => path.join(dir, k.replace(/\//g, "__") + ".json");
    return {
      get: async <T,>(k: string) => readFile(f(k), "utf8").then((t) => JSON.parse(t) as T).catch(() => null),
      set: async (k, v) => { await mkdir(dir, { recursive: true }); await writeFile(f(k), JSON.stringify(v)); },
      del: async (k) => { await rm(f(k), { force: true }); },
      keys: async (pre) =>
        (await readdir(dir).catch(() => [] as string[])).map((n) => n.slice(0, -5).replace(/__/g, "/")).filter((k) => k.startsWith(pre)),
    };
  }
  const s = getStore({ name: "estatisticas", consistency: "strong" });
  return {
    get: async <T,>(k: string) => ((await s.get(k, { type: "json" })) as T | null) ?? null,
    set: async (k, v) => { await s.setJSON(k, v); },
    del: async (k) => { await s.delete(k); },
    keys: async (pre) => {
      const ks: string[] = [];
      for await (const pg of s.list({ prefix: pre, paginate: true })) ks.push(...pg.blobs.map((b) => b.key));
      return ks;
    },
  };
}

export const diaBelem = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "America/Belem" });

export async function gravarEvento(ev: Evento) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await armazem().set(`e/${diaBelem()}/${id}`, ev);
}

const vazio = (dia: string): ResumoDia => ({
  dia, visitas: 0, sacola: 0, checkouts: 0, pedidos: 0, origens: {}, dispositivos: {}, pecasVistas: {}, pecasSacola: {},
});
const mais = (o: Record<string, number>, k: string, n = 1) => { o[k] = (o[k] ?? 0) + n; };

function somar(r: ResumoDia, ev: Evento) {
  if (ev.t === "visita") {
    r.visitas++;
    mais(r.origens, ev.o || "direto");
    mais(r.dispositivos, ev.d || "computador");
  } else if (ev.t === "peca" && ev.p) mais(r.pecasVistas, String(ev.p));
  else if (ev.t === "sacola" && ev.p) {
    r.sacola++;
    mais(r.pecasSacola, String(ev.p), ev.q || 1);
  } else if (ev.t === "checkout") r.checkouts++;
  else if (ev.t === "pedido") r.pedidos++;
}

// Resumo de um dia: dias passados ficam guardados prontos (e os registros soltos são apagados).
async function resumoDoDia(a: Armazem, dia: string, hoje: string): Promise<ResumoDia> {
  const pronto = await a.get<ResumoDia>(`r/${dia}`);
  const ks = await a.keys(`e/${dia}/`);
  if (pronto && !ks.length) return pronto;
  const r = pronto ?? vazio(dia);
  const evs = await Promise.all(ks.map((k) => a.get<Evento>(k)));
  for (const ev of evs) if (ev) somar(r, ev);
  if (dia < hoje && ks.length) {
    await a.set(`r/${dia}`, r);
    await Promise.all(ks.map((k) => a.del(k)));
  }
  return r;
}

// Resumos dos últimos `dias` dias (do mais antigo para hoje).
export async function lerEstatisticas(dias: number): Promise<ResumoDia[]> {
  const a = armazem();
  const hoje = diaBelem();
  const lista: string[] = [];
  for (let i = dias - 1; i >= 0; i--) lista.push(diaBelem(new Date(Date.now() - i * 86400000)));
  const out: ResumoDia[] = [];
  for (const d of lista) out.push(await resumoDoDia(a, d, hoje));
  return out;
}
