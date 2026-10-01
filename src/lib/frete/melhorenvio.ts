// Cotação de frete pelo Melhor Envio (Correios PAC/SEDEX). SÓ PARA O SERVIDOR:
// usa o token secreto MELHORENVIO_TOKEN (nunca importar em componente "use client").
import { CFG } from "../config";
import type { OpcaoFrete, Produto } from "../types";
import { r2 } from "../payment/pricing";
import { aplicarFreteGratis, limparCep, pacote } from "./regras";

const token = () => (process.env.MELHORENVIO_TOKEN || "").trim();
// MELHORENVIO_AMBIENTE=sandbox usa o ambiente de testes do Melhor Envio (token criado em sandbox.melhorenvio.com.br).
const API = () =>
  process.env.MELHORENVIO_API_URL ||
  (process.env.MELHORENVIO_AMBIENTE === "sandbox" ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br");

export const melhorEnvioAtivo = () => Boolean(token());

const NOMES: Record<number, string> = { 1: "PAC", 2: "SEDEX" };

type Resposta = {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
};

// Cota o frete das peças até o CEP. valorPecas = vitrine com cupom (para o seguro e o frete grátis).
export async function cotarFrete(cep: string, linhas: { p: Produto; q: number }[], valorPecas: number): Promise<OpcaoFrete[]> {
  const c = CFG.entrega.correios;
  const pk = pacote(CFG, linhas);
  const r = await fetch(API() + "/api/v2/me/shipment/calculate", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      "User-Agent": `Tramisse (${process.env.MELHORENVIO_CONTATO || "tramisse.com.br"})`,
    },
    body: JSON.stringify({
      from: { postal_code: limparCep(c.cepOrigem) },
      to: { postal_code: limparCep(cep) },
      package: { height: pk.altura, width: pk.largura, length: pk.comprimento, weight: pk.peso },
      options: { insurance_value: r2(valorPecas), receipt: false, own_hand: false },
      services: c.servicos.join(","),
    }),
    cache: "no-store",
  });
  const corpo = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(corpo)) throw new Error(`Melhor Envio ${r.status}: ${corpo?.message || "erro"}`);
  const opcoes = (corpo as Resposta[])
    .filter((o) => !o.error && c.servicos.includes(o.id) && Number(o.custom_price ?? o.price) > 0)
    .map((o) => ({
      servico: o.id,
      nome: NOMES[o.id] ?? o.name,
      valorOriginal: r2(Number(o.custom_price ?? o.price)),
      prazo: Number(o.custom_delivery_time ?? o.delivery_time ?? 0) + c.diasPreparo,
    }));
  return aplicarFreteGratis(CFG, opcoes, valorPecas);
}
