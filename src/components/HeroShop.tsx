"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brl } from "@/lib/payment/pricing";
import type { Produto } from "@/lib/types";

const INTERVALO = 5000; // ms de cada peça
const TEMPO_ENTRADA = 6000; // ms da imagem de entrada
const VIDEO_MAX = 40000; // o vídeo passa até o fim (no máximo 40 s)

type Banner = { imagem: string; frase: string; textoFrase: string; video?: string };

// Primeira imagem da home: a imagem de entrada (fundo + logo + frase), o vídeo da marca
// (se houver; passa inteiro e volta para a imagem) e as peças UMA POR VEZ, cada uma com
// nome, preço, "SHOP NOW" e link. Computador: foto/vídeo de um lado e painel greige com o
// texto do outro; celular: na tela toda.
type Foto = Pick<Produto, "slug" | "nome" | "imagens" | "preco">;
export function HeroShop({ fotos, banner }: { fotos: Foto[]; banner?: Banner }) {
  const [pag, setPag] = useState(0);
  const pausa = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const paginas = fotos;

  const temBanner = Boolean(banner?.imagem);
  const video = banner?.video || "";
  const iVideo = video ? (temBanner ? 1 : 0) : -1;
  const inicioPecas = (temBanner ? 1 : 0) + (video ? 1 : 0);
  const total = paginas.length + inicioPecas;
  const proxima = () => setPag((x) => (x + 1) % total);

  // Cada página fica o seu tempo; o vídeo troca quando termina.
  useEffect(() => {
    if (total < 2 || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    const v = videoRef.current;
    let t: ReturnType<typeof setTimeout>;
    let vivo = true;
    const esperar = (ms: number, ignorarPausa = false) => {
      if (!vivo) return;
      t = setTimeout(() => (!ignorarPausa && pausa.current ? esperar(1000) : proxima()), ms);
    };
    if (pag === iVideo && v) {
      v.currentTime = 0;
      v.play().then(() => esperar(VIDEO_MAX, true)).catch(() => esperar(INTERVALO, true));
      const fim = () => proxima();
      v.addEventListener("ended", fim);
      return () => { vivo = false; clearTimeout(t); v.removeEventListener("ended", fim); v.pause(); };
    }
    esperar(pag === 0 && temBanner ? TEMPO_ENTRADA : INTERVALO);
    return () => { vivo = false; clearTimeout(t); };
  }, [pag, total, iVideo, temBanner]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {video ? (
        <div className={`hs-pg hs-um hs-vd${pag === iVideo ? " on" : ""}`} aria-hidden={pag !== iVideo}>
          <Link className="hs-it" href="/categoria/new-in" tabIndex={pag === iVideo ? 0 : -1}>
            <video ref={videoRef} src={video} poster={video.replace(/\.mp4$/, ".jpg")} muted playsInline preload="metadata" />
            <div className="hs-txt">
              <small>TRAMISSE</small>
              <b>Essencial. Atemporal.</b>
              <span>VER NOVIDADES</span>
            </div>
          </Link>
        </div>
      ) : null}
      {paginas.map((f, k0) => {
        const k = k0 + inicioPecas;
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
