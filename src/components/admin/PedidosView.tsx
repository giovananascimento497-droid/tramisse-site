"use client";

import { useEffect, useMemo, useState } from "react";
import { CFG } from "@/lib/config";
import { brl, nomesPagamento } from "@/lib/payment/pricing";
import { textoEntrega } from "@/lib/payment/whatsapp";
import { avisoDaSituacao, textoAviso } from "@/lib/pedidos/mensagens";
import { EtiquetaBox } from "./Etiqueta";
import { ResumoVendas } from "./ResumoVendas";
import { NOMES_CANAL, NOMES_SITUACAO, SITUACOES, type PedidoSalvo, type Situacao } from "@/lib/pedidos/tipos";

const PAGAMENTO = nomesPagamento(CFG);
const NOMES_AVISO: Record<string, string> = { recebido: "Pedido recebido", pago: "Pagamento confirmado", enviado: "Pedido enviado" };
type Filtro = "abertos" | "todos" | Situacao;

const data = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Belem", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const nome = (p: PedidoSalvo) => [p.pedido.cliente.n, p.pedido.cliente.sn].filter(Boolean).join(" ") || "(sem nome)";
const so = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
// Telefone da cliente para abrir conversa no WhatsApp (DDD + número; soma o 55 do Brasil).
const zap = (tel?: string) => {
  const d = (tel || "").replace(/\D/g, "");
  if (d.length < 10) return "";
  return `https://wa.me/${d.length <= 11 ? "55" + d : d}`;
};
const STATUS_MP: Record<string, string> = {
  approved: "aprovado", pending: "pendente", in_process: "em análise", authorized: "autorizado",
  rejected: "recusado", cancelled: "cancelado", refunded: "devolvido", charged_back: "contestado",
};

async function api(caminho: string, init?: RequestInit) {
  const r = await fetch(caminho, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.erro || "Algo deu errado."), { status: r.status });
  return d;
}

