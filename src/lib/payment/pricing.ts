import type { Config, Cupom, FormaPagamento } from "../types";

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function acharCupom(cfg: Config, codigo?: string | null): Cupom | undefined {
  if (!codigo) return undefined;
  const c = codigo.trim().toUpperCase();
  return cfg.cupons.find((x) => x.codigo.toUpperCase() === c);
}

// "ou 2x de R$ X no cartão" (crédito com acréscimo).
export const parcelado = (cfg: Config, preco: number) => {
  const { maxParcelas: n, acrescimo } = cfg.pagamento.credito;
  return `ou ${n}x de ${brl((preco * (1 + acrescimo)) / n)} no cartão`;
};

// Regras do catálogo: Pix sem acréscimo; débito +5%; crédito em até 2x +5%.
// O cupom é aplicado antes do acréscimo. `pagamento` nulo = ainda não escolhido (sem acréscimo).
export function calcularTotais(cfg: Config, subtotal: number, pagamento: FormaPagamento | null, codigoCupom?: string | null) {
  const cupom = acharCupom(cfg, codigoCupom);
  const desconto = !cupom ? 0 : cupom.tipo === "percentual" ? subtotal * cupom.valor : Math.min(cupom.valor, subtotal);
  const acrescimo = pagamento ? (subtotal - desconto) * cfg.pagamento[pagamento].acrescimo : 0;
  return { cupom, subtotal, desconto, acrescimo, total: subtotal - desconto + acrescimo };
}
