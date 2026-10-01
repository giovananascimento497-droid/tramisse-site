"use client";

import { useState } from "react";
import { CFG } from "@/lib/config";
import { cepValido, textoPrazo } from "@/lib/frete/regras";
import { brl } from "@/lib/payment/pricing";
import type { OpcaoFrete } from "@/lib/types";

const GRATIS_ACIMA = CFG.entrega.correios.freteGratisAcima;

// "Calcular frete" da página do produto: cota PAC e SEDEX (Melhor Envio) para a peça e a quantidade escolhidas.
export function CalcularFrete({ id, q }: { id: number; q: number }) {
  const [cep, setCep] = useState("");
  const [opcoes, setOpcoes] = useState<OpcaoFrete[] | null>(null);
  const [msg, setMsg] = useState("");
  const [cotando, setCotando] = useState(false);

  const cotar = async () => {
    setOpcoes(null);
    if (!cepValido(cep)) return setMsg("Digite um CEP válido.");
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
      {GRATIS_ACIMA ? <small style={{ color: "var(--mut)" }}>Frete grátis em compras acima de {brl(GRATIS_ACIMA)}. Em Belém, também há entrega por aplicativo ou retirada.</small> : null}
    </div>
  );
}
