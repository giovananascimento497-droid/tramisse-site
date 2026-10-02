import type { Config, Cupom, FormaPagamento } from "../types";

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const r2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

// Preço mostrado no site: base ÷ (1 − taxa do cartão), para que, descontada a taxa do Mercado Pago
// (a pior: receber na hora + 3x sem juros), sobre o preço base. Arredondado PARA CIMA até terminar
// em ,90 (centavosVitrine). Ex.: R$ 149,90 ÷ 0,8541 = 175,51 -> R$ 175,90.
export const precoVitrine = (cfg: Config, base: number) => {
  const v = r2(Math.ceil((base / (1 - cfg.pagamento.taxaCartao)) * 100 - 1e-6) / 100);
  const c = cfg.pagamento.centavosVitrine;
  return c == null ? v : r2(Math.ceil(r2(v - c) - 1e-9) + c);
};

export function acharCupom(cfg: Config, codigo?: string | null): Cupom | undefined {
  if (!codigo) return undefined;
  const c = codigo.trim().toUpperCase();
  return cfg.cupons.find((x) => x.codigo.toUpperCase() === c);
}

// "ou 3x de R$ 58,63 sem juros"
export const parcelado = (cfg: Config, preco: number) =>
  `ou ${cfg.pagamento.maxParcelas}x de ${brl(r2(preco / cfg.pagamento.maxParcelas))} sem juros`;

export const precoPix = (cfg: Config, preco: number) => r2(preco * (1 - cfg.pagamento.descontoPix));

// Textos com os números da configuração (ex.: "10%", "3x").
export const pctPix = (cfg: Config) => `${Math.round(cfg.pagamento.descontoPix * 100)}%`;
export const nomesPagamento = (cfg: Config) =>
  ({
    pix: `Pix (${pctPix(cfg)} de desconto)`,
    debito: "Cartão de débito",
    credito: `Cartão de crédito (até ${cfg.pagamento.maxParcelas}x sem juros)`,
  }) as const;

// Regras: cartão (crédito em até maxParcelas sem juros ou débito) paga a vitrine; Pix tem desconto sobre a vitrine.
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
