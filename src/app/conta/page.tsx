import type { Metadata } from "next";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

// Tela migrada do app.js na próxima etapa.
export default function ContaPage() {
  return (
    <div className="w">
      <h1>Minha conta</h1>
    </div>
  );
}
