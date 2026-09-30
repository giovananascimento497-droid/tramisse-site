"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoja } from "@/store/Store";

// Mesma marcação do cabeçalho original: menu à esquerda, logo ao centro, ícones à direita.
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
      <nav className="pri" aria-label="Principal"></nav>
    </header>
  );
}
