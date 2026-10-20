"use client";

import { useEffect, useMemo, useState } from "react";
import { CFG } from "@/lib/config";
import { brl } from "@/lib/payment/pricing";
import type { Carrinho } from "@/lib/pedidos/carrinhos";
import { textoLembrete } from "@/lib/pedidos/lembrete";
import { api } from "./util";

type Filtro = "abertos" | "concluidos" | "todos";
const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Belem", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const zap = (tel: string) => (tel.length >= 10 ? `https://wa.me/${tel.length <= 11 ? "55" + tel : tel}` : "");

// Aba CARRINHOS do painel: quem se identificou no checkout e não finalizou. O e-mail com o cupom
// sai sozinho (se o Resend estiver ligado); o WhatsApp a loja manda com um toque, com a mensagem pronta.
export function CarrinhosView({ onSair }: { onSair: () => void }) {
  const [lista, setLista] = useState<Carrinho[] | null>(null);
  const [email, setEmail] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("abertos");
  const cupom = CFG.recuperacao?.cupom ?? "";
  const site = typeof location !== "undefined" ? location.origin : "https://tramisse.com.br";

  const carregar = async () => {
    setErro("");
    try {
      const d = await api("/api/admin/carrinhos");
      setLista(d.carrinhos);
      setEmail(Boolean(d.email));
    } catch (e) {
      if ((e as { status?: number }).status === 401) return onSair();
      setErro((e as Error).message);
      setLista((l) => l ?? []);
    }
  };
  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mudar = async (id: string, acao: "whats" | "apagar" | "concluido") => {
    if (acao === "apagar" && !confirm("Apagar este carrinho?")) return;
    try {
      const d = await api("/api/admin/carrinhos", { method: "PATCH", body: JSON.stringify({ id, acao }) });
      setLista((l) => (acao === "apagar" ? (l ?? []).filter((c) => c.id !== id) : (l ?? []).map((c) => (c.id === id ? d.carrinho : c))));
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const vis = useMemo(
    () => (lista ?? []).filter((c) => (filtro === "todos" ? true : filtro === "concluidos" ? !!c.concluido : !c.concluido)),
    [lista, filtro],
  );
  const abertos = (lista ?? []).filter((c) => !c.concluido);
  const valorAberto = abertos.reduce((a, c) => a + c.total, 0);

  return (
    <div className="carr">
      <p className="adm-dica">
        Clientes que preencheram nome e contato no checkout e não finalizaram a compra.{" "}
        {email
          ? `O e-mail com o cupom ${cupom} (5%) sai sozinho ${CFG.recuperacao?.horas ?? 2} horas depois.`
          : "Os e-mails automáticos estão desligados (falta configurar o Resend na Netlify); use o WhatsApp."}{" "}
        O botão WHATSAPP abre a conversa com a mensagem e o link que refaz a sacola com o cupom.
      </p>
      {erro ? <p className="er">{erro}</p> : null}
      <p className="adm-resumo">
        <button className={filtro === "abertos" ? "on" : ""} onClick={() => setFiltro("abertos")}><b>{abertos.length}</b> não concluídos · {brl(valorAberto)}</button>
        <button className={filtro === "concluidos" ? "on" : ""} onClick={() => setFiltro("concluidos")}><b>{(lista ?? []).length - abertos.length}</b> viraram pedido</button>
        <button className={filtro === "todos" ? "on" : ""} onClick={() => setFiltro("todos")}>Todos</button>
        <button onClick={carregar} aria-label="Atualizar">↻</button>
      </p>
      {!lista ? <p>Carregando…</p> : !vis.length ? <p className="adm-dica">Nada por aqui ainda.</p> : null}
      <ul className="adm-ul">
        {vis.map((c) => {
          const t = textoLembrete(c, cupom, `${site}/checkout?carrinho=${c.id}`);
          const link = zap(c.tel);
          return (
            <li key={c.id} className="adm-ln carr-ln">
              <span className="adm-nm">
                <b>{c.nome || "(sem nome)"} · {brl(c.total)}</b>
                <small>
                  {quando(c.atualizadoEm)} · {c.itens.map((i) => `${i.q}x ${i.nome} (${i.tam})`).join(", ")}
                </small>
                <small>
                  {[c.email, c.tel].filter(Boolean).join(" · ")}
                  {c.concluido ? " · virou pedido" : ""}
                  {c.lembreteEmail ? ` · e-mail enviado ${quando(c.lembreteEmail)}` : ""}
                  {c.lembreteWhats ? ` · WhatsApp ${quando(c.lembreteWhats)}` : ""}
                  {c.semLembrete ? " · pediu para não receber" : ""}
                </small>
              </span>
              <span className="adm-ord">
                {link && !c.concluido && !c.semLembrete ? (
                  <a
                    className={`btn${c.lembreteWhats ? " o" : ""}`}
                    style={{ padding: "8px 12px", fontSize: 11 }}
                    href={`${link}?text=${encodeURIComponent([...t.linhas, "", `Finalize aqui: ${t.link}`].join("\n"))}`}
                    target="_blank"
                    rel="noopener"
                    onClick={() => mudar(c.id, "whats")}
                  >
                    WHATSAPP
                  </a>
                ) : null}
                {!c.concluido ? <button onClick={() => mudar(c.id, "concluido")} aria-label="Marcar como resolvido" title="Resolvido (comprou por outro canal)">✓</button> : null}
                <button onClick={() => mudar(c.id, "apagar")} aria-label="Apagar">×</button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
