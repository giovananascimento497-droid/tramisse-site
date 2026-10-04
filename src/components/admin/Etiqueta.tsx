"use client";

import { useEffect, useState } from "react";
import { brl } from "@/lib/payment/pricing";
import type { PedidoSalvo } from "@/lib/pedidos/tipos";
import { api } from "./util";

type Remetente = Record<string, string>;
const CAMPOS: [string, string, string?][] = [
  ["nome", "Nome de quem envia"], ["documento", "CPF ou CNPJ"], ["telefone", "Telefone"], ["email", "E-mail"],
  ["cep", "CEP"], ["endereco", "Endereço"], ["numero", "Número"], ["complemento", "Complemento (opcional)"],
  ["bairro", "Bairro"], ["cidade", "Cidade"], ["uf", "Estado (UF)"],
];

// Dados de quem envia as encomendas (vão na etiqueta). Ficam guardados de forma privada na Netlify.
export function RemetenteForm({ onSalvo }: { onSalvo?: () => void }) {
  const [r, setR] = useState<Remetente | null>(null);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    api("/api/admin/remetente")
      .then((d) => setR(d.remetente ?? { ...Object.fromEntries(CAMPOS.map(([k]) => [k, ""])), ...d.sugestao }))
      .catch((e) => setErro((e as Error).message));
  }, []);
  if (!r) return erro ? <p className="er">{erro}</p> : <p>Carregando…</p>;
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setOk("");
    setOcupado(true);
    try {
      const d = await api("/api/admin/remetente", { method: "POST", body: JSON.stringify(r) });
      setR(d.remetente);
      setOk("Dados de envio salvos!");
      onSalvo?.();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  return (
    <form className="fg" onSubmit={salvar}>
      {CAMPOS.map(([k, l]) => (
        <label key={k}>{l}<input value={r[k] ?? ""} onChange={(e) => setR({ ...r, [k]: e.target.value })} /></label>
      ))}
      <div className="s er">{erro}</div>
      <div className="s" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button className="btn" disabled={ocupado}>{ocupado ? "SALVANDO…" : "SALVAR DADOS DE ENVIO"}</button>
        {ok ? <span style={{ color: "var(--car)" }}>{ok}</span> : null}
      </div>
    </form>
  );
}

// Etiqueta dos Correios pelo Melhor Envio: preparar (mostra o preço) → comprar → imprimir.
export function EtiquetaBox({ p, onSalvo }: { p: PedidoSalvo; onSalvo: (p: PedidoSalvo) => void }) {
  const [ocupado, setOcupado] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [semRemetente, setSemRemetente] = useState(false);
  const et = p.etiqueta;

  const acao = async (acao: string, msg: string) => {
    setErro("");
    setAviso("");
    setOcupado(msg);
    try {
      const d = await api("/api/admin/etiqueta", { method: "POST", body: JSON.stringify({ id: p.id, acao }) });
      if (d.pedido) onSalvo(d.pedido);
      if (d.aviso) setAviso(d.aviso);
      if (d.url) window.open(d.url, "_blank", "noopener");
    } catch (e) {
      const m = (e as Error).message;
      if (/dados de quem envia/.test(m)) setSemRemetente(true);
      setErro(m);
    } finally {
      setOcupado("");
    }
  };

  if (semRemetente)
    return (
      <>
        <p className="adm-dica">Antes da primeira etiqueta, preencha os dados de quem envia (uma vez só; ficam guardados).</p>
        <RemetenteForm onSalvo={() => { setSemRemetente(false); setErro(""); }} />
      </>
    );

  return (
    <div>
      {!et ? (
        <p className="adm-dica">Gera a etiqueta pelo Melhor Envio com o endereço da cliente. O valor sai do saldo da sua carteira no Melhor Envio.</p>
      ) : et.status === "carrinho" ? (
        <p>Etiqueta {p.pedido.frete?.nome} pronta para comprar: <b>{brl(et.preco)}</b> (sai do saldo do Melhor Envio).</p>
      ) : et.status === "paga" ? (
        <p>Etiqueta paga ({brl(et.preco)}), falta gerar.</p>
      ) : (
        <p>Etiqueta {p.pedido.frete?.nome} comprada ({brl(et.preco)}).{p.rastreio ? <> Rastreio: <b>{p.rastreio}</b></> : " O rastreio aparece depois de gerada (use ATUALIZAR RASTREIO)."}</p>
      )}
      <div className="adm-bts">
        {!et ? <button className="btn" disabled={!!ocupado} onClick={() => acao("preparar", "Preparando…")}>{ocupado || "PREPARAR ETIQUETA"}</button> : null}
        {et && et.status !== "gerada" ? (
          <>
            <button
              className="btn"
              disabled={!!ocupado}
              onClick={() => confirm(`Comprar a etiqueta por ${brl(et.preco)} com o saldo do Melhor Envio?`) && acao("comprar", "Comprando…")}
            >
              {ocupado || (et.status === "paga" ? "GERAR ETIQUETA" : `COMPRAR ETIQUETA (${brl(et.preco)})`)}
            </button>
            {et.status === "carrinho" ? <button className="btn o" disabled={!!ocupado} onClick={() => acao("descartar", "Descartando…")}>DESCARTAR</button> : null}
          </>
        ) : null}
        {et?.status === "gerada" ? (
          <>
            <button className="btn" disabled={!!ocupado} onClick={() => acao("imprimir", "Abrindo…")}>{ocupado === "Abrindo…" ? ocupado : "IMPRIMIR ETIQUETA"}</button>
            <button className="btn o" disabled={!!ocupado} onClick={() => acao("rastreio", "Consultando…")}>{ocupado === "Consultando…" ? ocupado : "ATUALIZAR RASTREIO"}</button>
          </>
        ) : null}
        <button className="btn o" type="button" onClick={() => setSemRemetente(true)}>DADOS DE QUEM ENVIA</button>
      </div>
      {aviso ? <p className="adm-dica" style={{ marginTop: 8 }}>{aviso}</p> : null}
      {erro ? <p className="er" style={{ marginTop: 8 }}>{erro}</p> : null}
    </div>
  );
}
