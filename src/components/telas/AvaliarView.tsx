"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Estrelas } from "../Estrelas";

type Item = { produtoId: number; nome: string; cor: string; tam: string; imagem: string; slug: string };

// Página do link "avalie suas peças" (enviado depois da entrega). As avaliações vão para aprovação no painel.
export function AvaliarView() {
  const sp = useSearchParams();
  const p = sp.get("p") || "";
  const k = sp.get("k") || "";
  const [itens, setItens] = useState<Item[] | null>(null);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [notas, setNotas] = useState<Record<number, { nota: number; texto: string }>>({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(false);

  useEffect(() => {
    fetch(`/api/avaliacoes/pedido?p=${encodeURIComponent(p)}&k=${encodeURIComponent(k)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { setErro(d.erro || "Link inválido."); setItens([]); return; }
        setItens(d.itens);
        setNome(d.nome || "");
      })
      .catch(() => { setErro("Não foi possível abrir agora. Tente de novo."); setItens([]); });
  }, [p, k]);

  const enviar = async () => {
    setErro("");
    setEnviando(true);
    try {
      const r = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p, k, nome, cidade, itens: Object.entries(notas).map(([id, v]) => ({ produtoId: Number(id), ...v })) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Não foi possível enviar.");
      setFeito(true);
      scrollTo(0, 0);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (feito)
    return (
      <div className="pg">
        <h1>Obrigada!</h1>
        <p>Recebemos a sua avaliação. Ela aparece no site assim que a nossa equipe conferir. A sua opinião ajuda outras clientes a escolher.</p>
        <p><Link className="btn" href="/">VOLTAR À LOJA</Link></p>
      </div>
    );
  if (!itens) return <div className="pg"><h1>Carregando…</h1></div>;
  if (!itens.length)
    return (
      <div className="pg">
        <h1>Avalie suas peças</h1>
        <p>{erro}</p>
        <p><Link className="btn" href="/">VOLTAR À LOJA</Link></p>
      </div>
    );

  return (
    <div className="pg avr">
      <h1>Avalie suas peças</h1>
      <p>Conta pra gente o que achou: o caimento, o tecido, o tamanho. Leva menos de um minuto.</p>
      {itens.map((i) => {
        const v = notas[i.produtoId] ?? { nota: 0, texto: "" };
        return (
          <section key={i.produtoId} className="avr-it">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {i.imagem ? <img src={i.imagem} alt="" /> : <span className="avr-sf" />}
            <div>
              <b>{i.nome}</b>
              <small>{i.cor} · tam. {i.tam}</small>
              <Estrelas nota={v.nota} tam={28} onNota={(n) => setNotas((x) => ({ ...x, [i.produtoId]: { ...v, nota: n } }))} />
              <textarea
                rows={3}
                placeholder="O que você achou? (opcional)"
                value={v.texto}
                maxLength={1000}
                onChange={(e) => setNotas((x) => ({ ...x, [i.produtoId]: { ...v, texto: e.target.value } }))}
              />
            </div>
          </section>
        );
      })}
      <div className="fg" style={{ marginTop: 16 }}>
        <label>Como seu nome aparece<input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} /></label>
        <label>Cidade (opcional)<input value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={40} /></label>
      </div>
      {erro ? <p className="er">{erro}</p> : null}
      <p><button className="btn" onClick={enviar} disabled={enviando || !Object.values(notas).some((x) => x.nota)}>{enviando ? "ENVIANDO…" : "ENVIAR AVALIAÇÃO"}</button></p>
    </div>
  );
}
