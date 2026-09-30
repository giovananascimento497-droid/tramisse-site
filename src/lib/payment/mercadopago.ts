// Integração com o Mercado Pago (Checkout Pro). SÓ PARA O SERVIDOR:
// usa o token secreto MERCADOPAGO_ACCESS_TOKEN (nunca importar em componente "use client").
import type { FormaPagamento, Pedido } from "../types";

const API = process.env.MERCADOPAGO_API_URL || "https://api.mercadopago.com";
const token = () => process.env.MERCADOPAGO_ACCESS_TOKEN || "";

export const mercadoPagoAtivo = () => Boolean(token());

// A forma de pagamento é escolhida no site (por causa do acréscimo de 5% no cartão),
// então o Mercado Pago só oferece a forma escolhida.
const TIPOS = ["credit_card", "debit_card", "bank_transfer", "ticket", "atm", "prepaid_card", "account_money"];
const PERMITIDOS: Record<FormaPagamento, string[]> = {
  pix: ["bank_transfer"], // Pix
  debito: ["debit_card"],
  credito: ["credit_card"],
};

const centavos = (v: number) => Math.round(v * 100) / 100;

async function mp(caminho: string, init?: RequestInit) {
  const r = await fetch(API + caminho, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${corpo.message || "erro"}`);
  return corpo;
}

export async function criarPreferencia(pedido: Pedido, opcoes: { referencia: string; origem: string; maxParcelas: number }) {
  const c = pedido.cliente;
  const pecas = pedido.itens.reduce((a, i) => a + i.q, 0);
  const https = opcoes.origem.startsWith("https://");
  const retorno = `${opcoes.origem}/checkout/retorno`;
  const corpo = {
    // Um item com o total já calculado (desconto do cupom e acréscimo do cartão incluídos).
    items: [
      {
        id: opcoes.referencia,
        title: `Pedido Tramisse (${pecas} ${pecas === 1 ? "peça" : "peças"})`,
        description: pedido.itens.map((i) => `${i.q}x ${i.nome} ${i.cor} ${i.tam}`).join("; ").slice(0, 250),
        quantity: 1,
        currency_id: "BRL",
        unit_price: centavos(pedido.total),
      },
    ],
    payer: { name: c.n, surname: c.sn, email: c.e },
    external_reference: opcoes.referencia,
    statement_descriptor: "TRAMISSE",
    back_urls: { success: retorno, pending: retorno, failure: retorno },
    // O Mercado Pago só volta sozinho para o site quando o endereço é https (em produção).
    ...(https ? { auto_return: "approved" } : {}),
    payment_methods: {
      excluded_payment_types: TIPOS.filter((t) => !PERMITIDOS[pedido.pagamento].includes(t)).map((id) => ({ id })),
      installments: pedido.pagamento === "credito" ? opcoes.maxParcelas : 1,
    },
    metadata: { pagamento: pedido.pagamento, entrega: pedido.entrega, cupom: pedido.cupom ?? null },
  };
  const r = await mp("/checkout/preferences", { method: "POST", body: JSON.stringify(corpo) });
  // Token de teste (TEST-...) usa o ambiente de testes do Mercado Pago.
  const url: string = token().startsWith("TEST-") ? r.sandbox_init_point || r.init_point : r.init_point;
  if (!url) throw new Error("Mercado Pago não retornou o link de pagamento");
  return { url, preferenciaId: r.id as string };
}

export async function consultarPagamento(id: string) {
  const r = await mp(`/v1/payments/${encodeURIComponent(id)}`);
  return {
    id: String(r.id),
    status: r.status as string, // approved | pending | in_process | rejected | cancelled ...
    referencia: (r.external_reference as string) || "",
    valor: Number(r.transaction_amount) || 0,
  };
}
