"use client";

import { porId } from "@/lib/catalog";
import type { Produto } from "@/lib/types";
import { useLoja } from "@/store/Store";
import { Grid } from "../ProductCard";

export function FavoritesView() {
  const { fav } = useLoja();
  const itens = fav.map(porId).filter(Boolean) as Produto[];
  return (
    <div className="w" style={{ paddingTop: 48 }}>
      <h1 style={{ fontSize: "clamp(36px,5vw,64px)" }}>Meus favoritos</h1>
      <Grid itens={itens} style={{ margin: "32px 0 96px" }} vazio={<p style={{ color: "var(--mut)" }}>Toque no coração de uma peça para salvá-la aqui.</p>} />
    </div>
  );
}
