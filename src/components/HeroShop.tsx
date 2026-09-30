"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Produto } from "@/lib/types";

const INTERVALO = 5000; // ms entre uma troca e outra

type Banner = { imagem: string; frase: string; textoFrase: string };

// Primeira imagem da home: a imagem de início (fundo + logo + frase) e, em seguida,
// as fotos das peças se revezando, cada uma com "SHOP NOW" e link para a peça.
// Computador: 3 fotos lado a lado; celular: 1 por vez.
export function HeroShop({ fotos, banner }: { fotos: Pick<Produto, "slug" | "nome" | "imagens">[]; banner?: Banner }) {
  const [n, setN] = useState(3);
  const [pag, setPag] = useState(0);
  const pausa = useRef(false);

  useEffect(() => {
    const mq = matchMedia("(max-width:700px)");
    const f = () => { setN(mq.matches ? 1 : 3); setPag(0); };
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  // Páginas de n fotos (a última é completada com as primeiras, para não ficar buraco).
  const paginas: (typeof fotos)[] = [];
  for (let i = 0; i < fotos.length; i += n) {
    const p = fotos.slice(i, i + n);
    while (p.length < n && fotos.length >= n) p.push(fotos[(i + p.length) % fotos.length]);
    paginas.push(p);
  }

  const temBanner = Boolean(banner?.imagem);
  const total = paginas.length + (temBanner ? 1 : 0);

  useEffect(() => {
    if (total < 2 || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    const t = setInterval(() => { if (!pausa.current) setPag((x) => (x + 1) % total); }, INTERVALO);
    return () => clearInterval(t);
  }, [total]);

  return (
    <section
      className="hero hs"
      aria-label="Shop now"
      onMouseEnter={() => (pausa.current = true)}
      onMouseLeave={() => (pausa.current = false)}
    >
      {temBanner ? (
        <div className={`hs-pg hs-bn${pag === 0 ? " on" : ""}`} aria-hidden={pag !== 0}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hs-bg" src={banner!.imagem} alt="" />
          <div className="hs-bn-in">
            <h1 className="logo big">TRAMISSE</h1>
            {banner!.frase ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hs-frase" src={banner!.frase} alt={banner!.textoFrase} />
            ) : null}
          </div>
        </div>
      ) : null}
      {paginas.map((pg0, k0) => ({ p: pg0, k: k0 + (temBanner ? 1 : 0) })).map(({ p, k }) => (
        <div key={`${n}-${k}`} className={`hs-pg${k === pag ? " on" : ""}`} aria-hidden={k !== pag} style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
          {p.map((f, j) => (
            <Link key={j} className="hs-it" href={`/produto/${f.slug}`} tabIndex={k === pag ? 0 : -1}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.imagens[0]} alt={f.nome} loading={k < 2 ? "eager" : "lazy"} decoding="async" />
              <span>SHOP NOW</span>
            </Link>
          ))}
        </div>
      ))}
    </section>
  );
}
