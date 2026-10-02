import type { DadosCliente, OpcaoFrete } from "../types";

const CAMPOS: (keyof DadosCliente)[] = ["e", "n", "sn", "tel", "cpf", "cep", "end", "num", "cmp", "bai", "cid", "uf", "dest"];

// Só os campos conhecidos, como texto curto (o pedido vem do navegador).
export function limparCliente(c: unknown): DadosCliente {
  const o = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
  const r: DadosCliente = {};
  for (const k of CAMPOS) if (typeof o[k] === "string" && o[k]) r[k] = (o[k] as string).trim().slice(0, 160);
  return r;
}

export function limparFrete(f: unknown): OpcaoFrete | null {
  const o = (f && typeof f === "object" ? f : null) as Record<string, unknown> | null;
  if (!o) return null;
  const n = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v) * 100) / 100 : 0);
  return {
    servico: n(o.servico),
    nome: String(o.nome ?? "Correios").slice(0, 40),
    valor: n(o.valor),
    valorOriginal: n(o.valorOriginal),
    prazo: n(o.prazo),
    gratis: Boolean(o.gratis),
  };
}
