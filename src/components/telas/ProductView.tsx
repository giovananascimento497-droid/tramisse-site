"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import { CL, cores, porId, tamanhoUnico, tamanhos } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import { brl, parcelado, precoPix } from "@/lib/payment/pricing";
import { useLoja } from "@/store/Store";
import { FavButton } from "../FavButton";
import { Ph } from "../Ph";

export function ProductView({ id }: { id: number }) {
  const p = porId(id)!;
  const cs = cores(p);
  const tams = tamanhos(p);
  const { setBag, abrir, setGuia } = useLoja();
  const [cor, setCor] = useState(cs[0]);
  const [tam, setTam] = useState<string | null>(tamanhoUnico(p, cs[0]));
  const [q, setQ] = useState(1);
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origem, setOrigem] = useState({ x: "50%", y: "50%" });
  const [erro, setErro] = useState("");

  const mover = (e: MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigem({ x: ((e.clientX - r.left) / r.width) * 100 + "%", y: ((e.clientY - r.top) / r.height) * 100 + "%" });
  };
  const adicionar = () => {
    if (!tam) return setErro("Escolha um tamanho para continuar.");
    setErro("");
    setBag((b) => {
      const k = b.find((l) => l.id === p.id && l.tam === tam && l.cor === cor);
      return k ? b.map((l) => (l === k ? { ...l, q: l.q + q } : l)) : [...b, { id: p.id, tam, cor, q }];
    });
    abrir("g");
  };
  const acordeao: [string, string][] = [
    ["DESCRIÇÃO", p.descricao],
    ["COMPOSIÇÃO", p.tecido ? `Tecido: ${p.tecido}.` : "Sob consulta no atendimento."],
    ["DETALHES", `Tamanhos da peça: ${tams.join(", ")}.`],
    ["CUIDADOS", "Siga as instruções da etiqueta da peça."],
    ["ENTREGA", "Entrega exclusivamente por aplicativo, mediante consulta. O valor é de responsabilidade da cliente e informado no momento da compra. A retirada também é possível."],
    ["TROCAS E DEVOLUÇÕES", "Em até 7 dias, com a etiqueta fixada na peça e mediante disponibilidade de estoque. Solicite pelo nosso atendimento."],
  ];

  return (
    <div className="pdp">
      <div className="gal">
        <div className="th">
          {[0, 1, 2, 3].map((i) => (
            <button key={i} onClick={() => setImg(i)} aria-current={img === i} aria-label={`Foto ${i + 1}`}>
              <Ph p={p} i={i} />
            </button>
          ))}
        </div>
        <div
          className={`main${zoom ? " z" : ""}`}
          onClick={() => setZoom(!zoom)}
          onMouseMove={mover}
          style={{ "--ox": origem.x, "--oy": origem.y } as CSSProperties}
        >
          {img === 3 && !p.imagens[3] ? (
            <div className="ph" style={{ "--a": "#3B3936", "--z": "#1E1D1B" } as CSSProperties}>
              <span style={{ color: "#F7F5F1" }}>Vídeo do produto (placeholder)</span>
            </div>
          ) : (
            <Ph p={p} i={img} />
          )}
        </div>
      </div>
      <div className="info">
        <small style={{ letterSpacing: ".14em" }}>{p.subcategoria.toUpperCase()}</small>
        <h1>{p.nome}</h1>
        <div className="pr">
          {p.precoDe ? <><s style={{ color: "var(--mut)", fontSize: 16 }}>{brl(p.precoDe)}</s> </> : null}
          {brl(p.preco)}
        </div>
        <small style={{ color: "var(--mut)" }}>{brl(precoPix(CFG, p.preco))} no Pix (5% de desconto) · {parcelado(CFG, p.preco)}</small>
        <p className="lbl" style={{ marginTop: 24 }}>COR: {CL[cor].nome.toUpperCase()}</p>
        <div className="opt">
          {cs.map((c) => (
            <button
              key={c}
              className="cs"
              aria-pressed={cor === c}
              aria-label={CL[c].nome}
              style={{ background: CL[c].hex }}
              onClick={() => { setCor(c); setTam(tamanhoUnico(p, c)); }}
            ></button>
          ))}
        </div>
        <p className="lbl">
          TAMANHO{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); setGuia(true); }} style={{ textDecoration: "underline", marginLeft: 12, letterSpacing: 0 }}>
            Guia de tamanhos
          </a>
        </p>
        <div className="opt">
          {tams.map((t) => (
            <button
              key={t}
              aria-pressed={tam === t}
              disabled={!p.variantes.some((v) => v.cor === cor && v.tamanho === t)}
              onClick={() => setTam(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="er">{erro}</div>
        <p className="lbl">QUANTIDADE</p>
        <div className="qty" style={{ margin: "8px 0 20px" }}>
          <button onClick={() => setQ(Math.max(1, q - 1))} aria-label="Diminuir">−</button>
          <span>{q}</span>
          <button onClick={() => setQ(q + 1)} aria-label="Aumentar">+</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={adicionar}>ADICIONAR À SACOLA</button>
          <FavButton id={p.id} style={{ position: "static", border: "1px solid var(--ln)", width: 52 }} />
        </div>
        <div style={{ marginTop: 32 }}>
          {acordeao.map(([t, c]) => (
            <details key={t}><summary>{t}</summary><p>{c}</p></details>
          ))}
        </div>
      </div>
    </div>
  );
}
