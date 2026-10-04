import type { Pedido } from "../types";

// Tipos e nomes dos pedidos do painel (sem nada de servidor: usados também na tela).
export const SITUACOES = ["aguardando", "pago", "separacao", "enviado", "entregue", "cancelado"] as const;
export type Situacao = (typeof SITUACOES)[number];
export const NOMES_SITUACAO: Record<Situacao, string> = {
  aguardando: "Aguardando pagamento",
  pago: "Pago",
  separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
export const NOMES_CANAL = { whatsapp: "WhatsApp", pix: "Pix no site", mercadopago: "Mercado Pago" } as const;

export type PedidoSalvo = {
  id: string;
  criadoEm: string; // ISO
  atualizadoEm: string;
  canal: keyof typeof NOMES_CANAL;
  atendente: string;
  situacao: Situacao;
  pedido: Pedido;
  mercadoPago?: { id: string; status: string };
  rastreio?: string;
  obs?: string;
  // Estoque desta venda: "baixado" quando ficou paga; "devolvido" se depois foi cancelada. seq = nº de movimentos.
  estoque?: { estado: "baixado" | "devolvido"; seq: number };
  // Etiqueta dos Correios comprada pelo Melhor Envio (id = pedido no Melhor Envio).
  etiqueta?: { id: string; servico: number; preco: number; status: "carrinho" | "paga" | "gerada"; protocolo?: string };
  // E-mails já mandados para a cliente (recebido, pago, enviado).
  avisos?: string[];
};

// Situações que contam como venda (estoque baixado).
export const VENDIDO: Situacao[] = ["pago", "separacao", "enviado", "entregue"];
