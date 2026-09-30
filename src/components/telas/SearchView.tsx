"use client";

import { useSearchParams } from "next/navigation";
import { PRODS, slug } from "@/lib/catalog";
import { Grid } from "../ProductCard";

export function SearchView() {
  const q = useSearchParams().get("q") || "";
  const t = q.toLowerCase();
  const l = t ? PRODS.filter((p) => (p.nome + p.subcategoria + slug(p.subcategoria) + p.estilo.toLowerCase()).toLowerCase().includes(t)) : [];
  return (
    <div className="w" style={{ paddingTop: 48 }}>
      <h1>Busca: {q}</h1>
      <Grid itens={l} style={{ margin: "32px 0 96px" }} vazio={<p>Nada encontrado.</p>} />
    </div>
  );
}
