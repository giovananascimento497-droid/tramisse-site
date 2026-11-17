"use client";

import { useEffect, useMemo, useState } from "react";
import { CFG } from "@/lib/config";
import { brl, parcelasPermitidas, precoVitrine, r2, taxaParcelas } from "@/lib/payment/pricing";
import type { Catalogo } from "@/lib/types";
import { api } from "./util";

type Compra = { id: string; data: string; descricao: string; valor: number };
type VendaFora = { id: string; data: string; produtoId: number; nome: string; cor: string; tam: string; q: number; valor: number; taxa: number; forma: string; estoque: boolean; obs?: string; custo?: number; aberto?: number };
type VendaSite = { id: string; data: string; pagamento: string; pecas: number; taxa: number; itens: { id: number; nome: string; q: number }[] };
type Dados = { custos: Record<string, number>; compras: Compra[]; vendas: VendaFora[]; site: VendaSite[]; hoje: string };
type Periodo = "mes" | "anterior" | "30" | "tudo";

const FORMAS: Record<string, string> = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão (maquininha)", outro: "Outro" };
const dataBr = (d: string) => d.split("-").reverse().slice(0, 2).join("/");
const pct = (v: number) => `${Math.round(v * 100)}%`;
const n = (s: string) => Number(String(s).replace(",", "."));

