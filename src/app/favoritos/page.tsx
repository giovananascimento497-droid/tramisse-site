import type { Metadata } from "next";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

// Tela migrada do app.js na próxima etapa.
export default function FavoritosPage() {
  return (
    <div className="w">
      <h1>Favoritos</h1>
    </div>
  );
}
