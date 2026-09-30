import type { Pedido } from "../types";

// Contrato de um meio de finalizar pedidos. Hoje só existe o WhatsApp
// (não cobra no site). Um gateway (Pix/cartão) deve implementar esta mesma
// interface, rodando no servidor, sem que o checkout precise mudar.
export type ResultadoCheckout =
  | { tipo: "redirecionar"; url: string }
  | { tipo: "pix"; copiaECola: string; qrCode: string; pedidoId: string };

export interface ProvedorPagamento {
  id: string;
  finalizar(pedido: Pedido): Promise<ResultadoCheckout>;
}