// Aba "Pedidos" do painel: pedidos feitos no site (WhatsApp, Pix e Mercado Pago).
// Pagamentos aprovados no Mercado Pago viram "Pago" sozinhos; o resto a loja muda aqui.
export function PedidosView({ onSair }: { onSair: () => void }) {
  const [pedidos, setPedidos] = useState<PedidoSalvo[] | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("abertos");
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [email, setEmail] = useState(false);

  const carregar = async () => {
    setErro("");
    try {
      const d = await api("/api/admin/pedidos");
      setPedidos(d.pedidos);
      setEmail(Boolean(d.email));
    } catch (e) {
      if ((e as { status?: number }).status === 401) return onSair();
      setErro((e as Error).message);
      setPedidos((p) => p ?? []);
    }
  };
  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lista = useMemo(() => {
    const q = so(busca.trim());
    return (pedidos ?? []).filter((p) => {
      if (filtro === "abertos" && (p.situacao === "entregue" || p.situacao === "cancelado")) return false;
      if (filtro !== "abertos" && filtro !== "todos" && p.situacao !== filtro) return false;
      if (q && !so(`${nome(p)} ${p.id} ${p.pedido.cliente.tel || ""} ${p.pedido.itens.map((i) => i.nome).join(" ")}`).includes(q)) return false;
      return true;
    });
  }, [pedidos, filtro, busca]);

  const contagem = useMemo(() => {
    const c: Partial<Record<Situacao, number>> = {};
    for (const p of pedidos ?? []) c[p.situacao] = (c[p.situacao] ?? 0) + 1;
    return c;
  }, [pedidos]);

  const salvo = (p: PedidoSalvo) => setPedidos((l) => (l ?? []).map((x) => (x.id === p.id ? p : x)));
  const apagado = (id: string) => { setPedidos((l) => (l ?? []).filter((x) => x.id !== id)); setSel(null); setAviso("Pedido apagado."); };

  const atual = sel ? pedidos?.find((p) => p.id === sel) : null;
  if (atual) return <Detalhe p={atual} email={email} onVoltar={() => { setSel(null); setAviso(""); }} onSalvo={salvo} onApagado={apagado} />;

  return (
    <>
      {aviso ? <p className="adm-ok">{aviso}</p> : null}
      {erro ? <p className="er" style={{ margin: "8px 0" }}>{erro}</p> : null}
      {pedidos ? <ResumoVendas pedidos={pedidos} /> : null}
      <p className="adm-resumo">
        {(["aguardando", "pago", "separacao", "enviado"] as Situacao[]).map((s) => (
          <button key={s} className={filtro === s ? "on" : ""} onClick={() => setFiltro(filtro === s ? "abertos" : s)}>
            <b>{contagem[s] ?? 0}</b> {NOMES_SITUACAO[s].toLowerCase()}
          </button>
        ))}
      </p>
      <div className="adm-filtros">
        <input placeholder="Buscar cliente, peça ou nº…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar pedido" />
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} aria-label="Filtrar">
          <option value="abertos">Em aberto</option>
          <option value="todos">Todos</option>
          {SITUACOES.map((s) => <option key={s} value={s}>{NOMES_SITUACAO[s]}</option>)}
        </select>
        <button className="btn o" onClick={carregar} aria-label="Atualizar lista">↻</button>
      </div>
      {!pedidos ? <p>Carregando os pedidos…</p> : !lista.length ? (
        <p style={{ color: "var(--mut)" }}>
          {pedidos.length ? "Nenhum pedido com esse filtro." : "Ainda não há pedidos. Os próximos pedidos feitos no site aparecem aqui."}
        </p>
      ) : null}
      <ul className="adm-lista">
        {lista.map((p) => (
          <li key={p.id}>
            <button onClick={() => { setSel(p.id); scrollTo(0, 0); }}>
              <span className="adm-nm">
                <b>{nome(p)} · {brl(p.pedido.total)}</b>
                <small>
                  {data(p.criadoEm)} · {NOMES_CANAL[p.canal]} · {p.pedido.itens.reduce((a, i) => a + i.q, 0)} peça(s):{" "}
                  {p.pedido.itens.map((i) => i.nome).join(", ")}
                </small>
              </span>
              <em className={`adm-tag adm-s-${p.situacao}`}>{NOMES_SITUACAO[p.situacao]}</em>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Detalhe(props: { p: PedidoSalvo; email: boolean; onVoltar: () => void; onSalvo: (p: PedidoSalvo) => void; onApagado: (id: string) => void }) {
  const { p } = props;
  const c = p.pedido.cliente;
  const [situacao, setSituacao] = useState<Situacao>(p.situacao);
  const [rastreio, setRastreio] = useState(p.rastreio ?? "");
  // O rastreio pode chegar pela etiqueta do Melhor Envio.
  useEffect(() => { setRastreio(p.rastreio ?? ""); }, [p.rastreio]);
  const [obs, setObs] = useState(p.obs ?? "");
  const [ocupado, setOcupado] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const mudou = situacao !== p.situacao || rastreio !== (p.rastreio ?? "") || obs !== (p.obs ?? "");

  const salvar = async () => {
    setErro("");
    setOk("");
    setOcupado("Salvando…");
    try {
      const d = await api("/api/admin/pedidos", { method: "PATCH", body: JSON.stringify({ id: p.id, situacao, rastreio, obs }) });
      props.onSalvo(d.pedido);
      setOk(d.aviso ? `Salvo! ${d.aviso}` : "Salvo!");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado("");
    }
  };
  const apagar = async () => {
    if (!confirm(`Apagar o pedido de ${nome(p)}? Isso não pode ser desfeito.`)) return;
    setOcupado("Apagando…");
    try {
      await api(`/api/admin/pedidos?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
      props.onApagado(p.id);
    } catch (e) {
      setErro((e as Error).message);
      setOcupado("");
    }
  };

  const linkZap = zap(c.tel);
  const endereco = [[c.end, c.num].filter(Boolean).join(", "), c.cmp, c.bai, [c.cid, c.uf].filter(Boolean).join("/"), c.cep && `CEP ${c.cep}`].filter(Boolean).join(" · ");

  return (
    <div className="adm-ped">
      <p><a href="#" onClick={(e) => { e.preventDefault(); props.onVoltar(); }} style={{ textDecoration: "underline" }}>← Voltar para os pedidos</a></p>
      <h2>{nome(p)}</h2>
      <p style={{ color: "var(--mut)", fontSize: 13 }}>
        Pedido {p.id} · {data(p.criadoEm)} · {NOMES_CANAL[p.canal]} · atendente: {p.atendente}
      </p>

      <h3>Peças</h3>
      <ul className="adm-itens">
        {p.pedido.itens.map((i, k) => (
          <li key={k}>
            <span>{i.q}x <a href={`/produto/${i.slug}`} target="_blank" rel="noopener">{i.nome}</a> · {i.cor} · tam. {i.tam}</span>
            <b>{brl(i.precoUnitario * i.q)}</b>
          </li>
        ))}
        {p.pedido.desconto ? <li><span>Cupom {p.pedido.cupom}</span><span>− {brl(p.pedido.desconto)}</span></li> : null}
        {p.pedido.descontoPix ? <li><span>Desconto Pix</span><span>− {brl(p.pedido.descontoPix)}</span></li> : null}
        {p.pedido.frete ? <li><span>Frete {p.pedido.frete.nome}</span><span>{p.pedido.frete.gratis ? "Grátis" : brl(p.pedido.frete.valor)}</span></li> : null}
        <li className="t"><span>Total</span><b>{brl(p.pedido.total)}</b></li>
      </ul>

      <h3>Pagamento e entrega</h3>
      <p>
        {PAGAMENTO[p.pedido.pagamento]}
        {p.mercadoPago ? <> · Mercado Pago nº {p.mercadoPago.id} ({STATUS_MP[p.mercadoPago.status] ?? p.mercadoPago.status})</> : null}
        {p.canal === "pix" && p.situacao === "aguardando" ? <> · <b>confira o comprovante do Pix antes de marcar como pago</b></> : null}
        <br />
        {textoEntrega(p.pedido).split(":")[0]}
      </p>

      {p.pedido.entrega === "correios" ? (
        <>
          <h3>Etiqueta dos Correios</h3>
          <EtiquetaBox p={p} onSalvo={props.onSalvo} />
        </>
      ) : null}

      <h3>Cliente</h3>
      <p>
        {nome(p)}{c.cpf ? <> · CPF {c.cpf}</> : null}<br />
        {c.tel ? <>Telefone: {linkZap ? <a href={linkZap} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>{c.tel} (abrir WhatsApp)</a> : c.tel}<br /></> : null}
        {c.e ? <>E-mail: <a href={`mailto:${c.e}`} style={{ textDecoration: "underline" }}>{c.e}</a><br /></> : null}
        {p.pedido.entrega !== "retirada" && endereco ? <>Endereço: {endereco}{c.dest ? ` (recebe: ${c.dest})` : ""}</> : null}
      </p>

      <h3>Avisar a cliente</h3>
      <p className="adm-dica">
        Abre o WhatsApp da cliente com a mensagem pronta (o botão escuro é o que combina com a situação atual).{" "}
        {props.email
          ? <>E-mails automáticos ligados{p.avisos?.length ? <>: já enviados {p.avisos.map((a) => NOMES_AVISO[a] ?? a).join(", ")}.</> : " (nenhum enviado ainda para este pedido)."}</>
          : "E-mails automáticos desligados (falta configurar o Resend na Netlify)."}
      </p>
      <div className="adm-bts" style={{ marginBottom: 8 }}>
        {(["recebido", "pago", "enviado"] as const).map((t) => {
          const link = linkZap ? `${linkZap}?text=${encodeURIComponent(textoAviso(t, p).linhas.join("\n"))}` : "";
          return link ? (
            <a key={t} className={`btn${avisoDaSituacao(p) === t ? "" : " o"}`} href={link} target="_blank" rel="noopener">
              {NOMES_AVISO[t].toUpperCase()}
            </a>
          ) : null;
        })}
        {!linkZap ? <span className="adm-dica">Sem telefone válido da cliente.</span> : null}
      </div>

      <h3>Acompanhamento</h3>
      <form className="fg" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
        <label>
          Situação
          <select value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao)}>
            {SITUACOES.map((s) => <option key={s} value={s}>{NOMES_SITUACAO[s]}</option>)}
          </select>
        </label>
        <label>
          Código de rastreio (opcional)
          <input value={rastreio} onChange={(e) => setRastreio(e.target.value.toUpperCase())} placeholder="Ex.: AB123456789BR" />
        </label>
        <label className="s">
          Observações (só a loja vê)
          <textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </label>
        <div className="s er">{erro}</div>
        <div className="s" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn" disabled={!mudou || !!ocupado}>{ocupado || "SALVAR"}</button>
          <button type="button" className="btn o" onClick={apagar} disabled={!!ocupado}>APAGAR PEDIDO</button>
          {ok && !mudou ? <span style={{ color: "var(--car)" }}>{ok}</span> : null}
        </div>
      </form>
      <p style={{ color: "var(--mut)", fontSize: 13, marginTop: 16 }}>
        Estoque: ao marcar como Pago (ou Em separação, Enviado, Entregue), as peças saem do estoque sozinhas; se voltar para
        Aguardando ou Cancelado, elas voltam. Pagamentos aprovados no Mercado Pago já baixam sozinhos.
        {p.estoque ? <><br /><b>{p.estoque.estado === "baixado" ? "Estoque deste pedido: já baixado." : "Estoque deste pedido: devolvido."}</b></> : null}
      </p>
    </div>
  );
}
