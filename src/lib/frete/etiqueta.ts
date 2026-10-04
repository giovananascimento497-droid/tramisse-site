// Etiqueta dos Correios pelo Melhor Envio, a partir de um pedido do painel. SÓ SERVIDOR.
// Passos: carrinho (mostra o preço) → compra com o saldo da carteira do Melhor Envio →
// gera → imprime. O token precisa das permissões cart-read, cart-write, shipping-checkout,
// shipping-generate, shipping-print, shipping-tracking e orders-read (além de shipping-calculate).
import { porId } from "../catalog";
import { CFG } from "../config";
import { r2 } from "../payment/pricing";
import type { PedidoSalvo } from "../pedidos/tipos";
import type { Remetente } from "../pedidos/ajustes";
import { API, token } from "./melhorenvio";
import { limparCep, pacote } from "./regras";

async function me(caminho: string, init?: RequestInit) {
  const r = await fetch(API() + caminho, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
      "User-Agent": `Tramisse (${process.env.MELHORENVIO_CONTATO || "tramisse.com.br"})`,
    },
    cache: "no-store",
  });
  const corpo = await r.json().catch(() => null);
  if (!r.ok) {
    const det = corpo?.errors ? Object.values(corpo.errors as Record<string, string[]>).flat().join("; ") : "";
    const msg = `${corpo?.message || corpo?.error || "erro"}${det ? ` (${det})` : ""}`;
    throw Object.assign(new Error(`Melhor Envio ${r.status}: ${msg}`), { status: r.status });
  }
  return corpo;
}

const so = (s?: string) => String(s ?? "").replace(/\D/g, "");

// 1) Põe no carrinho do Melhor Envio. Devolve o id e o preço da etiqueta.
export async function prepararEtiqueta(p: PedidoSalvo, rem: Remetente) {
  const ped = p.pedido;
  const c = ped.cliente;
  if (ped.entrega !== "correios" || !ped.frete) throw new Error("Este pedido não é pelos Correios.");
  if (so(c.cpf).length !== 11) throw new Error("Falta o CPF da cliente (anote nas observações e peça a ela).");
  const linhas = ped.itens.map((i) => ({ p: porId(i.id) ?? ({ subcategoria: "" } as never), q: i.q }));
  const pk = pacote(CFG, linhas);
  const valor = r2(ped.itens.reduce((a, i) => a + i.precoFinal * i.q, 0));
  const doc = so(rem.documento);
  const r = await me("/api/v2/me/cart", {
    method: "POST",
    body: JSON.stringify({
      service: ped.frete.servico,
      from: {
        name: rem.nome, phone: so(rem.telefone), email: rem.email,
        ...(doc.length === 14 ? { company_document: doc } : { document: doc }),
        address: rem.endereco, number: rem.numero, complement: rem.complemento, district: rem.bairro,
        city: rem.cidade, state_abbr: rem.uf, country_id: "BR", postal_code: limparCep(rem.cep),
      },
      to: {
        name: c.dest || [c.n, c.sn].filter(Boolean).join(" "), phone: so(c.tel), email: c.e || "", document: so(c.cpf),
        address: c.end || "", number: c.num || "", complement: c.cmp || "", district: c.bai || "",
        city: c.cid || "", state_abbr: (c.uf || "").toUpperCase().slice(0, 2), country_id: "BR", postal_code: limparCep(c.cep),
      },
      products: ped.itens.map((i) => ({ name: `${i.nome} (${i.cor}, ${i.tam})`, quantity: i.q, unitary_value: r2(i.precoFinal) })),
      volumes: [{ height: pk.altura, width: pk.largura, length: pk.comprimento, weight: pk.peso }],
      options: {
        insurance_value: valor, receipt: false, own_hand: false, reverse: false,
        non_commercial: true, // declaração de conteúdo (sem nota fiscal)
        platform: "Tramisse", tags: [{ tag: p.id, url: null }],
      },
    }),
  });
  return { id: String(r.id), preco: r2(Number(r.price) || 0), protocolo: r.protocol ? String(r.protocol) : undefined };
}

// 2) Compra (saldo da carteira do Melhor Envio) e 3) gera a etiqueta.
export async function pagarEtiqueta(id: string) {
  await me("/api/v2/me/shipment/checkout", { method: "POST", body: JSON.stringify({ orders: [id] }) });
}
export async function gerarEtiqueta(id: string) {
  await me("/api/v2/me/shipment/generate", { method: "POST", body: JSON.stringify({ orders: [id] }) });
}

// 3) Link para imprimir (PDF).
export async function linkEtiqueta(id: string): Promise<string> {
  const r = await me("/api/v2/me/shipment/print", { method: "POST", body: JSON.stringify({ mode: "private", orders: [id] }) });
  if (!r?.url) throw new Error("O Melhor Envio não devolveu o link da etiqueta.");
  return String(r.url);
}

// Situação e código de rastreio.
export async function consultarEtiqueta(id: string): Promise<{ status: string; rastreio: string }> {
  const r = await me(`/api/v2/me/orders/${encodeURIComponent(id)}`);
  return { status: String(r?.status || ""), rastreio: String(r?.tracking || r?.self_tracking || "") };
}

export async function descartarEtiqueta(id: string) {
  await me(`/api/v2/me/cart/${encodeURIComponent(id)}`, { method: "DELETE" });
}
