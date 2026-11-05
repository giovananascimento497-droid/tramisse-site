"use client";

import { useEffect, useMemo, useState } from "react";
import type { Catalogo } from "@/lib/types";
import { api } from "./util";

type Avaliacao = {
  id: string; produtoId: number; nota: number; texto: string; nome: string; cidade?: string; tam?: string;
  origem: "site" | "painel"; pedidoId?: string; status: "pendente" | "aprovada" | "recusada"; criadaEm: string;
};
type Filtro = "pendente" | "aprovada" | "recusada";
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Belem" });
const estrelas = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

// Aba AVALIAÇÕES do painel: as que as clientes mandam pelo link (depois da entrega) esperam aprovação;
// a loja também cadastra avaliações reais recebidas no WhatsApp/Instagram. Só as aprovadas aparecem no site.
export function AvaliacoesView({ cat, onSair }: { cat: Catalogo; onSair: () => void }) {
  const [lista, setLista] = useState<Avaliacao[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("pendente");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [nova, setNova] = useState({ produtoId: "", nota: 5, nome: "", cidade: "", tam: "", texto: "" });
  const [ocupado, setOcupado] = useState(false);
  const nomePeca = (id: number) => cat.produtos.find((p) => p.id === id)?.nome ?? `Peça ${id}`;
  const pecas = useMemo(() => [...cat.produtos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [cat]);

  const carregar = async () => {
    setErro("");
    try {
      setLista((await api("/api/admin/avaliacoes")).avaliacoes);
    } catch (e) {
      if ((e as { status?: number }).status === 401) return onSair();
      setErro((e as Error).message);
      setLista((l) => l ?? []);
    }
  };
  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mudar = async (a: Avaliacao, acao: "aprovar" | "recusar" | "apagar") => {
    if (acao === "apagar" && !confirm("Apagar esta avaliação?")) return;
    try {
      await api("/api/admin/avaliacoes", { method: "PATCH", body: JSON.stringify({ produtoId: a.produtoId, id: a.id, acao }) });
      setLista((l) => (acao === "apagar" ? (l ?? []).filter((x) => x.id !== a.id) : (l ?? []).map((x) => (x.id === a.id ? { ...x, status: acao === "aprovar" ? "aprovada" : "recusada" } : x))));
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const cadastrar = async () => {
    setErro("");
    setOk("");
    setOcupado(true);
    try {
      await api("/api/admin/avaliacoes", { method: "POST", body: JSON.stringify({ ...nova, produtoId: Number(nova.produtoId) }) });
      setNova({ produtoId: "", nota: 5, nome: "", cidade: "", tam: "", texto: "" });
      setOk("Avaliação publicada! Já aparece na página da peça.");
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  const conta = (s: Filtro) => (lista ?? []).filter((a) => a.status === s).length;
  const vis = (lista ?? []).filter((a) => a.status === filtro);

  return (
    <div className="aval">
      <p className="adm-dica">
        Quando um pedido é marcado como <b>Entregue</b>, a cliente recebe por e-mail (se o Resend estiver ligado) o link para avaliar; no pedido,
        o botão <b>PEDIR AVALIAÇÃO</b> manda o mesmo link pelo WhatsApp. O que ela escreve fica aqui esperando a sua aprovação. Só as aprovadas aparecem no site.
      </p>
      {erro ? <p className="er">{erro}</p> : null}
      <p className="adm-resumo">
        <button className={filtro === "pendente" ? "on" : ""} onClick={() => setFiltro("pendente")}><b>{conta("pendente")}</b> para aprovar</button>
        <button className={filtro === "aprovada" ? "on" : ""} onClick={() => setFiltro("aprovada")}><b>{conta("aprovada")}</b> no site</button>
        <button className={filtro === "recusada" ? "on" : ""} onClick={() => setFiltro("recusada")}><b>{conta("recusada")}</b> recusadas</button>
        <button onClick={carregar} aria-label="Atualizar">↻</button>
      </p>
      {!lista ? <p>Carregando…</p> : !vis.length ? <p className="adm-dica">Nada por aqui.</p> : null}
      <ul className="adm-ul">
        {vis.map((a) => (
          <li key={a.id} className="adm-ln aval-ln">
            <span className="adm-nm">
              <b><span className="aval-st">{estrelas(a.nota)}</span> {nomePeca(a.produtoId)}</b>
              {a.texto ? <span className="aval-tx">“{a.texto}”</span> : null}
              <small>
                {a.nome}{a.cidade ? `, ${a.cidade}` : ""}{a.tam ? ` · tam. ${a.tam}` : ""} · {data(a.criadaEm)} ·{" "}
                {a.origem === "site" ? `compra verificada (pedido ${a.pedidoId})` : "cadastrada no painel"}
              </small>
            </span>
            <span className="adm-ord">
              {a.status !== "aprovada" ? <button className="btn" style={{ padding: "8px 12px", fontSize: 11 }} onClick={() => mudar(a, "aprovar")}>APROVAR</button> : null}
              {a.status !== "recusada" ? <button className="btn o" style={{ padding: "8px 12px", fontSize: 11 }} onClick={() => mudar(a, "recusar")}>{a.status === "aprovada" ? "TIRAR DO SITE" : "RECUSAR"}</button> : null}
              <button onClick={() => mudar(a, "apagar")} aria-label="Apagar">×</button>
            </span>
          </li>
        ))}
      </ul>

      <h3 style={{ marginTop: 32 }}>Cadastrar avaliação recebida</h3>
      <p className="adm-dica">Só avaliações reais, com a autorização da cliente (ex.: o que ela mandou no WhatsApp ou no Instagram). Use o primeiro nome e a inicial do sobrenome.</p>
      <div className="fg aval-nova">
        <label className="s">
          Peça
          <select value={nova.produtoId} onChange={(e) => setNova({ ...nova, produtoId: e.target.value })}>
            <option value="">Escolha a peça…</option>
            {pecas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <label>
          Nota
          <select value={nova.nota} onChange={(e) => setNova({ ...nova, nota: Number(e.target.value) })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{estrelas(n)} ({n})</option>)}
          </select>
        </label>
        <label>Nome (ex.: Ana S.)<input value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} /></label>
        <label>Cidade (opcional)<input value={nova.cidade} onChange={(e) => setNova({ ...nova, cidade: e.target.value })} /></label>
        <label>Tamanho que comprou (opcional)<input value={nova.tam} onChange={(e) => setNova({ ...nova, tam: e.target.value })} /></label>
        <label className="s">O que ela disse<textarea rows={3} value={nova.texto} onChange={(e) => setNova({ ...nova, texto: e.target.value })} /></label>
        <p className="s" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn" onClick={cadastrar} disabled={ocupado}>{ocupado ? "PUBLICANDO…" : "PUBLICAR AVALIAÇÃO"}</button>
          {ok ? <span style={{ color: "var(--car)" }}>{ok}</span> : null}
        </p>
      </div>
    </div>
  );
}
