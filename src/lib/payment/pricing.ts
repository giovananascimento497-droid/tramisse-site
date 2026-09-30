import type { Config, Cupom, FormaPagamento } from "../types";

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const r2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

// Preço mostrado no site: base + taxa do cartão (ex.: R$ 100,00 -> R$ 105,00).
export const precoVitrine = (cfg: Config, base: number) => r2(base * (1 + cfg.pagamento.taxaCartao));

export function acharCupom(cfg: Config, codigo?: string | null): Cupom | undefined {
  if (!codigo) return undefined;
  const c = codigo.trim().toUpperCase();
  return cfg.cupons.find((x) => x.codigo.toUpperCase() === c);
}

// "ou 2x de R$ 52,50 sem juros"
export const parcelado = (cfg: Config, preco: number) =>
  `ou ${cfg.pagamento.maxParcelas}x de ${brl(r2(preco / cfg.pagamento.maxParcelas))} sem juros`;

export const precoPix = (cfg: Config, preco: number) => r2(preco * (1 - cfg.pagamento.descontoPix));

// Regras: cartão (crédito até 2x sem juros ou débito) paga a vitrine; Pix tem desconto sobre a vitrine.
// O cupom vale sobre a vitrine. O cálculo é feito por peça (centavos arredondados por unidade),
// para que o total do site seja exatamente a soma das peças enviadas ao Mercado Pago.
// `pagamento` nulo = ainda não escolhido (sem desconto Pix).
export function calcularTotais(
  cfg: Config,
  linhas: { preco: number; q: number }[],
  pagamento: FormaPagamento | null,
  codigoCupom?: string | null,
) {
  const cupom = acharCupom(cfg, codigoCupom);
  let subtotal = 0, desconto = 0, descontoPix = 0, total = 0;
  const unitarios = linhas.map(({ preco, q }) => {
    const comCupom = cupom ? r2(preco * (1 - cupom.valor)) : preco;
    const final = pagamento === "pix" ? precoPix(cfg, comCupom) : comCupom;
    subtotal += preco * q;
    desconto += (preco - comCupom) * q;
    descontoPix += (comCupom - final) * q;
    total += final * q;
    return final;
  });
  return { cupom, subtotal: r2(subtotal), desconto: r2(desconto), descontoPix: r2(descontoPix), total: r2(total), unitarios };
}
