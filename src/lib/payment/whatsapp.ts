import type { Atendente, Pedido } from "../types";
import { brl } from "./pricing";
import type { ProvedorPagamento } from "./provider";

const NOMES_PAGAMENTO = { pix: "Pix", debito: "Débito", credito: "Crédito" } as const;
const NOMES_ENTREGA = { aplicativo: "Entrega por aplicativo", retirada: "Retirada" } as const;

export function resumoPedido(p: Pedido): string {
  const linhas = [
    "Olá! Gostaria de finalizar meu pedido na Tramisse:",
    "",
    ...p.itens.map(
      (i) => `• ${i.quantidade}x ${i.nome} (${i.cor}, ${i.tamanho}) ${brl(i.precoUnitario * i.quantidade)}`,
    ),
    "",
    `Subtotal: ${brl(p.subtotal)}`,
  ];
  if (p.desconto) linhas.push(`Desconto${p.cupom ? ` (${p.cupom})` : ""}: -${brl(p.desconto)}`);
  if (p.acrescimo) linhas.push(`Acréscimo: ${brl(p.acrescimo)}`);
  linhas.push(
    `Total: ${brl(p.total)}`,
    `Pagamento: ${NOMES_PAGAMENTO[p.pagamento]}${p.parcelas > 1 ? ` em ${p.parcelas}x` : ""}`,
    `Entrega: ${NOMES_ENTREGA[p.entrega]}`,
    "",
    `Nome: ${p.cliente.nome}`,
    `Telefone: ${p.cliente.telefone}`,
  );
  if (p.cliente.endereco) linhas.push(`Endereço: ${p.cliente.endereco}`);
  return linhas.join("\n");
}

// Comportamento atual: monta o resumo e abre o WhatsApp da atendente.
export function provedorWhatsApp(atendente: Atendente): ProvedorPagamento {
  return {
    id: "whatsapp",
    async finalizar(pedido) {
      const texto = encodeURIComponent(resumoPedido(pedido));
      return { tipo: "redirecionar", url: `https://wa.me/${atendente.whatsapp}?text=${texto}` };
    },
  };
}
