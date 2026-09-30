import type { Metadata } from "next";

// Área do painel administrativo (produtos, estoque, pedidos, clientes, cupons).
// Antes de colocar qualquer função aqui, proteger com autenticação.
export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="w">{children}</div>;
}
