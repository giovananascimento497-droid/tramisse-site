"use client";

import { useEffect, useState } from "react";
import { brl } from "@/lib/payment/pricing";
import { api } from "./util";

type Cupom = { codigo: string; tipo: "percentual"; valor: number; somenteClientes?: boolean; parceira?: string; ativo?: boolean };
type Vendas = { pedidos: number; pecas: number; vendido: number; desconto: number; ultimo?: string };
// Na tela, o desconto fica em % (texto) para editar fácil.
type CupomEd = Omit<Cupom, "valor"> & { pct: string };

const paraTela = (l: Cupom[]): CupomEd[] => l.map(({ valor, ...c }) => ({ ...c, pct: String(Math.round(valor * 1000) / 10) }));
const daTela = (l: CupomEd[]): Cupom[] => l.map(({ pct, ...c }) => ({ ...c, codigo: c.codigo.trim().toUpperCase(), valor: Number(pct.replace(",", ".")) / 100 }));
const data = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Belem" }) : "");
const vazio: Vendas = { pedidos: 0, pecas: 0, vendido: 0, desconto: 0 };

// Aba CUPONS do painel: criar, desligar e acompanhar cupons. Cupom com "parceira" é de influenciadora:
// o relatório mostra quanto ela vendeu (pedidos pagos) e o link de divulgação já aplica o cupom.
export function CuponsView({ onSair }: { onSair: () => void }) {
  const [lista, setLista] = useState<CupomEd[] | null>(null);
  const [vendas, setVendas] = useState<Record<string, Vendas>>({});
  const [recuperacao, setRecuperacao] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const site = typeof location !== "undefined" ? location.origin : "https://tramisse.com.br";

  useEffect(() => {
    api("/api/admin/cupons")
      .then((d) => { setLista(paraTela(d.cupons)); setVendas(d.vendas ?? {}); setRecuperacao(d.recuperacao ?? ""); })
      .catch((e) => ((e as { status?: number }).status === 401 ? onSair() : setErro((e as Error).message)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lista) return erro ? <p className="er">{erro}</p> : <p>Carregando…</p>;
  const mudar = (i: number, m: Partial<CupomEd>) => { setOk(""); setLista((l) => l!.map((c, k) => (k === i ? { ...c, ...m } : c))); };
  const linkDe = (c: CupomEd) => `${site}/?cupom=${encodeURIComponent(c.codigo)}&utm_source=${encodeURIComponent((c.parceira || c.codigo).toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, ""))}`;
  const copiar = async (t: string) => { try { await navigator.clipboard.writeText(t); setOk("Link copiado."); } catch { setOk(t); } };

  const publicar = async () => {
    setErro("");
    setOk("");
    setOcupado(true);
    try {
      const d = await api("/api/admin/cupons", { method: "POST", body: JSON.stringify({ cupons: daTela(lista) }) });
      setLista(paraTela(d.cupons));
      setOk("Publicado! O site atualiza em uns 3 minutos.");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  // Parceiras primeiro (ranking por vendas), depois os cupons da loja.
  const ordem = lista.map((c, i) => ({ c, i, v: vendas[c.codigo.trim().toUpperCase()] ?? vazio }))
    .sort((a, b) => Number(!!b.c.parceira) - Number(!!a.c.parceira) || b.v.vendido - a.v.vendido);
  const totalParceiras = ordem.filter((x) => x.c.parceira).reduce((a, x) => a + x.v.vendido, 0);

  return (
    <div className="cup">
      <p className="adm-dica">
        Cupom de influenciadora: preencha o nome dela em <b>Parceira</b> (ex.: código JULIA10, parceira Julia Souza). Mande para ela o
        <b> link de divulgação</b>: quem entra por ele já fica com o cupom aplicado, e as visitas aparecem com o nome dela na aba ESTATÍSTICAS.
        As vendas contam só pedidos pagos no site. Um cupom por pedido; peças em promoção não recebem cupom.
      </p>
      {totalParceiras ? <p className="adm-resumo"><span><b>{brl(totalParceiras)}</b> vendidos com cupons de parceiras</span></p> : null}
      <div className="cup-l">
        {ordem.map(({ c, i, v }) => (
          <section key={i} className={`cup-c${c.ativo === false ? " off" : ""}`}>
            <div className="cup-top">
              <input value={c.codigo} onChange={(e) => mudar(i, { codigo: e.target.value.toUpperCase().replace(/\s/g, "") })} aria-label="Código" className="cup-cod" />
              <span className="cup-pct"><input inputMode="decimal" value={c.pct} onChange={(e) => mudar(i, { pct: e.target.value })} aria-label="Desconto em %" />%</span>
              {c.codigo !== recuperacao ? (
                <button className="adm-x" aria-label="Apagar cupom" onClick={() => confirm(`Apagar o cupom ${c.codigo}? (Para só pausar, desmarque "Ativo".)`) && setLista((l) => l!.filter((_, k) => k !== i))}>×</button>
              ) : null}
            </div>
            <label className="cup-par">Parceira (influenciadora)<input value={c.parceira ?? ""} onChange={(e) => mudar(i, { parceira: e.target.value })} placeholder="Deixe vazio se for cupom da loja" /></label>
            <div className="cup-ck">
              <label><input type="checkbox" checked={c.ativo !== false} disabled={c.codigo === recuperacao} onChange={(e) => mudar(i, { ativo: e.target.checked ? undefined : false })} /> Ativo</label>
              <label><input type="checkbox" checked={!!c.somenteClientes} onChange={(e) => mudar(i, { somenteClientes: e.target.checked || undefined })} /> Só para quem já comprou</label>
            </div>
            <p className="cup-v">
              {v.pedidos
                ? <><b>{v.pedidos} {v.pedidos === 1 ? "pedido" : "pedidos"} · {brl(v.vendido)}</b> · {v.pecas} {v.pecas === 1 ? "peça" : "peças"} · {brl(v.desconto)} de desconto · último em {data(v.ultimo)}</>
                : "Nenhuma venda paga com este cupom ainda."}
              {c.codigo === recuperacao ? <><br /><small>Cupom do lembrete de compra não concluída.</small></> : null}
            </p>
            {c.parceira ? (
              <p className="cup-link">
                <input readOnly value={linkDe(c)} onFocus={(e) => e.currentTarget.select()} aria-label="Link de divulgação" />
                <button className="btn o" onClick={() => copiar(linkDe(c))}>COPIAR</button>
              </p>
            ) : null}
          </section>
        ))}
      </div>
      <p><button className="btn o" onClick={() => setLista((l) => [...l!, { codigo: "", tipo: "percentual", pct: "10", parceira: "" }])}>+ CUPOM</button></p>
      {erro ? <p className="er">{erro}</p> : null}
      <p style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn" onClick={publicar} disabled={ocupado}>{ocupado ? "PUBLICANDO…" : "PUBLICAR"}</button>
        {ok ? <span style={{ color: "var(--car)" }}>{ok}</span> : null}
      </p>
      <p className="adm-dica">Dica de gestão: combine uma meta com cada parceira (ex.: 10 vendas no mês). Quem não vende, troque; quem vende muito, renove e dê mais peças.</p>
    </div>
  );
}
