// Cupons de desconto, editáveis no painel (aba CUPONS) — SÓ SERVIDOR.
// Mexe só em "cupons" do data/config.json. Relatório: pedidos pagos que usaram cada cupom.
import type { Config, Cupom } from "../types";
import { listarPedidos } from "../pedidos/store";
import { VENDIDO } from "../pedidos/tipos";
import { commitArquivos, lerArquivo } from "./github";
import { ARQ_CONFIG } from "./inicio";

const erro = (m: string) => Object.assign(new Error(m), { validacao: true });

export async function lerCupons(): Promise<{ cupons: Cupom[]; recuperacao: string }> {
  const a = await lerArquivo(ARQ_CONFIG);
  if (!a) throw new Error("data/config.json não encontrado no GitHub.");
  const c = JSON.parse(a.texto) as Config;
  return { cupons: c.cupons ?? [], recuperacao: c.recuperacao?.cupom ?? "" };
}

export function limparCupons(d: unknown, recuperacao: string): Cupom[] {
  const l = (Array.isArray(d) ? d : []).slice(0, 200).map((x) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const codigo = String(o.codigo ?? "").trim().toUpperCase();
    const pct = Math.round(Number(o.valor) * 1000) / 1000;
    if (!/^[A-Z0-9]{3,20}$/.test(codigo)) throw erro(`Código inválido: "${codigo || "(vazio)"}". Use de 3 a 20 letras e números, sem espaço.`);
    if (!(pct > 0 && pct <= 0.5)) throw erro(`Desconto inválido no cupom ${codigo} (de 1% a 50%).`);
    const parceira = String(o.parceira ?? "").trim().slice(0, 60);
    return {
      codigo, tipo: "percentual" as const, valor: pct,
      ...(o.somenteClientes ? { somenteClientes: true } : {}),
      ...(parceira ? { parceira } : {}),
      ...(o.ativo === false ? { ativo: false } : {}),
    };
  });
  const vistos = new Set<string>();
  for (const c of l) {
    if (vistos.has(c.codigo)) throw erro(`O cupom ${c.codigo} está repetido.`);
    vistos.add(c.codigo);
  }
  if (recuperacao && !l.some((c) => c.codigo === recuperacao && c.ativo !== false))
    throw erro(`O cupom ${recuperacao} é o do lembrete de compra não concluída: não dá para apagar nem desligar.`);
  return l;
}

export async function publicarCupons(cupons: Cupom[]) {
  await commitArquivos("Painel: cupons", async () => {
    const a = await lerArquivo(ARQ_CONFIG);
    if (!a) throw new Error("data/config.json não encontrado no GitHub.");
    const c = JSON.parse(a.texto) as Config;
    c.cupons = cupons;
    return [{ caminho: ARQ_CONFIG, texto: JSON.stringify(c, null, 2) + "\n" }];
  });
}

// Vendas por cupom (só pedidos pagos, em separação, enviados ou entregues).
export type VendasCupom = { pedidos: number; pecas: number; vendido: number; desconto: number; ultimo?: string };
export async function vendasPorCupom(): Promise<Record<string, VendasCupom>> {
  const r: Record<string, VendasCupom> = {};
  for (const p of await listarPedidos()) {
    const cod = (p.pedido.cupom || "").toUpperCase();
    if (!cod || !VENDIDO.includes(p.situacao)) continue;
    const v = (r[cod] ??= { pedidos: 0, pecas: 0, vendido: 0, desconto: 0 });
    v.pedidos++;
    v.pecas += p.pedido.itens.reduce((a, i) => a + i.q, 0);
    v.vendido = Math.round((v.vendido + p.pedido.total) * 100) / 100;
    v.desconto = Math.round((v.desconto + p.pedido.desconto) * 100) / 100;
    if (!v.ultimo || p.criadoEm > v.ultimo) v.ultimo = p.criadoEm;
  }
  return r;
}
