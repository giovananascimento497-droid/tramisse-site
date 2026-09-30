"use client";

import Link from "next/link";
import { CL, listar, slug, TODAS_CORES, TODOS_TAMANHOS, TREE, INFO, tamanhos, cores, temEstoque } from "@/lib/catalog";
import { useLoja, type Filtros } from "@/store/Store";
import { Grid } from "../ProductCard";

const ESTILOS = ["Casual", "Office", "Night", "Weekend"];

export function CategoryView({ k, sub }: { k: string; sub?: string }) {
  const { filtros: F, setFiltros } = useLoja();
  const I = INFO[k] || INFO.todos;
  const subs = k === "roupas" ? ["Blusas", "Calças", "Vestidos", "Saias", "Conjuntos", "Blazers"] : k === "acessorios" ? TREE.acessorios.grupos["Acessórios"] : [];

  let l = listar(k, sub);
  if (F.tam) l = l.filter((p) => tamanhos(p).includes(F.tam!));
  if (F.cor) l = l.filter((p) => cores(p).includes(F.cor!));
  if (F.pr) { const [a, b] = F.pr.split("-").map(Number); l = l.filter((p) => p.preco >= a && p.preco <= b); }
  if (F.est) l = l.filter((p) => p.estilo === F.est);
  if (F.disp) l = l.filter(temEstoque);
  const o = F.o || "n";
  l = [...l].sort((a, b) =>
    o === "lo" ? a.preco - b.preco : o === "hi" ? b.preco - a.preco : o === "b" ? Number(b.flags.maisVendida) - Number(a.flags.maisVendida) : b.id - a.id,
  );

  const sel = (n: keyof Filtros, lbl: string, opts: [string, string][]) => (
    <select aria-label={lbl} value={(F[n] as string) || ""} onChange={(e) => setFiltros({ ...F, [n]: e.target.value })}>
      <option value="">{lbl}</option>
      {opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </select>
  );

  return (
    <div className="w" style={{ paddingTop: 48 }}>
      <h1 style={{ fontSize: "clamp(36px,5vw,64px)" }}>
        {I.titulo}{sub ? " · " + sub.charAt(0).toUpperCase() + sub.slice(1) : ""}
      </h1>
      <p style={{ color: "var(--mut)", maxWidth: "52ch" }}>{I.texto}</p>
      {subs.length ? (
        <nav className="sn" aria-label="Subcategorias" style={{ marginTop: 24 }}>
          {subs.map((s) => (
            <Link key={s} href={`/categoria/${k}/${slug(s)}`} className={sub === slug(s) ? "on" : ""}>{s.toUpperCase()}</Link>
          ))}
          <Link href={`/categoria/${k}`} className={sub ? "" : "on"}>VER TUDO</Link>
        </nav>
      ) : null}
      <div className="bar">
        {sel("tam", "Tamanho", TODOS_TAMANHOS.map((x) => [x, x]))}
        {sel("cor", "Cor", TODAS_CORES.map((c) => [c, CL[c].nome]))}
        {sel("pr", "Preço", [["0-130", "Até R$ 130"], ["130-200", "R$ 130–200"], ["200-500", "Acima de R$ 200"]])}
        {sel("est", "Estilo", ESTILOS.map((x) => [x, x]))}
        <label>
          <input type="checkbox" checked={!!F.disp} onChange={(e) => setFiltros({ ...F, disp: e.target.checked })} style={{ minHeight: 0 }} /> Em estoque
        </label>
        <span style={{ flex: 1 }}></span>
        {sel("o", "Ordenar", [["n", "Mais recentes"], ["b", "Mais vendidos"], ["lo", "Menor preço"], ["hi", "Maior preço"]])}
      </div>
      <p style={{ color: "var(--mut)", fontSize: 13 }}>{l.length} {l.length === 1 ? "peça" : "peças"}</p>
      <Grid itens={l} style={{ marginBottom: 96 }} vazio={<p>Nenhuma peça por aqui ainda. Volte em breve ou veja a coleção completa.</p>} />
    </div>
  );
}
