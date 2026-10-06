"use client";

import { useEffect, useState } from "react";
import type { Catalogo } from "@/lib/types";
import { api } from "./util";

type Pessoa = { nome: string; tel: string; tam?: string; em: string; avisada?: string };
type Lista = { produtoId: number; pessoas: Pessoa[] };

const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Belem" });
const telBonito = (t: string) => t.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");

// Aba "Avise-me" do painel: quem pediu para ser avisada de cada peça (Coming Soon ou esgotada).
// AVISAR abre o WhatsApp da cliente com a mensagem pronta e marca como avisada.
export function EsperaView({ cat, onSair }: { cat: Catalogo; onSair: () => void }) {
  const [listas, setListas] = useState<Lista[] | null>(null);
  const [erro, setErro] = useState("");
  const site = typeof location !== "undefined" ? location.origin : "https://tramisse.com.br";

  const carregar = async () => {
    setErro("");
    try {
      const d = await api("/api/admin/espera");
      setListas(d.listas);
    } catch (e) {
      if ((e as { status?: number }).status === 401) return onSair();
      setErro((e as Error).message);
      setListas((l) => l ?? []);
    }
  };
  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mudar = async (produtoId: number, tel: string, acao: "avisada" | "remover") => {
    if (acao === "remover" && !confirm("Tirar esta pessoa da lista?")) return;
    try {
      const d = await api("/api/admin/espera", { method: "PATCH", body: JSON.stringify({ produtoId, tel, acao }) });
      setListas((ls) => (ls ?? []).map((l) => (l.produtoId === produtoId ? d.lista ?? { produtoId, pessoas: [] } : l)).filter((l) => l.pessoas.length));
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  if (!listas) return erro ? <p className="er">{erro}</p> : <p>Carregando…</p>;
  const ordenadas = [...listas].sort((a, b) => b.pessoas.filter((p) => !p.avisada).length - a.pessoas.filter((p) => !p.avisada).length);

  return (
    <div className="adm-esp">
      {erro ? <p className="er" style={{ margin: "8px 0" }}>{erro}</p> : null}
      <p className="adm-dica">
        Quem tocou em &quot;Avise-me&quot; nas peças Coming Soon ou esgotadas. Quando a peça chegar (ou voltar), toque em AVISAR: abre o
        WhatsApp da cliente com a mensagem pronta, com o link da peça. Dica: avise a lista antes de anunciar no Instagram (acesso antecipado).
      </p>
      <p><button className="btn o" onClick={carregar}>↻ ATUALIZAR</button></p>
      {!ordenadas.length ? <p style={{ color: "var(--mut)" }}>Ninguém na lista de espera ainda.</p> : null}
      {ordenadas.map((l) => {
        const p = cat.produtos.find((x) => x.id === l.produtoId);
        const faltam = l.pessoas.filter((x) => !x.avisada).length;
        return (
          <section key={l.produtoId} className="adm-esp-peca">
            <h3>
              {p?.nome ?? `Peça ${l.produtoId}`} · {l.pessoas.length} {l.pessoas.length === 1 ? "pessoa" : "pessoas"}
              {faltam ? ` (${faltam} sem aviso)` : " (todas avisadas)"}
              <small>{p?.emBreve ? " · Coming Soon" : p && p.variantes.every((v) => v.estoque === 0) ? " · esgotada" : " · já à venda"}</small>
            </h3>
            <ul className="adm-ul">
              {l.pessoas.map((x) => {
                const msg = `Oi, ${x.nome.split(" ")[0]}! A ${p?.nome ?? "peça"} que você pediu para ser avisada ${p?.emBreve ? "está chegando" : "está disponível"} na Tramisse 🤍 Como você está na lista, tem acesso antecipado: ${site}/produto/${p?.slug ?? ""}`;
                return (
                  <li key={x.tel} className="adm-ln">
                    <span className="adm-nm">
                      <b>{x.nome}{x.tam ? ` · tam. ${x.tam}` : ""}</b>
                      <small>{telBonito(x.tel)} · pediu em {data(x.em)}{x.avisada ? ` · avisada em ${data(x.avisada)}` : ""}</small>
                    </span>
                    <span className="adm-ord">
                      <a className={`btn${x.avisada ? " o" : ""}`} style={{ padding: "8px 12px" }} href={`https://wa.me/${x.tel}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener" onClick={() => !x.avisada && mudar(l.produtoId, x.tel, "avisada")}>
                        {x.avisada ? "DE NOVO" : "AVISAR"}
                      </a>
                      <button onClick={() => mudar(l.produtoId, x.tel, "remover")} aria-label="Tirar da lista">×</button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
