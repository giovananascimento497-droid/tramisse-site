"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brl } from "@/lib/payment/pricing";
import type { Produto } from "@/lib/types";

const INTERVALO = 5000; // ms entre uma troca e outra

type Banner = { imagem: string; frase: string; textoFrase: string };

// Primeira imagem da home: a imagem de início (fundo + logo + frase) e, em seguida,
// as peças se revezando UMA POR VEZ, cada uma com nome, preço, "SHOP NOW" e link para a peça.
// Computador: foto inteira de um lado e painel greige com o texto do outro; celular: foto na tela toda.
type Foto = Pick<Produto, "slug" | "nome" | "imagens" | "preco">;
export function HeroShop({ fotos, banner }: { fotos: Foto[]; banner?: Banner }) {
  const [pag, setPag] = useState(0);
  const pausa = useRef(false);
  const paginas = fotos;

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
      {paginas.map((f, k0) => {
        const k = k0 + (temBanner ? 1 : 0);
        return (
          <div key={f.slug} className={`hs-pg hs-um${k === pag ? " on" : ""}`} aria-hidden={k !== pag}>
            <Link className="hs-it" href={`/produto/${f.slug}`} tabIndex={k === pag ? 0 : -1}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.imagens[0]} alt={f.nome} loading={k < 2 ? "eager" : "lazy"} decoding="async" />
              <div className="hs-txt">
                <small>NEW IN</small>
                <b>{f.nome}</b>
                <em>{brl(f.preco)}</em>
                <span>SHOP NOW</span>
              </div>
            </Link>
          </div>
        );
      })}
      {total > 1 ? (
        <>
          <button className="hs-seta hs-ant lj-only" aria-label="Anterior" onClick={() => setPag((x) => (x - 1 + total) % total)}>‹</button>
          <button className="hs-seta hs-prox lj-only" aria-label="Próxima" onClick={() => setPag((x) => (x + 1) % total)}>›</button>
          <div className="hs-dots lj-only">
            {Array.from({ length: total }, (_, k) => (
              <button key={k} aria-label={`Ir para a imagem ${k + 1}`} aria-current={k === pag} onClick={() => setPag(k)} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
