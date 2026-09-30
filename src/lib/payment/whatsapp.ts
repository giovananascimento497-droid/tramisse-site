import type { Atendente, Pedido } from "../types";
import { brl } from "./pricing";
import type { ProvedorPagamento } from "./provider";

const NOMES_PAGAMENTO = { pix: "Pix", debito: "Cartão de débito", credito: "Cartão de crédito (até 2x)" } as const;

// Mesmo texto do site original.
export function resumoPedido(p: Pedido): string {
  const c = p.cliente;
  return (
    "Olá! Quero finalizar um pedido na Tramisse:\n\n" +
    p.itens.map((i) => `• ${i.nome} — ${i.cor}, tam. ${i.tam}, ${i.q}x — ${brl(i.precoUnitario * i.q)}`).join("\n") +
    `\n\nSubtotal: ${brl(p.subtotal)}` +
    (p.desconto ? `\nDesconto (${p.cupom}): -${brl(p.desconto)}` : "") +
    (p.acrescimo ? `\nAcréscimo do cartão (5%): ${brl(p.acrescimo)}` : "") +
    `\nTotal (sem entrega): ${brl(p.total)}\nPagamento: ${NOMES_PAGAMENTO[p.pagamento]}\n` +
    (p.entrega === "retirada"
      ? "Retirada"
      : `Entrega por aplicativo: ${[c.end, c.num, c.cmp, c.bai, c.cid, c.uf, c.cep].filter(Boolean).join(", ")} (destinatário: ${c.dest})`) +
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
