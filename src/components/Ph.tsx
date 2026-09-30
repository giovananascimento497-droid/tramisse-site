import type { CSSProperties } from "react";
import { CL, cores } from "@/lib/catalog";
import type { Produto } from "@/lib/types";

const FUNDOS = ["#DDD6CA", "#CFC6B8", "#B9AE9E", "#E7E0D3"];
// Sem 2ª/3ª foto, o original mostrava recortes ampliados da 1ª.
const RECORTES = ["", "scale(1.6)|68% 22%", "scale(1.6)|68% 78%"];

// Foto do produto (ou o degradê na cor da peça, quando ainda não há foto).
export function Ph({ p, i }: { p: Produto; i: number }) {
  const cs = cores(p);
  const a = CL[cs[i % cs.length]]?.hex;
  const z = FUNDOS[(p.id + i) % 4];
  const style = { "--a": a, "--z": z, "--d": `${140 + i * 35}deg` } as CSSProperties;
  const propria = p.imagens[i];
  const src = propria || (i < 3 ? p.imagens[0] : undefined);
  const [tr, orig] = propria ? ["", ""] : (RECORTES[i] || "").split("|");
  return (
    <div className="ph" style={style} role="img" aria-label={`${p.nome}, foto ${i + 1}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          decoding="async"
          src={src}
          alt={`${p.nome}, foto ${i + 1}`}
          style={tr ? { transform: tr, transformOrigin: orig } : undefined}
        />
      ) : (
        <span>{p.nome}</span>
      )}
    </div>
  );
}
