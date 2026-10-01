import Link from "next/link";
import { CL, cores, esgotado } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import { brl, parcelado } from "@/lib/payment/pricing";
import type { Produto } from "@/lib/types";
import { FavButton } from "./FavButton";
import { Ph } from "./Ph";

export function ProductCard({ p }: { p: Produto }) {
  const href = `/produto/${p.slug}`;
  return (
    <article className="card">
      {p.emBreve ? (
        <span className="tag">COMING SOON</span>
      ) : esgotado(p) ? (
        <span className="tag">ESGOTADO</span>
      ) : p.precoDe ? (
        <span className="tag">-{Math.round((1 - p.preco / p.precoDe) * 100)}%</span>
      ) : p.flags.novo ? (
        <span className="tag">NEW IN</span>
      ) : null}
      <FavButton id={p.id} />
      <Link className="im" href={href}>
        <Ph p={p} i={0} />
        <div className="h"><Ph p={p} i={1} /></div>
      </Link>
      <div className="sw">
        {cores(p).map((c) => <i key={c} style={{ background: CL[c].hex }} title={CL[c].nome}></i>)}
      </div>
      <Link className="n" href={href}>{p.nome}</Link>
      <b>{p.precoDe ? <s>{brl(p.precoDe)}</s> : null}{brl(p.preco)}</b>
      <small>{parcelado(CFG, p.preco)}</small>
    </article>
  );
}

export function Grid({ itens, vazio, style }: { itens: Produto[]; vazio: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="grid" style={style}>
      {itens.length ? itens.map((p) => <ProductCard key={p.id} p={p} />) : vazio}
    </div>
  );
}
