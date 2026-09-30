import Link from "next/link";
import type { CSSProperties } from "react";
import { porId } from "@/lib/catalog";
import { CFG } from "@/lib/config";

export function Tile({ t, href, foto }: { t: string; href: string; foto?: number | "brand" | "cover" }) {
  const src =
    foto === "brand" ? CFG.imagensMarca.brand : foto === "cover" ? CFG.imagensMarca.cover : foto ? porId(foto)?.imagens[0] : "";
  return (
    <Link className="tile" href={href}>
      <div className="ph" style={{ "--a": "#CFC6B8", "--z": "#8F8577" } as CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img loading="lazy" src={src} alt={t || "Tramisse"} /> : null}
      </div>
      <em>{t}</em>
    </Link>
  );
}
