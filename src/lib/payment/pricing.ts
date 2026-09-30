import type { Config, Cupom, FormaPagamento } from "../types";

const centavos = (v: number) => Math.round(v * 100) / 100;

export function acharCupom(cfg: Config, codigo?: string): Cupom | undefined {
  if (!codigo) return undefined;
  const c = codigo.trim().toUpperCase();
  return cfg.cupons.find((x) => x.codigo.toUpperCase() === c);
}

// Regras do catálogo: Pix sem acréscimo; débito +5%; crédito em até 2x +5%.
// O cupom é aplicado antes do acréscimo.
export function calcularTotais(
  cfg: Config,
  subtotal: number,
  pagamento: FormaPagamento,
  codigoCupom?: string,
) {
  const cupom = acharCupom(cfg, codigoCupom);
  const desconto = !cupom
    ? 0
    : centavos(cupom.tipo === "percentual" ? subtotal * cupom.valor : Math.min(cupom.valor, subtotal));
  const base = subtotal - desconto;
  const acrescimo = centavos(base * cfg.pagamento[pagamento].acrescimo);
  return { cupom, desconto, acrescimo, total: centavos(base + acrescimo) };
}

export function parcelasPermitidas(cfg: Config, pagamento: FormaPagamento): number {
  return pagamento === "credito" ? cfg.pagamento.credito.maxParcelas : 1;
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
