import type { Metadata } from "next";
import { FavoritesView } from "@/components/telas/FavoritesView";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default function FavoritosPage() {
  return <FavoritesView />;
}
