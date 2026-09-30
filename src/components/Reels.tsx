"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { porId } from "@/lib/catalog";
import { CFG } from "@/lib/config";

// Seção "Em movimento": vídeos (ou a foto com zoom lento, enquanto não há vídeo)
// com rolagem automática, pausada ao passar o mouse.
export function Reels({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rc = ref.current;
    if (!rc) return;
    const vio = new IntersectionObserver(
      (es) => es.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
      }),
      { threshold: 0.5 },
    );
    rc.querySelectorAll("video").forEach((v) => vio.observe(v));
    let rt: ReturnType<typeof setInterval> | undefined;
    if (!matchMedia("(prefers-reduced-motion:reduce)").matches) {
      rt = setInterval(() => {
        if (rc.matches(":hover")) return;
        const fim = rc.scrollLeft + rc.clientWidth >= rc.scrollWidth - 4;
        rc.scrollTo({ left: fim ? 0 : rc.scrollLeft + rc.clientWidth * 0.5, behavior: "smooth" });
      }, 3800);
    }
    return () => { vio.disconnect(); clearInterval(rt); };
  }, []);

  return (
    <div className="car reels" id={id} ref={ref}>
      {CFG.videos.map((v) => {
        const p = porId(v.produtoId);
        if (!p) return null;
        return (
          <Link key={v.produtoId} className="reel" href={`/produto/${p.slug}`}>
            {v.src ? (
              <video src={v.src} poster={p.imagens[0]} muted loop playsInline preload="none"></video>
            ) : p.imagens[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="kb" loading="lazy" src={p.imagens[0]} alt={p.nome} />
            ) : null}
            <span>{p.nome.toUpperCase()}</span>
          </Link>
        );
      })}
    </div>
  );
}
