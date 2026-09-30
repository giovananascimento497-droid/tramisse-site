import type { Metadata } from "next";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

// Tela migrada do app.js na próxima etapa.
export default function CheckoutPage() {
  return (
    <div className="w">
      <h1>Finalizar compra</h1>
    </div>
  );
}
