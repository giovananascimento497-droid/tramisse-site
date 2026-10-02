// Integração com o Mercado Pago (Checkout Pro). SÓ PARA O SERVIDOR:
// usa o token secreto MERCADOPAGO_ACCESS_TOKEN (nunca importar em componente "use client").
import type { FormaPagamento, Pedido } from "../types";

const API = process.env.MERCADOPAGO_API_URL || "https://api.mercadopago.com";
// trim: um espaço ou quebra de linha colado junto com o token faz o Mercado Pago recusar.
const token = () => (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();

export const mercadoPagoAtivo = () => Boolean(token());

// A forma de pagamento é escolhida no site, então o Mercado Pago só oferece a escolhida
// (crédito em até 2x sem juros ou débito). Pix é pago direto na chave da loja.
// "account_money" (saldo na conta Mercado Pago) não pode ser excluído: o Mercado Pago recusa a preferência.
const TIPOS = ["credit_card", "debit_card", "bank_transfer", "ticket", "atm", "prepaid_card"];
const PERMITIDOS: Record<FormaPagamento, string[]> = {
  pix: ["bank_transfer"],
  debito: ["debit_card"],
  credito: ["credit_card"],
};

const slugCurto = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "");

async function mp(caminho: string, init?: RequestInit) {
  const r = await fetch(API + caminho, {
    ...init,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${corpo.message || corpo.error || "erro"}${corpo.cause?.[0]?.description ? ` (${corpo.cause[0].description})` : ""}`);
  return corpo;
}

// opcoes.estoque: peças compradas no formato "id:cor:tamanho:qtd|..." (volta no aviso de pagamento
// para o site baixar o estoque sozinho quando o pagamento for aprovado).
export async function criarPreferencia(pedido: Pedido, opcoes: { referencia: string; origem: string; maxParcelas: number; estoque?: string }) {
  const c = pedido.cliente;
  const https = opcoes.origem.startsWith("https://");
  const retorno = `${opcoes.origem}/checkout/retorno`;
  const corpo = {
    // Cada peça com o seu valor exato (preço de vitrine, já com a taxa do cartão e o cupom, se houver).
    items: pedido.itens.map((i) => ({
      id: `${i.slug}-${slugCurto(i.cor)}-${i.tam}`,
      title: `${i.nome} — ${i.cor}, tam. ${i.tam}`,
      quantity: i.q,
      currency_id: "BRL",
      unit_price: i.precoFinal,
    })).concat(
      // Frete dos Correios como mais um item (frete grátis não entra).
      pedido.frete && pedido.frete.valor > 0
        ? [{ id: `frete-${pedido.frete.servico}`, title: `Frete Correios ${pedido.frete.nome}`, quantity: 1, currency_id: "BRL", unit_price: pedido.frete.valor }]
        : [],
    ),
    payer: { name: c.n, surname: c.sn, email: c.e },
    external_reference: opcoes.referencia,
    statement_descriptor: "TRAMISSE",
    back_urls: { success: retorno, pending: retorno, failure: retorno },
    // O Mercado Pago só volta sozinho para o site quando o endereço é https (em produção).
    ...(https ? { auto_return: "approved", notification_url: `${opcoes.origem}/api/pagamento/mercadopago/webhook?source_news=webhooks` } : {}),
    payment_methods: {
      excluded_payment_types: TIPOS.filter((t) => !PERMITIDOS[pedido.pagamento].includes(t)).map((id) => ({ id })),
      installments: pedido.pagamento === "credito" ? opcoes.maxParcelas : 1,
    },
    metadata: { estoque: opcoes.estoque ?? "", pagamento: pedido.pagamento, entrega: pedido.entrega, cupom: pedido.cupom ?? null, frete: pedido.frete?.valor ?? null, total: pedido.total },
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
    estoque: String(r.metadata?.estoque || ""),
  };
}

// Diagnóstico: confere se o token está configurado e se o Mercado Pago o aceita (sem expor o token).
export async function verificarToken() {
  const t = token();
  if (!t) return { configurado: false, mensagem: "MERCADOPAGO_ACCESS_TOKEN não está configurado no servidor (ou o deploy foi feito antes de criar a variável)." };
  const tipo = t.startsWith("TEST-") ? "teste" : t.startsWith("APP_USR-") ? "produção" : "formato desconhecido";
  const tamanho = t.length;
  try {
    const r = await mp("/users/me");
    return { configurado: true, tipo, tamanho, aceito: true, conta: r.nickname || r.id, mensagem: "Token aceito pelo Mercado Pago." };
  } catch (e) {
    return {
      configurado: true,
      tipo,
      tamanho,
      aceito: false,
      mensagem: e instanceof Error ? e.message : "erro",
      dica: tamanho < 60 ? "Token curto demais: parece a Public Key. Copie o Access Token." : "Confira se copiou o Access Token inteiro e se as credenciais de produção estão ativadas.",
    };
  }
}
