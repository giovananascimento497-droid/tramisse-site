"use client";

import { porId } from "@/lib/catalog";
import { bairrosBelem, belemAtivo, faixaBelem, freteBelem } from "@/lib/frete/belem";
import { useState } from "react";
import { CFG } from "@/lib/config";
import { cepValido, limparCep, textoPrazo } from "@/lib/frete/regras";
import { brl } from "@/lib/payment/pricing";
import type { OpcaoFrete } from "@/lib/types";

const GRATIS_ACIMA = CFG.entrega.correios.freteGratisAcima;
const BELEM = belemAtivo(CFG);
const BAIRROS = bairrosBelem(CFG);
// CEP de Belém (66000-000 a 66999-999): mostra também a entrega por bairro aos sábados.
const cepBelem = (cep: string) => cepValido(cep) && limparCep(cep).startsWith("66");

// "Calcular frete" da página do produto: cota PAC e SEDEX (Melhor Envio) para a peça e a quantidade escolhidas.
export function CalcularFrete({ id, q }: { id: number; q: number }) {
  const [cep, setCep] = useState("");
  const [opcoes, setOpcoes] = useState<OpcaoFrete[] | null>(null);
  const [msg, setMsg] = useState("");
  const [cotando, setCotando] = useState(false);
  const [verBelem, setVerBelem] = useState(false);
  const [bairro, setBairro] = useState("");
  const pecas = (porId(id)?.preco ?? 0) * q;
  const fb = bairro ? freteBelem(CFG, bairro, pecas) : null;

  const cotar = async () => {
    setOpcoes(null);
    if (!cepValido(cep)) return setMsg("Digite um CEP válido.");
    if (cepBelem(cep)) setVerBelem(true);
    setMsg("");
    setCotando(true);
    try {
      const r = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, itens: [{ id, q }] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      setOpcoes(d.opcoes);
    } catch (e) {
      setMsg((e instanceof Error && e.message) || "Não foi possível calcular o frete agora.");
    } finally {
      setCotando(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <p className="lbl">CALCULAR FRETE</p>
      <div className="cp" style={{ marginTop: 8 }}>
        <input
          inputMode="numeric"
          placeholder="Seu CEP"
          aria-label="CEP"
          value={cep}
          onChange={(e) => { setCep(e.target.value); setOpcoes(null); }}
          onKeyDown={(e) => e.key === "Enter" && cotar()}
        />
        <button className="btn o" onClick={cotar} disabled={cotando} style={{ padding: "0 20px" }}>{cotando ? "…" : "OK"}</button>
      </div>
      {msg ? <div className="er">{msg}</div> : null}
      {opcoes?.map((o) => (
        <div className="tt" key={o.servico} style={{ fontSize: 14 }}>
          <span>Correios {o.nome} · {textoPrazo(o.prazo)}</span>
          <span>{o.gratis ? "Grátis" : brl(o.valor)}</span>
        </div>
      ))}
      {BELEM && verBelem ? (
        <div className="cf-bel">
          <label>
            <span>Entrega em Belém (sábado) · escolha o bairro</span>
            <select value={bairro} onChange={(e) => setBairro(e.target.value)} aria-label="Bairro em Belém">
              <option value="">Seu bairro…</option>
              {BAIRROS.map((b) => <option key={b.bairro} value={b.bairro}>{b.bairro}</option>)}
            </select>
          </label>
          {fb ? (
            <div className="tt" style={{ fontSize: 14 }}>
              <span>Entrega em Belém · no sábado</span>
              <span>{fb.gratis ? "Grátis" : brl(fb.valor)}</span>
            </div>
          ) : null}
          <small style={{ color: "var(--mut)" }}>{CFG.entrega.belem!.aviso} Bairro fora da lista? Fale com a gente no WhatsApp.</small>
        </div>
      ) : null}
      {GRATIS_ACIMA ? <small style={{ color: "var(--mut)", display: "block", marginTop: 8 }}>Frete grátis em compras acima de {brl(GRATIS_ACIMA)}. {faixaBelem(CFG) ? <>Em Belém, entrega aos sábados por bairro ({faixaBelem(CFG)}){verBelem ? "" : <> · <a href="#" onClick={(e) => { e.preventDefault(); setVerBelem(true); }} style={{ textDecoration: "underline" }}>ver o valor do meu bairro</a></>}, ou retirada.</> : "Em Belém, também há entrega por aplicativo ou retirada."}</small> : null}
    </div>
  );
}