// Aba FINANCEIRO do painel: custo de cada peça, compras de mercadoria (investimento), vendas fora do site e o
// relatório (vendido, taxas, custo das peças vendidas, lucro, quanto do investimento já voltou, estoque parado).
// Tudo fica guardado só na Netlify (privado); nada disso vai para o site.
export function FinanceiroView({ cat, onSair }: { cat: Catalogo; onSair: () => void }) {
  const [d, setD] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [custos, setCustos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState("");
  const [nv, setNv] = useState({ produtoId: "", variante: "", q: "1", valor: "", taxa: "", forma: "pix", data: "", estoque: true, obs: "" });
  const [nc, setNc] = useState({ data: "", descricao: "", valor: "" });

  const carregar = async () => {
    setErro("");
    try {
      const x: Dados = await api("/api/admin/financeiro");
      setD(x);
      setCustos(Object.fromEntries(Object.entries(x.custos).map(([k, v]) => [k, String(v).replace(".", ",")])));
    } catch (e) {
      if ((e as { status?: number }).status === 401) return onSair();
      setErro((e as Error).message);
    }
  };
  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const acao = async (corpo: object, msg: string) => {
    setErro("");
    setOk("");
    setOcupado(msg);
    try {
      const r = await api("/api/admin/financeiro", { method: "POST", body: JSON.stringify(corpo) });
      setD((x) => x && { ...x, ...(r.custos ? { custos: r.custos } : {}), ...(r.compras ? { compras: r.compras } : {}), ...(r.vendas ? { vendas: r.vendas } : {}) });
      setOk(r.aviso ? `Salvo! ${r.aviso}` : "Salvo!");
      return true;
    } catch (e) {
      setErro((e as Error).message);
      return false;
    } finally {
      setOcupado("");
    }
  };

  const pecas = useMemo(() => [...cat.produtos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [cat]);
  const custo = (id: number) => d?.custos[String(id)] ?? 0;
  const custoV = (v: VendaFora) => v.custo ?? custo(v.produtoId);

  // Relatório do período.
  const rel = useMemo(() => {
    if (!d) return null;
    const [ano, mes] = d.hoje.split("-").map(Number);
    const ini =
      periodo === "mes" ? `${d.hoje.slice(0, 7)}-01`
      : periodo === "anterior" ? `${mes === 1 ? ano - 1 : ano}-${String(mes === 1 ? 12 : mes - 1).padStart(2, "0")}-01`
      : periodo === "30" ? new Date(Date.parse(d.hoje) - 29 * 86400000).toISOString().slice(0, 10)
      : "0000";
    const fim = periodo === "anterior" ? `${d.hoje.slice(0, 7)}-01` : "9999";
    const dentro = (x: string) => x >= ini && (periodo === "anterior" ? x < fim : true);
    const site = d.site.filter((v) => dentro(v.data));
    const fora = d.vendas.filter((v) => dentro(v.data));
    let semCusto = 0;
    const cmv = (id: number, q: number, fixo?: number) => { const c = fixo ?? custo(id); if (!c) semCusto += q; return c * q; };
    const sVend = site.reduce((a, v) => a + v.pecas, 0), sTaxa = site.reduce((a, v) => a + v.taxa, 0);
    const sCmv = site.reduce((a, v) => a + v.itens.reduce((b, i) => b + cmv(i.id, i.q), 0), 0);
    const sPecas = site.reduce((a, v) => a + v.itens.reduce((b, i) => b + i.q, 0), 0);
    const fVend = fora.reduce((a, v) => a + v.valor, 0), fTaxa = fora.reduce((a, v) => a + v.taxa, 0);
    const fCmv = fora.reduce((a, v) => a + cmv(v.produtoId, v.q, v.custo), 0), fPecas = fora.reduce((a, v) => a + v.q, 0);
    const aReceber = fora.reduce((a, v) => a + (v.aberto ?? 0), 0);
    const vendido = sVend + fVend, taxas = sTaxa + fTaxa, liquido = vendido - taxas, custoVend = sCmv + fCmv, lucro = liquido - custoVend;
    // Mais vendidas no período (site + fora).
    const porPeca: Record<string, { q: number; lucro: number }> = {};
    for (const v of site) for (const i of v.itens) { const x = (porPeca[i.nome] ??= { q: 0, lucro: 0 }); x.q += i.q; x.lucro += (v.pecas - v.taxa) * (i.q / Math.max(1, v.itens.reduce((a, b) => a + b.q, 0))) - custo(i.id) * i.q; }
    for (const v of fora) { const x = (porPeca[v.nome] ??= { q: 0, lucro: 0 }); x.q += v.q; x.lucro += v.valor - v.taxa - custoV(v) * v.q; }
    return {
      vendido: r2(vendido), taxas: r2(taxas), liquido: r2(liquido - aReceber), aReceber: r2(aReceber), custoVend: r2(custoVend), lucro: r2(lucro), semCusto,
      pecas: sPecas + fPecas, site: { n: site.length, pecas: sPecas, valor: r2(sVend) }, fora: { n: fora.length, pecas: fPecas, valor: r2(fVend) },
      top: Object.entries(porPeca).sort((a, b) => b[1].q - a[1].q).slice(0, 6),
    };
  }, [d, periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Investimento (sempre desde o começo): compras, dinheiro que já voltou e o estoque parado.
  const inv = useMemo(() => {
    if (!d) return null;
    const investido = d.compras.reduce((a, c) => a + c.valor, 0);
    const voltou = d.site.reduce((a, v) => a + v.pecas - v.taxa, 0) + d.vendas.reduce((a, v) => a + v.valor - v.taxa - (v.aberto ?? 0), 0);
    const aReceber = d.vendas.reduce((a, v) => a + (v.aberto ?? 0), 0);
    let parado = 0, venda = 0, unidades = 0, semCusto = 0;
    for (const p of cat.produtos) {
      if (p.emBreve) continue;
      const q = p.variantes.reduce((a, v) => a + v.estoque, 0);
      if (!q) continue;
      unidades += q;
      parado += custo(p.id) * q;
      if (!custo(p.id)) semCusto += q;
      venda += precoVitrine(CFG, p.preco) * q;
    }
    return { investido: r2(investido), voltou: r2(voltou), aReceber: r2(aReceber), parado: r2(parado), venda: r2(venda), unidades, semCusto };
  }, [d, cat]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d || !rel || !inv) return erro ? <p className="er">{erro}</p> : <p>Carregando…</p>;
  const pecaVenda = pecas.find((p) => String(p.id) === nv.produtoId);
  const variantes = pecaVenda?.variantes ?? [];

  return (
    <div className="fin">
      <p className="adm-dica">
        Tudo desta aba fica guardado só no painel (de forma privada, na Netlify): custos e lucros <b>nunca aparecem no site</b>. As vendas do
        site entram sozinhas (pedidos pagos); as de fora do site você registra aqui embaixo. Taxas do cartão do site são estimadas.
      </p>
      {erro ? <p className="er">{erro}</p> : null}
      {ok ? <p className="adm-ok">{ok}</p> : null}

      <section className="adm-rv">
        <div className="fin-topo">
          <b className="fin-tt">Resultado</b>
          <span className="est-per">
            {([["mes", "Este mês"], ["anterior", "Mês passado"], ["30", "30 dias"], ["tudo", "Desde o começo"]] as [Periodo, string][]).map(([v, t]) => (
              <button key={v} className={periodo === v ? "on" : ""} onClick={() => setPeriodo(v)}>{t}</button>
            ))}
          </span>
        </div>
        <div className="adm-rv-num">
          <div><small>Vendido</small><b>{brl(rel.vendido)}</b><em>{rel.pecas} peças · site {brl(rel.site.valor)} · fora {brl(rel.fora.valor)}</em></div>
          <div><small>Recebido</small><b>{brl(rel.liquido)}</b><em>{brl(rel.taxas)} de taxas{rel.aReceber ? ` · falta receber ${brl(rel.aReceber)}` : ""}</em></div>
          <div><small>Custo das peças vendidas</small><b>{brl(rel.custoVend)}</b><em>{rel.semCusto ? `${rel.semCusto} peça(s) sem custo cadastrado` : "todas com custo"}</em></div>
          <div><small>Lucro</small><b>{brl(rel.lucro)}</b><em>{rel.vendido ? `${pct(rel.lucro / rel.vendido)} do vendido` : "—"}</em></div>
        </div>
        {rel.semCusto ? <p className="adm-dica" style={{ margin: "10px 0 0" }}>O lucro só fica certo com o custo de todas as peças preenchido (lista no fim desta aba).</p> : null}
        {rel.top.length ? (
          <p className="adm-dica" style={{ margin: "10px 0 0" }}>
            Mais vendidas: {rel.top.map(([nome, x]) => `${nome} (${x.q}${rel.semCusto === 0 ? `, lucro ${brl(r2(x.lucro))}` : ""})`).join(" · ")}
          </p>
        ) : null}
      </section>

      <section className="adm-rv">
        <b className="fin-tt">Investimento (desde o começo)</b>
        <div className="adm-rv-num">
          <div><small>Investido em peças</small><b>{brl(inv.investido)}</b><em>{d.compras.length} compra(s) registrada(s)</em></div>
          <div><small>Já voltou</small><b>{brl(inv.voltou)}</b><em>{inv.investido ? `${pct(inv.voltou / inv.investido)} do investido` : "registre as compras"}{inv.aReceber ? ` · + ${brl(inv.aReceber)} a receber` : ""}</em></div>
          <div><small>Estoque parado (custo)</small><b>{brl(inv.parado)}</b><em>{inv.unidades} peças{inv.semCusto ? ` · ${inv.semCusto} sem custo` : ""}</em></div>
          <div><small>Estoque a preço de venda</small><b>{brl(inv.venda)}</b><em>se tudo vender no cartão, sem desconto</em></div>
        </div>
      </section>

      <h3>Importar do Caixa</h3>
      <p className="adm-dica">
        Arquivo de importação feito a partir do backup do programa de caixa: traz as vendas da loja, as compras (investimento) e o custo das peças.
        Importar de novo substitui a importação anterior; o que foi lançado à mão aqui continua. Não mexe no estoque do site.
      </p>
      <p>
        <label className="btn o" style={{ cursor: "pointer" }}>
          {ocupado === "Importando…" ? ocupado : "IMPORTAR ARQUIVO DO CAIXA"}
          <input type="file" accept=".json,application/json" hidden disabled={!!ocupado} onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            let x: Record<string, unknown>;
            try { x = JSON.parse(await f.text()); } catch { return setErro("Arquivo inválido: escolha o arquivo de importação (.json)."); }
            if (x.tipo !== "tramisse-financeiro") return setErro("Este não é o arquivo de importação do financeiro (o backup do Caixa não serve direto).");
            const venda = Array.isArray(x.vendas) ? x.vendas.length : 0, compra = Array.isArray(x.compras) ? x.compras.length : 0;
            if (!confirm(`Importar ${venda} venda(s) e ${compra} compra(s)? A importação anterior será substituída.`)) return;
            if (await acao({ ...x, acao: "importar" }, "Importando…")) setCustos(Object.fromEntries(Object.entries({ ...d.custos, ...((x.custos as Record<string, number>) ?? {}) }).map(([k, v]) => [k, String(v).replace(".", ",")])));
          }} />
        </label>
      </p>

      <h3>Registrar venda fora do site</h3>
      <p className="adm-dica">Vendas pelo Instagram, WhatsApp ou em mãos. Se marcar &quot;Tirar do estoque do site&quot;, a peça sai do site sozinha.</p>
      <div className="fg fin-form">
        <label className="s">Peça
          <select value={nv.produtoId} onChange={(e) => setNv({ ...nv, produtoId: e.target.value, variante: "" })}>
            <option value="">Escolha a peça…</option>
            {pecas.filter((p) => !p.emBreve).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <label>Tamanho / cor
          <select value={nv.variante} onChange={(e) => setNv({ ...nv, variante: e.target.value })} disabled={!pecaVenda}>
            <option value="">Escolha…</option>
            {variantes.map((v) => <option key={v.cor + v.tamanho} value={`${v.cor}|${v.tamanho}`}>{v.tamanho} · {cat.cores[v.cor]?.nome ?? v.cor} ({v.estoque} no estoque)</option>)}
          </select>
        </label>
        <label>Quantidade<input inputMode="numeric" value={nv.q} onChange={(e) => setNv({ ...nv, q: e.target.value })} /></label>
        <label>Valor cobrado (total, R$)<input inputMode="decimal" value={nv.valor} onChange={(e) => setNv({ ...nv, valor: e.target.value })} placeholder="Ex.: 143,90" /></label>
        <label>Forma
          <select value={nv.forma} onChange={(e) => setNv({ ...nv, forma: e.target.value })}>
            {Object.entries(FORMAS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </label>
        <label>Taxa (R$, se teve)<input inputMode="decimal" value={nv.taxa} onChange={(e) => setNv({ ...nv, taxa: e.target.value })} placeholder="Ex.: maquininha" /></label>
        <label>Data<input type="date" value={nv.data || d.hoje} onChange={(e) => setNv({ ...nv, data: e.target.value })} /></label>
        <label className="s">Observação (opcional)<input value={nv.obs} onChange={(e) => setNv({ ...nv, obs: e.target.value })} placeholder="Ex.: cliente Ana, Instagram" /></label>
        <label className="s fin-ck"><input type="checkbox" checked={nv.estoque} onChange={(e) => setNv({ ...nv, estoque: e.target.checked })} /> Tirar do estoque do site</label>
        <p className="s">
          <button className="btn" disabled={!!ocupado} onClick={async () => {
            const [cor, tam] = nv.variante.split("|");
            const ok = await acao({ acao: "venda", produtoId: Number(nv.produtoId), cor, tam, q: Number(nv.q), valor: n(nv.valor), taxa: n(nv.taxa || "0"), forma: nv.forma, data: nv.data || d.hoje, estoque: nv.estoque, obs: nv.obs }, "Registrando…");
            if (ok) setNv({ ...nv, produtoId: "", variante: "", q: "1", valor: "", taxa: "", obs: "" });
          }}>{ocupado === "Registrando…" ? ocupado : "REGISTRAR VENDA"}</button>
        </p>
      </div>
      {d.vendas.length ? (
        <ul className="adm-ul">
          {[...d.vendas].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 30).map((v) => (
            <li key={v.id} className="adm-ln">
              <span className="adm-nm">
                <b>{dataBr(v.data)} · {v.q}x {v.nome} ({v.tam}) · {brl(v.valor)}</b>
                <small>{FORMAS[v.forma] ?? v.forma}{v.taxa ? ` · taxa ${brl(v.taxa)}` : ""}{v.aberto ? ` · falta receber ${brl(v.aberto)}` : ""}{custoV(v) ? ` · lucro ${brl(r2(v.valor - v.taxa - custoV(v) * v.q))}` : ""}{v.estoque ? " · saiu do estoque do site" : ""}{v.obs ? ` · ${v.obs}` : ""}</small>
              </span>
              <span className="adm-ord">
                <button aria-label="Apagar venda" onClick={() => confirm(`Apagar esta venda?${v.estoque ? " A peça volta para o estoque do site." : ""}`) && acao({ acao: "apagarVenda", id: v.id }, "Apagando…")}>×</button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <h3>Compras de mercadoria (investimento)</h3>
      <p className="adm-dica">Cada compra que você faz para a loja, com o frete junto. É daqui que sai o &quot;Investido&quot; e o &quot;Já voltou&quot;.</p>
      <div className="fg fin-form">
        <label>Data<input type="date" value={nc.data || d.hoje} onChange={(e) => setNc({ ...nc, data: e.target.value })} /></label>
        <label>Valor total (R$)<input inputMode="decimal" value={nc.valor} onChange={(e) => setNc({ ...nc, valor: e.target.value })} placeholder="Ex.: 703,10" /></label>
        <label className="s">Descrição<input value={nc.descricao} onChange={(e) => setNc({ ...nc, descricao: e.target.value })} placeholder="Ex.: 8 jeans (Paloma, Alice, Belle), com frete" /></label>
        <p className="s">
          <button className="btn o" disabled={!!ocupado} onClick={async () => {
            if (await acao({ acao: "compra", data: nc.data || d.hoje, valor: n(nc.valor), descricao: nc.descricao }, "Salvando compra…")) setNc({ data: "", descricao: "", valor: "" });
          }}>{ocupado === "Salvando compra…" ? ocupado : "+ COMPRA"}</button>
        </p>
      </div>
      {d.compras.length ? (
        <ul className="adm-ul">
          {[...d.compras].sort((a, b) => b.data.localeCompare(a.data)).map((c) => (
            <li key={c.id} className="adm-ln">
              <span className="adm-nm"><b>{dataBr(c.data)} · {brl(c.valor)}</b><small>{c.descricao}</small></span>
              <span className="adm-ord"><button aria-label="Apagar compra" onClick={() => confirm("Apagar esta compra?") && acao({ acao: "apagarCompra", id: c.id }, "Apagando…")}>×</button></span>
            </li>
          ))}
        </ul>
      ) : null}

      <h3>Custo de cada peça</h3>
      <p className="adm-dica">Quanto você pagou por <b>uma</b> peça, somando a parte do frete da compra. A coluna ao lado mostra o lucro se ela vender hoje no cartão à vista.</p>
      <div className="fin-custos">
        {pecas.filter((p) => !p.emBreve).sort((a, b) => Number(b.variantes.some((v) => v.estoque > 0)) - Number(a.variantes.some((v) => v.estoque > 0))).map((p) => {
          const q = p.variantes.reduce((a, v) => a + v.estoque, 0);
          const vit = precoVitrine(CFG, p.preco);
          const c = n(custos[String(p.id)] ?? "");
          const lucro = c > 0 ? r2(vit * (1 - taxaParcelas(CFG, parcelasPermitidas(CFG, vit))) - c) : null;
          return (
            <label key={p.id} className={q ? "" : "esg"}>
              <span>{p.nome}<small>{q ? `${q} no estoque · ${brl(vit)}${p.precoDe ? " (BLACK)" : ""}` : "esgotada"}</small></span>
              <span className="fin-r">R$<input inputMode="decimal" value={custos[String(p.id)] ?? ""} onChange={(e) => setCustos({ ...custos, [p.id]: e.target.value })} aria-label={`Custo de ${p.nome}`} /></span>
              <em className={lucro != null && lucro < 0 ? "neg" : ""}>{lucro == null ? "" : `lucro ${brl(lucro)}`}</em>
            </label>
          );
        })}
      </div>
      <p>
        <button className="btn" disabled={!!ocupado} onClick={() => acao({ acao: "custos", custos: Object.fromEntries(Object.entries(custos).map(([k, v]) => [k, n(v)])) }, "Salvando custos…")}>
          {ocupado === "Salvando custos…" ? ocupado : "SALVAR CUSTOS"}
        </button>
      </p>
    </div>
  );

}
