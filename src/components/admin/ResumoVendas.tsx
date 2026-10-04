"use client";

import { useMemo, useState } from "react";
import { CFG } from "@/lib/config";
import { brl, nomesPagamento } from "@/lib/payment/pricing";
import type { PedidoSalvo } from "@/lib/pedidos/tipos";

const PAGAMENTO = nomesPagamento(CFG);
// Contam como venda: pedidos pagos (e os que já seguiram depois de pagos).
const VENDIDO = new Set(["pago", "separacao", "enviado", "entregue"]);
const mesDe = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Belem" }).slice(0, 7);
const nomeMes = (m: string) => {
  const [a, n] = m.split("-").map(Number);
  const t = new Date(Date.UTC(a, n - 1, 15)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const anterior = (m: string) => {
  const [a, n] = m.split("-").map(Number);
  return n === 1 ? `${a - 1}-12` : `${a}-${String(n - 1).padStart(2, "0")}`;
};

function resumo(pedidos: PedidoSalvo[], mes: string) {
  const doMes = pedidos.filter((p) => mesDe(p.criadoEm) === mes);
  const vendidos = doMes.filter((p) => VENDIDO.has(p.situacao));
  const total = vendidos.reduce((a, p) => a + p.pedido.total, 0);
  const frete = vendidos.reduce((a, p) => a + (p.pedido.frete?.valor ?? 0), 0);
  const pecas = vendidos.reduce((a, p) => a + p.pedido.itens.reduce((b, i) => b + i.q, 0), 0);
  const aguardando = doMes.filter((p) => p.situacao === "aguardando");
  const porPagamento = new Map<string, { n: number; v: number }>();
  const porPeca = new Map<string, { nome: string; q: number; v: number }>();
  for (const p of vendidos) {
    const f = porPagamento.get(p.pedido.pagamento) ?? { n: 0, v: 0 };
    porPagamento.set(p.pedido.pagamento, { n: f.n + 1, v: f.v + p.pedido.total });
    for (const i of p.pedido.itens) {
      const x = porPeca.get(i.slug) ?? { nome: i.nome, q: 0, v: 0 };
      porPeca.set(i.slug, { nome: i.nome, q: x.q + i.q, v: x.v + i.precoFinal * i.q });
    }
  }
  return {
    n: vendidos.length,
    total,
    frete,
    pecas,
    ticket: vendidos.length ? total / vendidos.length : 0,
    aguardando: { n: aguardando.length, v: aguardando.reduce((a, p) => a + p.pedido.total, 0) },
    cancelados: doMes.filter((p) => p.situacao === "cancelado").length,
    porPagamento: [...porPagamento.entries()].sort((a, b) => b[1].v - a[1].v),
    maisVendidas: [...porPeca.values()].sort((a, b) => b.q - a.q || b.v - a.v).slice(0, 5),
  };
}

// Resumo de vendas do mês na aba Pedidos (calculado com os pedidos registrados no site).
export function ResumoVendas({ pedidos }: { pedidos: PedidoSalvo[] }) {
  const hoje = mesDe(new Date().toISOString());
  const meses = useMemo(() => [...new Set([hoje, ...pedidos.map((p) => mesDe(p.criadoEm))])].sort().reverse(), [pedidos, hoje]);
  const [mes, setMes] = useState(hoje);
  const r = useMemo(() => resumo(pedidos, mes), [pedidos, mes]);
  const ant = useMemo(() => resumo(pedidos, anterior(mes)), [pedidos, mes]);
  const variacao = ant.total > 0 ? Math.round(((r.total - ant.total) / ant.total) * 100) : null;

  return (
    <details className="adm-rv" open>
      <summary>
        Resumo de vendas
        <select value={mes} onChange={(e) => setMes(e.target.value)} onClick={(e) => e.stopPropagation()} aria-label="Mês">
          {meses.map((m) => <option key={m} value={m}>{nomeMes(m)}</option>)}
        </select>
      </summary>
      <div className="adm-rv-num">
        <div>
          <small>Vendido</small>
          <b>{brl(r.total)}</b>
          <em>
            {variacao === null ? "" : `${variacao >= 0 ? "+" : ""}${variacao}% vs. mês anterior`}
            {r.frete ? `${variacao === null ? "" : " · "}${brl(r.frete)} de frete` : ""}
          </em>
        </div>
        <div><small>Pedidos pagos</small><b>{r.n}</b><em>{r.pecas} {r.pecas === 1 ? "peça" : "peças"}</em></div>
        <div><small>Ticket médio</small><b>{brl(r.ticket)}</b><em>por pedido</em></div>
        <div>
          <small>Aguardando pagamento</small>
          <b>{r.aguardando.n}</b>
          <em>{r.aguardando.n ? brl(r.aguardando.v) : "nenhum"}{r.cancelados ? ` · ${r.cancelados} cancelado(s)` : ""}</em>
        </div>
      </div>
      {r.n ? (
        <div className="adm-rv-cols">
          <div>
            <h4>Por forma de pagamento</h4>
            <ul>
              {r.porPagamento.map(([k, v]) => (
                <li key={k}><span>{PAGAMENTO[k as keyof typeof PAGAMENTO] ?? k} · {v.n}</span><b>{brl(v.v)}</b></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Peças mais vendidas</h4>
            <ol>
              {r.maisVendidas.map((p) => (
                <li key={p.nome}><span>{p.nome} · {p.q}x</span><b>{brl(p.v)}</b></li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <p className="adm-dica" style={{ margin: "12px 0 0" }}>Nenhuma venda paga neste mês ainda.</p>
      )}
      <p className="adm-dica" style={{ margin: "12px 0 0" }}>
        Conta os pedidos feitos no site que estão como Pago, Em separação, Enviado ou Entregue. Vendas fora do site não entram.
        Valores cobrados da cliente (antes das taxas do Mercado Pago).
      </p>
    </details>
  );
}
