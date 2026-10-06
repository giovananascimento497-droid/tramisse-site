"use client";

import { useState } from "react";

// "Avise-me" das peças Coming Soon e esgotadas: a cliente deixa nome e WhatsApp e entra na
// lista de espera (o painel mostra quem quer cada peça). Sempre dá para chamar no WhatsApp direto.
export function AviseMeForm({ produtoId, nomePeca, tam, chegou, onWhatsApp }: {
  produtoId: number; nomePeca: string; tam?: string; chegou: boolean; onWhatsApp: () => void;
}) {
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const r = await fetch("/api/espera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produtoId, nome, tel, tam, aceite }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro || "Não foi possível entrar na lista agora.");
      setOk(true);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (ok)
    return (
      <p className="av-ok">
        Pronto{nome ? `, ${nome.split(" ")[0]}` : ""}! Você está na lista da <b>{nomePeca}</b> e vai saber pelo WhatsApp antes de todo mundo
        {chegou ? " quando ela voltar." : " quando ela chegar."}
      </p>
    );

  return (
    <form className="fg av" onSubmit={enviar} noValidate>
      <p className="s av-t">
        {chegou ? "Quer ser avisada se ela voltar?" : "Quer ser avisada quando ela chegar?"} Quem está na lista fica sabendo primeiro, com acesso antecipado.
      </p>
      <label>Seu nome<input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" /></label>
      <label>WhatsApp<input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" placeholder="(91) 90000-0000" autoComplete="tel" /></label>
      <label className="s av-ck">
        <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
        <span>Aceito receber o aviso desta peça pelo WhatsApp.</span>
      </label>
      <div className="s er">{erro}</div>
      <button className="btn s" disabled={enviando}>{enviando ? "ENVIANDO…" : "QUERO SER AVISADA"}</button>
      <p className="s av-wa">
        Prefere falar agora?{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); onWhatsApp(); }}>Chame a gente no WhatsApp</a>.
      </p>
    </form>
  );
}
