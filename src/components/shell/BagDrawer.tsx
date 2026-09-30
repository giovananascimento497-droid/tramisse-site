"use client";

import Link from "next/link";
import { useState } from "react";
import { CL, estoqueDe, porId } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import { acharCupom, brl, calcularTotais } from "@/lib/payment/pricing";
import { useLoja } from "@/store/Store";
import { Ph } from "../Ph";

// Linhas da sacola com o preço de vitrine de cada peça (para calcularTotais).
export function linhasSacola(bag: { id: number; q: number }[]) {
  return bag.map((l) => ({ preco: porId(l.id)?.preco ?? 0, q: l.q }));
}

export function BagDrawer() {
  const { bag, setBag, cupom, setCupom, abrir } = useLoja();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const fechar = () => abrir(null);
  const t = calcularTotais(CFG, linhasSacola(bag), null, cupom);
  const n = bag.reduce((a, l) => a + l.q, 0);

  const aplicar = () => {
    const c = codigo.trim().toUpperCase();
    if (acharCupom(CFG, c)) { setCupom(c); setErro(""); } else setErro("Código inválido. Confira e tente de novo.");
  };
  // "+" respeita o estoque real da cor/tamanho.
  const qtd = (i: number, d: number) =>
    setBag((b) =>
      b.flatMap((l, k) => {
        if (k !== i) return [l];
        const p = porId(l.id);
        const max = p ? estoqueDe(p, l.cor, l.tam) : 0;
        const q = Math.min(l.q + d, max);
        return q < 1 ? [] : [{ ...l, q }];
      }),
    );

  return (
    <aside className="dr" id="bag" aria-label="Sacola">
      <div className="dh">
        <h2>Sacola ({n})</h2>
        <button className="b" onClick={fechar} aria-label="Fechar">✕</button>
      </div>
      {bag.length ? (
        <>
          <div style={{ flex: 1 }}>
            {bag.map((l, i) => {
              const p = porId(l.id);
              if (!p) return null;
              return (
                <div className="ln" key={`${l.id}-${l.cor}-${l.tam}`}>
                  <div className="im"><Ph p={p} i={0} /></div>
                  <div>
                    <Link href={`/produto/${p.slug}`} onClick={fechar}>{p.nome}</Link><br />
                    <small>{CL[l.cor]?.nome} · {l.tam}</small><br />
                    {brl(p.preco)}
                    <div style={{ marginTop: 8 }}>
                      <span className="qty">
                        <button onClick={() => qtd(i, -1)} aria-label="Diminuir">−</button>
                        <span>{l.q}</span>
                        <button onClick={() => qtd(i, 1)} aria-label="Aumentar">+</button>
                      </span>
                      <button className="r" onClick={() => setBag((b) => b.filter((_, k) => k !== i))}>Remover</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--mut)", margin: "16px 0 0" }}>
            Entrega por aplicativo: o valor é informado na compra.
          </p>
          <div className="cp">
            <input
              placeholder="Código de desconto"
              aria-label="Código de desconto"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aplicar()}
            />
            <button className="btn o" onClick={aplicar} style={{ padding: "0 20px" }}>OK</button>
          </div>
          <div className="er">{erro || (cupom ? <span className="okk">Cupom {cupom} aplicado.</span> : null)}</div>
          <div className="tt"><span>Subtotal</span><span>{brl(t.subtotal)}</span></div>
          <div className="tt"><span>Entrega</span><span>Por aplicativo</span></div>
          {t.desconto ? <div className="tt"><span>Desconto</span><span>-{brl(t.desconto)}</span></div> : null}
          <div className="tt big"><span>Total</span><span>{brl(t.total)}</span></div>
          <Link className="btn f" href="/checkout" style={{ marginTop: 16 }} onClick={fechar}>FINALIZAR COMPRA</Link>
          <button className="btn o f" onClick={fechar} style={{ marginTop: 8, border: 0 }}>CONTINUAR COMPRANDO</button>
        </>
      ) : (
        <>
          <p style={{ flex: 1, color: "var(--mut)" }}>Sua sacola está vazia.</p>
          <Link className="btn f" href="/categoria/new-in" onClick={fechar}>VER NEW IN</Link>
        </>
      )}
    </aside>
  );
}
