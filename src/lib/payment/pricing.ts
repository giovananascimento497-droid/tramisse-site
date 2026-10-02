import type { Config, Cupom, FormaPagamento } from "../types";

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const r2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

// Taxa total do Mercado Pago para n parcelas (1 = à vista).
export const taxaParcelas = (cfg: Config, n: number) => cfg.pagamento.taxasCartao[String(n)] ?? cfg.pagamento.taxasCartao["1"];

// Quantas parcelas sem juros um valor permite pela parcela mínima (1 a maxParcelas).
export const parcelasPermitidas = (cfg: Config, valor: number) =>
  Math.max(1, Math.min(cfg.pagamento.maxParcelas, Math.floor(valor / cfg.pagamento.parcelaMinima + 1e-9)));

const arredonda = (cfg: Config, v: number) => {
  const c = cfg.pagamento.centavosVitrine;
  const x = r2(Math.ceil(v * 100 - 1e-6) / 100);
  return c == null ? x : r2(Math.ceil(r2(x - c) - 1e-9) + c);
};

// Preço mostrado no site, proporcional à taxa: cobre a taxa do Mercado Pago das parcelas que o
// próprio preço permite (parcela mínima). Ex.: base 149,90 -> 157,90 (só à vista, 4,98%);
// 219,90 -> 237,90 (até 2x, 7,51%); 389,90 -> 431,90 (até 3x, 9,60%). Arredondado para cima até ,90.
export const precoVitrine = (cfg: Config, base: number) => {
  let n = 1;
  let v = arredonda(cfg, base / (1 - taxaParcelas(cfg, n)));
  for (let i = 0; i < 4; i++) {
    const m = parcelasPermitidas(cfg, v);
    if (m <= n) break;
    n = m;
    v = arredonda(cfg, base / (1 - taxaParcelas(cfg, n)));
  }
  return v;
};

// Parcelas liberadas para um pedido: respeita a parcela mínima e só libera n parcelas se,
// descontada a taxa de n parcelas, o pedido ainda paga o valor base das peças (mais o frete).
export function parcelasPedido(cfg: Config, total: number, minimoLiquido: number) {
  for (let n = parcelasPermitidas(cfg, total); n > 1; n--) if (total * (1 - taxaParcelas(cfg, n)) >= minimoLiquido - 0.01) return n;
  return 1;
}

export function acharCupom(cfg: Config, codigo?: string | null): Cupom | undefined {
  if (!codigo) return undefined;
  const c = codigo.trim().toUpperCase();
  return cfg.cupons.find((x) => x.codigo.toUpperCase() === c);
}

// "ou 2x de R$ 118,95 sem juros" (vazio quando o preço só permite à vista)
export const parcelado = (cfg: Config, preco: number) => {
  const n = parcelasPermitidas(cfg, preco);
  return n < 2 ? "" : `ou ${n}x de ${brl(r2(preco / n))} sem juros`;
};

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
