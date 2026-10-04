"use client";

import Link from "next/link";
import { Fragment } from "react";
import { slug, TEM_ACESSORIOS, TEM_SALE, TREE } from "@/lib/catalog";
import { useLoja } from "@/store/Store";

export function MenuDrawer() {
  const { abrir } = useLoja();
  const fechar = () => abrir(null);
  const md = (k: string, l: string) => (
    <details>
      <summary>{l}</summary>
      {Object.entries(TREE[k].grupos).map(([g, a]) => (
        <Fragment key={g}>
          {k === "roupas" ? <small>{g.toUpperCase()}</small> : null}
          {a.map((s) => <Link key={s} href={`/categoria/${k}/${slug(s)}`} onClick={fechar}>{s}</Link>)}
        </Fragment>
      ))}
      <Link href={`/categoria/${k}`} onClick={fechar}>Ver tudo</Link>
    </details>
  );
  return (
    <aside className="dr" id="menu" aria-label="Menu">
      <div className="dh">
        <h2>Menu</h2>
        <button className="b" onClick={fechar} aria-label="Fechar">✕</button>
      </div>
      <div className="ml">
        <Link href="/categoria/new-in" onClick={fechar}>NEW IN</Link>
        <Link href="/categoria/coming-soon" onClick={fechar}>COMING SOON</Link>
        <Link href="/categoria/curadoria" onClick={fechar}>CURADORIA ESPECIAL</Link>
        <Link href="/categoria/jeans" onClick={fechar}>JEANS</Link>
        {md("roupas", "ROUPAS")}
        {TEM_ACESSORIOS ? md("acessorios", "ACESSÓRIOS") : null}
        {TEM_SALE ? <Link href="/categoria/sale" onClick={fechar}>SALE</Link> : null}
        <Link href="/conta" onClick={fechar}>MINHA CONTA</Link>
        <Link href="/favoritos" onClick={fechar}>FAVORITOS</Link>
        <Link href="/pagina/contato" onClick={fechar}>FALE CONOSCO</Link>
      </div>
    </aside>
  );
}
