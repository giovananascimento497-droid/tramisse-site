import type { Atendente, Pedido } from "../types";
import { brl } from "./pricing";
import type { ProvedorPagamento } from "./provider";

import { textoPrazo } from "../frete/regras";

const NOMES_PAGAMENTO = { pix: "Pix (5% de desconto)", debito: "Cartão de débito", credito: "Cartão de crédito (até 2x sem juros)" } as const;

// Forma de entrega com o endereço (usada no WhatsApp e no e-mail do pedido).
export function textoEntrega(p: Pedido): string {
  const c = p.cliente;
  if (p.entrega === "retirada") return "Retirada";
  const endereco = `${[c.end, c.num, c.cmp, c.bai, c.cid, c.uf, c.cep].filter(Boolean).join(", ")} (destinatário: ${c.dest})`;
  if (p.entrega === "correios" && p.frete)
    return `Correios ${p.frete.nome} (${textoPrazo(p.frete.prazo)}): ${endereco}`;
  return `Entrega por aplicativo: ${endereco}`;
}

// Mesmo texto do site original (com o frete, quando é pelos Correios).
export function resumoPedido(p: Pedido): string {
  const c = p.cliente;
  return (
    "Olá! Quero finalizar um pedido na Tramisse:\n\n" +
    p.itens.map((i) => `• ${i.nome} — ${i.cor}, tam. ${i.tam}, ${i.q}x — ${brl(i.precoUnitario * i.q)}`).join("\n") +
    `\n\nSubtotal: ${brl(p.subtotal)}` +
    (p.desconto ? `\nDesconto (${p.cupom}): -${brl(p.desconto)}` : "") +
    (p.descontoPix ? `\nDesconto Pix (5%): -${brl(p.descontoPix)}` : "") +
    (p.frete ? `\nFrete Correios ${p.frete.nome}: ${p.frete.gratis ? "grátis" : brl(p.frete.valor)}` : "") +
    `\n${p.entrega === "aplicativo" ? "Total (sem entrega)" : "Total"}: ${brl(p.total)}\nPagamento: ${NOMES_PAGAMENTO[p.pagamento]}` +
    (p.pagamentoOnline && p.pagamentoOnline.provedor !== "Pix"
      ? ` — ${p.pagamentoOnline.status === "aprovado" ? "pago" : "em processamento"} pelo ${p.pagamentoOnline.provedor} (pagamento nº ${p.pagamentoOnline.id})`
      : "") +
    (p.pagamentoOnline?.provedor === "Pix" ? `\nPix na chave da loja (pedido nº ${p.pagamentoOnline.id}). Envio o comprovante em seguida.` : "") +
    "\n" +
    textoEntrega(p) +
    `\n\nCliente: ${c.n} ${c.sn} · ${c.tel} · ${c.e}`
  );
}

// Comportamento atual: monta o resumo e abre o WhatsApp da atendente (não cobra no site).
export function provedorWhatsApp(atendente: Atendente): ProvedorPagamento {
  return {
    id: "whatsapp",
    async finalizar(pedido) {
      return { tipo: "redirecionar", url: `https://wa.me/${atendente.whatsapp}?text=${encodeURIComponent(resumoPedido(pedido))}` };
    },
  };
}
