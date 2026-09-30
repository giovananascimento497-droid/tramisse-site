"use client";

import type { CSSProperties } from "react";
import { useLoja } from "@/store/Store";

const Coracao = () => (
  <svg viewBox="0 0 24 24"><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z" /></svg>
);

export function FavButton({ id, style }: { id: number; style?: CSSProperties }) {
  const { fav, toggleFav } = useLoja();
  return (
    <button
      className="fav"
      style={style}
      aria-pressed={fav.includes(id)}
      aria-label="Favoritar"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(id); }}
    >
      <Coracao />
    </button>
  );
}
