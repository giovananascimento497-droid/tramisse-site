"use client";

import { useEffect, useMemo, useState } from "react";
import type { Catalogo } from "@/lib/types";
import { api } from "./util";

type Dia = {
  dia: string; visitas: number; sacola: number; checkouts: number; pedidos: number;
  origens: Record<string, number>; dispositivos: Record<string, number>;
  pecasVistas: Record<string, number>; pecasSacola: Record<string, number>;
};

const PERIODOS: [number, string][] = [[1, "Hoje"], [7, "7 dias"], [30, "30 dias"], [90, "90 dias"]];
const n = (x: number) => x.toLocaleString("pt-BR");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%`.replace(".", ",") : "—");
const diaCurto = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const somaMapa = (dias: Dia[], k: "origens" | "dispositivos" | "pecasVistas" | "pecasSacola") => {
  const o: Record<string, number> = {};
  for (const d of dias) for (const [c, v] of Object.entries(d[k])) o[c] = (o[c] ?? 0) + v;
  return Object.entries(o).sort((a, b) => b[1] - a[1]);
};

// Lista com barra proporcional (uma cor só: a da marca).
function Barras({ itens, total }: { itens: [string, number][]; total?: number }) {
  const max = Math.max(1, ...itens.map((i) => i[1]));
  if (!itens.length) return <p className="adm-dica">Ainda sem dados.</p>;
  return (
    <ul className="est-barras">
      {itens.map(([nome, v]) => (
        <li key={nome}>
          <span className="est-nome">{nome}</span>
          <span className="est-trilho"><span style={{ width: `${(v / max) * 100}%` }} /></span>
          <b>{n(v)}{total ? <small> · {pct(v, total)}</small> : null}</b>
        </li>
      ))}
    </ul>
  );
}

// Aba ESTATÍSTICAS do painel: visitas, de onde vieram, peças vistas, sacola, checkout e pedidos.
export function EstatisticasView({ cat, onSair }: { cat: Catalogo; onSair: () => void }) {
  const [periodo, setPeriodo] = useState(30);
  const [dias, setDias] = useState<Dia[] | null>(null);
  const [erro, setErro] = useState("");
  const [foco, setFoco] = useState<number | null>(null);

  const carregar = async (p = periodo) => {
    setErro("");
    setDias(null);
    try {
      const d = await api(`/api/admin/estatisticas?dias=${p}`);
      setDias(d.dias);
    } catch (e) {
      if ((e as { status?: number }).status === 401) return onSair();
      setErro((e as Error).message);
      setDias([]);
    }
  };
  useEffect(() => { carregar(periodo); }, [periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  const r = useMemo(() => {
    const l = dias ?? [];
    const tot = (k: "visitas" | "sacola" | "checkouts" | "pedidos") => l.reduce((a, d) => a + d[k], 0);
    const nome = (id: string) => cat.produtos.find((p) => String(p.id) === id)?.nome ?? `Peça ${id}`;
    return {
      visitas: tot("visitas"), sacola: tot("sacola"), checkouts: tot("checkouts"), pedidos: tot("pedidos"),
      origens: somaMapa(l, "origens"),
      dispositivos: somaMapa(l, "dispositivos").map(([k, v]) => [k === "celular" ? "Celular" : "Computador", v] as [string, number]),
      vistas: somaMapa(l, "pecasVistas").slice(0, 10).map(([k, v]) => [nome(k), v] as [string, number]),
      naSacola: somaMapa(l, "pecasSacola").slice(0, 10).map(([k, v]) => [nome(k), v] as [string, number]),
    };
  }, [dias, cat]);

  const maxDia = Math.max(1, ...(dias ?? []).map((d) => d.visitas));

  return (
    <div className="est">
      <div className="est-topo">
        <div className="est-per" role="group" aria-label="Período">
          {PERIODOS.map(([v, t]) => (
            <button key={v} className={periodo === v ? "on" : ""} onClick={() => setPeriodo(v)}>{t}</button>
          ))}
        </div>
        <button className="btn o" onClick={() => carregar()} aria-label="Atualizar">↻</button>
      </div>
      {erro ? <p className="er">{erro}</p> : null}
      {!dias ? <p>Carregando…</p> : (
        <>
          <div className="adm-rv-num est-kpi">
            <div><small>Visitas</small><b>{n(r.visitas)}</b><em>pessoas que abriram o site</em></div>
            <div><small>Colocaram na sacola</small><b>{n(r.sacola)}</b><em>vezes · {pct(r.sacola, r.visitas)} das visitas</em></div>
            <div><small>Começaram o checkout</small><b>{n(r.checkouts)}</b><em>{pct(r.checkouts, r.visitas)} das visitas</em></div>
            <div><small>Pedidos</small><b>{n(r.pedidos)}</b><em>{pct(r.pedidos, r.visitas)} das visitas viraram pedido</em></div>
          </div>

          <section className="est-card">
            <h4>Caminho da compra</h4>
            <Barras
              itens={[["Visitaram o site", r.visitas], ["Colocaram peça na sacola", r.sacola], ["Começaram o checkout", r.checkouts], ["Finalizaram o pedido", r.pedidos]]}
              total={r.visitas}
            />
            <p className="adm-dica" style={{ margin: "10px 0 0" }}>
              {r.checkouts > r.pedidos
                ? `${n(r.checkouts - r.pedidos)} ${r.checkouts - r.pedidos === 1 ? "pessoa começou" : "pessoas começaram"} o checkout e não finalizou. Vale conferir o frete e as formas de pagamento.`
                : "Onde a barra cai mais é onde as clientes desistem."}
            </p>
          </section>

          {periodo > 1 ? (
            <section className="est-card">
              <h4>Visitas por dia</h4>
              <div className="est-dias" onMouseLeave={() => setFoco(null)}>
                {dias.map((d, i) => (
                  <button
                    key={d.dia}
                    className={foco === i ? "on" : ""}
                    onMouseEnter={() => setFoco(i)}
                    onFocus={() => setFoco(i)}
                    onClick={() => setFoco(i)}
                    aria-label={`${diaCurto(d.dia)}: ${d.visitas} visitas`}
                  >
                    <span style={{ height: `${Math.max(d.visitas ? 3 : 0, (d.visitas / maxDia) * 100)}%` }} />
                  </button>
                ))}
              </div>
              <div className="est-eixo">
                <span>{diaCurto(dias[0].dia)}</span>
                <span className="est-foco">
                  {foco != null ? <>{diaCurto(dias[foco].dia)}: <b>{n(dias[foco].visitas)}</b> visitas · {n(dias[foco].sacola)} na sacola · {n(dias[foco].pedidos)} pedidos</> : `máximo: ${n(maxDia)} visitas num dia`}
                </span>
                <span>{diaCurto(dias[dias.length - 1].dia)}</span>
              </div>
            </section>
          ) : null}

          <div className="est-2">
            <section className="est-card"><h4>De onde vieram</h4><Barras itens={r.origens} total={r.visitas} /></section>
            <section className="est-card"><h4>Aparelho</h4><Barras itens={r.dispositivos} total={r.visitas} /></section>
            <section className="est-card"><h4>Peças mais vistas</h4><Barras itens={r.vistas} /></section>
            <section className="est-card"><h4>Mais colocadas na sacola</h4><Barras itens={r.naSacola} /></section>
          </div>

          <p className="adm-dica" style={{ marginTop: 16 }}>
            Conta só números, sem identificar ninguém (sem cookies). Uma visita = uma pessoa com o site aberto (abrir de novo outro dia conta de novo).
            Robôs do Google e prévias de link não entram. Dica: no link da bio do Instagram, use <b>tramisse.com.br/?utm_source=instagram</b> para
            as visitas de lá aparecerem certinho.
          </p>
        </>
      )}
    </div>
  );
}
