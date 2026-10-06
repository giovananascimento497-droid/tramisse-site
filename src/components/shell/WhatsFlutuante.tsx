"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { CFG } from "@/lib/config";

// Botão fixo de atendimento: abre a escolha entre as atendentes e leva ao WhatsApp
// com uma mensagem pronta (na página da peça, já com o nome dela). Fica fora do painel e do checkout.
export function WhatsFlutuante() {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const caminho = usePathname() || "";
  if (caminho.startsWith("/admin") || caminho.startsWith("/checkout")) return null;
  const abrir = () => {
    // Na página da peça, a mensagem já leva o nome dela (vem do título da página).
    const peca = caminho.startsWith("/produto/") ? document.title.split(" — ")[0] : "";
    setTexto(peca ? `Olá! Vim pelo site da Tramisse e quero saber mais sobre a peça ${peca}.` : "Olá! Vim pelo site da Tramisse.");
    setAberto((x) => !x);
  };
  return (
    <div className={`wf${aberto ? " on" : ""}`}>
      {aberto ? (
        <div className="wf-caixa" role="dialog" aria-label="Fale com a gente">
          <b>Fale com a gente</b>
          <small>Atendimento personalizado: tire dúvidas de tamanho, peça fotos ou monte o seu look.</small>
          {CFG.atendentes.map((a) => (
            <a key={a.nome} href={`https://wa.me/${a.whatsapp}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener" onClick={() => setAberto(false)}>
              {a.nome}
            </a>
          ))}
        </div>
      ) : null}
      <button className="wf-bt" onClick={abrir} aria-expanded={aberto} aria-label={aberto ? "Fechar atendimento" : "Falar no WhatsApp"}>
        {aberto ? (
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <path d="M20 11.6A8.4 8.4 0 0 1 7.6 19l-3.6 1 1-3.5A8.4 8.4 0 1 1 20 11.6Z" />
            <path d="M9 8.6c0 3.4 2.9 6.3 6.3 6.3l1.2-1.4-2-1-1 .8a4.6 4.6 0 0 1-2.3-2.3l.8-1-1-2-1.4 1.2c-.4.3-.6.8-.6 1.4Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
