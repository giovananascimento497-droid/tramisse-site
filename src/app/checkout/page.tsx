import type { Metadata } from "next";
import { CheckoutView } from "@/components/telas/CheckoutView";
import { mercadoPagoAtivo } from "@/lib/payment/mercadopago";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// Lê o token a cada acesso (não fica "congelado" no build).
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  // O botão do Mercado Pago só aparece quando o token está configurado no servidor.
  return <CheckoutView mercadoPago={mercadoPagoAtivo()} />;
}
