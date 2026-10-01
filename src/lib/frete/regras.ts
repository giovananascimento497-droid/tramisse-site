// Regras do frete pelos Correios que não dependem do Melhor Envio (valem no navegador e no servidor).
import type { Config, OpcaoFrete, Produto } from "../types";
import { r2 } from "../payment/pricing";

export const limparCep = (cep?: string | null) => String(cep ?? "").replace(/\D/g, "");
export const cepValido = (cep?: string | null) => limparCep(cep).length === 8;

// Um envelope de segurança por pedido: a altura cresce por peça e o peso é a soma das peças + envelope.
export function pacote(cfg: Config, linhas: { p: Produto; q: number }[]) {
  const c = cfg.entrega.correios;
  const e = c.embalagem;
  const pecas = linhas.reduce((a, l) => a + l.q, 0);
  const peso = linhas.reduce((a, l) => a + (c.pesoPorPeca[l.p.subcategoria] ?? c.pesoPorPeca.padrao ?? 0.4) * l.q, e.peso);
  return {
    largura: e.largura,
    comprimento: e.comprimento,
    altura: Math.max(e.alturaMinima, e.alturaPorPeca * pecas),
    peso: r2(peso),
  };
}

// Frete grátis: quando as peças (vitrine, já com cupom) chegam ao valor mínimo, o serviço mais barato sai de graça.
export function aplicarFreteGratis(cfg: Config, opcoes: Omit<OpcaoFrete, "gratis" | "valor">[], valorPecas: number): OpcaoFrete[] {
  const min = cfg.entrega.correios.freteGratisAcima;
  const ordenadas = [...opcoes].sort((a, b) => a.valorOriginal - b.valorOriginal);
  return ordenadas.map((o, i) => {
    const gratis = min > 0 && valorPecas >= min && i === 0;
    return { ...o, valor: gratis ? 0 : o.valorOriginal, gratis };
  });
}

// Quanto falta para o frete grátis (0 = já tem ou não há frete grátis).
export function faltaFreteGratis(cfg: Config, valorPecas: number) {
  const min = cfg.entrega.correios.freteGratisAcima;
  return min > 0 && valorPecas < min ? r2(min - valorPecas) : 0;
}

export const textoPrazo = (dias: number) => `até ${dias} ${dias === 1 ? "dia útil" : "dias úteis"}`;
