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
};
