"use client";

import { registrar } from "@/lib/estatisticas";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { CL, cores, esgotado, estoqueDe, porId, tamanhoUnico, tamanhos, ultimaUnidade } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import { brl, parcelado, precoPix } from "@/lib/payment/pricing";
import { useLoja } from "@/store/Store";
import { AviseMeForm } from "../AviseMe";
import { AvaliacoesPeca, NotaPeca } from "../Avaliacoes";
import { faixaBelem, gratisBelem } from "@/lib/frete/belem";
import { CalcularFrete } from "../CalcularFrete";
import { FavButton } from "../FavButton";
import { Ph } from "../Ph";

export function ProductView({ id }: { id: number }) {
  const p = porId(id)!;
  const cs = cores(p);
  const tams = tamanhos(p);
  const semEstoque = esgotado(p);
  const { bag, setBag, abrir, setGuia } = useLoja();
  useEffect(() => { registrar("peca", { p: id }); }, [id]);
  const [cor, setCor] = useState(cs[0]);
  const [tam, setTam] = useState<string | null>(tamanhoUnico(p, cs[0]));
  const [q, setQ] = useState(1);
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origem, setOrigem] = useState({ x: "50%", y: "50%" });
  const [erro, setErro] = useState("");
  // Celular: barra fixa com o botão de compra quando o botão principal sai da tela.
  const refComprar = useRef<HTMLDivElement>(null);
  const [fixa, setFixa] = useState(false);
  useEffect(() => {
    const ver = () => { const el = refComprar.current; if (el) setFixa(el.getBoundingClientRect().bottom < 0); };
    addEventListener("scroll", ver, { passive: true });
    return () => removeEventListener("scroll", ver);
  }, []);

  const mover = (e: MouseEvent<HTMLDivElement>) => {
    if (!zoom) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigem({ x: ((e.clientX - r.left) / r.width) * 100 + "%", y: ((e.clientY - r.top) / r.height) * 100 + "%" });
  };
  // Estoque real: quanto ainda cabe na sacola desta cor/tamanho.
  const naSacola = (t: string | null) => bag.filter((l) => l.id === p.id && l.cor === cor && l.tam === t).reduce((a, l) => a + l.q, 0);
  const disponivel = tam ? estoqueDe(p, cor, tam) - naSacola(tam) : 0;
  const adicionar = () => {
    if (!tam) return setErro("Escolha um tamanho para continuar.");
    if (q > disponivel)
      return setErro(disponivel > 0 ? `Só temos ${disponivel} ${disponivel === 1 ? "peça" : "peças"} nesse tamanho.` : "Essa peça já está toda na sua sacola.");
    setErro("");
    setBag((b) => {
      const k = b.find((l) => l.id === p.id && l.tam === tam && l.cor === cor);
      return k ? b.map((l) => (l === k ? { ...l, q: l.q + q } : l)) : [...b, { id: p.id, tam, cor, q }];
    });
    registrar("sacola", { p: p.id, q });
    abrir("g");
  };
  const [avise, setAvise] = useState(false);
  // Coming soon / esgotada: lista de espera (formulário) ou, se preferir, WhatsApp direto.
  const aviseMe = () => {
    const at = CFG.atendentes[0];
    const texto = `Olá! Quero ser avisada quando a peça ${p.nome}${tam ? ` (${CL[cor].nome}, tam. ${tam})` : ""} ${semEstoque ? "voltar ao estoque" : "chegar à Tramisse"}.`;
    window.open(`https://wa.me/${at.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank");
  };
  const acordeao: [string, string][] = [
    ["DESCRIÇÃO", p.descricao || "Descrição em breve. Fale com o nosso atendimento para mais detalhes da peça."],
    ["COMPOSIÇÃO", p.tecido ? `Tecido: ${p.tecido}.` : "Sob consulta no atendimento."],
    ...(p.medidas?.trim() ? [["MEDIDAS DA PEÇA", p.medidas.trim()] as [string, string]] : []),
    ["DETALHES", `Tamanhos da peça: ${tams.join(", ")}.${p.modelo?.trim() ? ` ${p.modelo.trim().replace(/\.?$/, ".")}` : ""}`],
    ["CUIDADOS", "Siga as instruções da etiqueta da peça."],
    ["ENTREGA", `Envio para todo o Brasil pelos Correios (PAC ou SEDEX), com o frete calculado pelo CEP${CFG.entrega.correios.freteGratisAcima ? ` e grátis acima de ${brl(CFG.entrega.correios.freteGratisAcima)}` : ""}. ${faixaBelem(CFG) ? `Em Belém, entrega aos sábados por bairro (${faixaBelem(CFG)}${gratisBelem(CFG) ? `; grátis acima de ${brl(gratisBelem(CFG))}` : ""}) ou retirada.` : "Em Belém, também há entrega por aplicativo (valor informado na compra) ou retirada."}`],
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
        <NotaPeca produtoId={p.id} />
        {!semEstoque && ultimaUnidade(p) ? <div><span className="pdp-ult">ÚLTIMA UNIDADE</span></div> : null}
        <div className="pr">
          {p.precoDe ? <><s style={{ color: "var(--mut)", fontSize: 16 }}>{brl(p.precoDe)}</s> </> : null}
          {brl(p.preco)}
        </div>
        <small style={{ color: "var(--mut)" }}>{p.precoDe ? "Preço promocional, sem desconto no Pix" : `${brl(precoPix(CFG, p.preco))} no Pix (${Math.round(CFG.pagamento.descontoPix * 100)}% de desconto)`}{parcelado(CFG, p.preco) ? ` · ${parcelado(CFG, p.preco)}` : " · à vista no cartão"}</small>
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
        {p.modelo?.trim() ? <p className="pdp-mod">{p.modelo.trim()}</p> : null}
        <div className="opt">
          {tams.map((t) => (
            <button
              key={t}
              aria-pressed={tam === t}
              disabled={!p.emBreve && !semEstoque && estoqueDe(p, cor, t) < 1}
              onClick={() => { setTam(t); setQ(1); setErro(""); }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="er">
          {erro || (!p.emBreve && !semEstoque && tam && estoqueDe(p, cor, tam) === 1 ? <span style={{ color: "var(--mut)" }}>Última peça nesse tamanho.</span> : null)}
        </div>
        {semEstoque ? (
          <p style={{ color: "var(--mut)", fontSize: 14, margin: "8px 0 20px" }}>
            Esta peça está esgotada. Deixe o seu WhatsApp e avisamos se ela voltar.
          </p>
        ) : p.emBreve ? (
          <p style={{ color: "var(--mut)", fontSize: 14, margin: "8px 0 20px" }}>
            Esta peça ainda não chegou. Deixe o seu WhatsApp e avisamos assim que ela estiver disponível.
          </p>
        ) : (
          <>
            <p className="lbl">QUANTIDADE</p>
            <div className="qty" style={{ margin: "8px 0 20px" }}>
              <button onClick={() => setQ(Math.max(1, q - 1))} aria-label="Diminuir">−</button>
              <span>{q}</span>
              <button onClick={() => setQ(Math.min(q + 1, Math.max(1, disponivel)))} aria-label="Aumentar">+</button>
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8 }} ref={refComprar}>
          {semEstoque ? (
            <button className="btn" style={{ flex: 1 }} onClick={() => setAvise((x) => !x)}>ESGOTADO · AVISE-ME</button>
          ) : p.emBreve ? (
            <button className="btn" style={{ flex: 1 }} onClick={() => setAvise((x) => !x)}>AVISE-ME QUANDO CHEGAR</button>
          ) : (
            <button className="btn" style={{ flex: 1 }} onClick={adicionar}>ADICIONAR À SACOLA</button>
          )}
          <FavButton id={p.id} style={{ position: "static", border: "1px solid var(--ln)", width: 52 }} />
        </div>
        {(p.emBreve || semEstoque) && avise ? (
          <AviseMeForm produtoId={p.id} nomePeca={p.nome} tam={tam ?? undefined} chegou={!p.emBreve} onWhatsApp={aviseMe} />
        ) : null}
        {p.emBreve || semEstoque ? null : (
          <ul className="pdp-vt" aria-label="Vantagens">
            {!p.precoDe ? <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 9-9 9-9-9zM8.5 12h7M12 8.5v7" /></svg>{Math.round(CFG.pagamento.descontoPix * 100)}% off no Pix, confirmado na hora</li> : null}
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM3 10h18M7 15h4" /></svg>Até {CFG.pagamento.maxParcelas}x sem juros no cartão</li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9a8 8 0 0114-3l2 2M20 15a8 8 0 01-14 3l-2-2M18 3v5h-5M6 21v-5h5" /></svg>Trocas em até {CFG.trocas.prazoDias} dias</li>
            <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>{gratisBelem(CFG) ? `Belém: frete grátis acima de ${brl(gratisBelem(CFG))}` : "Envio para todo o Brasil"}</li>
          </ul>
        )}
        {p.emBreve || semEstoque ? null : <CalcularFrete id={p.id} q={q} />}
        <div style={{ marginTop: 32 }}>
          {acordeao.map(([t, c]) => (
            <details key={t}><summary>{t}</summary><p style={{ whiteSpace: "pre-line" }}>{c}</p></details>
          ))}
        </div>
        <AvaliacoesPeca produtoId={p.id} />
      </div>
      {p.emBreve || semEstoque ? null : (
        <div className={`pdp-fixa${fixa ? " on" : ""}`} aria-hidden={!fixa}>
          <span><b>{p.nome}</b>{brl(p.preco)}{tam ? ` · tam. ${tam}` : ""}</span>
          <button
            className="btn"
            tabIndex={fixa ? 0 : -1}
            onClick={() => { if (!tam) { setErro("Escolha um tamanho para continuar."); refComprar.current?.scrollIntoView({ behavior: "smooth", block: "center" }); } else adicionar(); }}
          >
            {tam ? "ADICIONAR" : "ESCOLHER TAMANHO"}
          </button>
        </div>
      )}
    </div>
  );
}
