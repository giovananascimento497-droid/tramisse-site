"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { slug, TREE } from "@/lib/catalog";
import { useLoja } from "@/store/Store";

// Categorias visíveis no cabeçalho (computador). "Roupas" abre o menu grande com todas as subcategorias.
const ATALHOS: [string, string][] = [
  ["BLUSAS", "/categoria/roupas/blusas"],
  ["CALÇAS", "/categoria/roupas/calcas"],
  ["CONJUNTOS", "/categoria/roupas/conjuntos"],
  ["VESTIDOS", "/categoria/roupas/vestidos"],
  ["CURADORIA", "/categoria/curadoria"],
  ["COMING SOON", "/categoria/coming-soon"],
];

// Celular: menu à esquerda, logo ao centro, ícones à direita.
// Computador (src/styles/loja.css): logo à esquerda, categorias no meio, ícones à direita.
export function Header() {
  const { bag, fav, abrir } = useLoja();
  const router = useRouter();
  const nb = bag.reduce((a, l) => a + l.q, 0);
  const buscar = () => {
    const q = prompt("Buscar na Tramisse");
    if (q) router.push(`/busca?q=${encodeURIComponent(q)}`);
  };
  return (
    <header>
      <div className="w hd">
        <div>
          <button className="b" onClick={() => abrir("m")} aria-label="Abrir menu">
            <svg viewBox="0 0 24 24"><path d="M4 8h16M4 12h16M4 16h16" /></svg>
          </button>
        </div>
        <Link className="logo" href="/" aria-label="Tramisse, página inicial">TRAMISSE</Link>
        <nav className="pri" aria-label="Principal">
          <div><Link href="/categoria/new-in">NEW IN</Link></div>
          <div className="dd">
            <Link href="/categoria/roupas">ROUPAS</Link>
            <div className="sub">
              {Object.entries(TREE.roupas.grupos).map(([g, itens]) => (
                <div key={g}>
                  <b>{g.toUpperCase()}</b>
                  {itens.map((i) => <Link key={i} href={`/categoria/roupas/${slug(i)}`}>{i}</Link>)}
                </div>
              ))}
              <div>
                <b>COLEÇÕES</b>
                <Link href="/categoria/new-in">New In</Link>
                <Link href="/categoria/curadoria">Curadoria Especial</Link>
                <Link href="/categoria/coming-soon">Coming Soon</Link>
                <Link href="/categoria/todos">Ver tudo</Link>
              </div>
            </div>
          </div>
          {ATALHOS.map(([t, h]) => <div key={t}><Link href={h}>{t}</Link></div>)}
        </nav>
        <div className="ic">
          <button className="b" onClick={buscar} aria-label="Busca">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></svg>
          </button>
          <Link className="b hm" href="/conta" aria-label="Minha conta">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 15-5 16 0" /></svg>
          </Link>
          <Link className="b" href="/favoritos" aria-label="Favoritos">
            <svg viewBox="0 0 24 24"><path d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z" /></svg>
            <i style={fav.length ? undefined : { display: "none" }}>{fav.length}</i>
          </Link>
          <button className="b" onClick={() => abrir("g")} aria-label="Sacola">
            <svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 016 0v2" /></svg>
            <i style={nb ? undefined : { display: "none" }}>{nb}</i>
          </button>
        </div>
      </div>
    </header>
  );
}
