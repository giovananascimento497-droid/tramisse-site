// Quem já comprou no site (para cupons de recompra, como o VOLTEI10). SÓ SERVIDOR.
// Conta pedidos pagos (Pago, Em separação, Enviado, Entregue) com o mesmo e-mail ou telefone.
import { listarPedidos } from "./store";
import { VENDIDO } from "./tipos";

const email = (e?: string) => (e || "").trim().toLowerCase();
const tel = (t?: string) => (t || "").replace(/\D/g, "").slice(-11);

export async function jaComprou(e?: string, t?: string) {
  const em = email(e);
  const tl = tel(t);
  if (!em && tl.length < 10) return false;
  const pedidos = await listarPedidos();
  return pedidos.some(
    (p) => VENDIDO.includes(p.situacao) && ((em && email(p.pedido.cliente.e) === em) || (tl.length >= 10 && tel(p.pedido.cliente.tel) === tl)),
  );
}
