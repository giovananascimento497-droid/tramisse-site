"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CFG } from "@/lib/config";
import { resumoPedido } from "@/lib/payment/whatsapp";
import type { Pedido } from "@/lib/types";
import { useLoja } from "@/store/Store";

type Pendente = { referencia: string; pedido: Pedido; atendente: string };
type Estado = "carregando" | "aprovado" | "processando" | "recusado" | "sem-pedido";

// Volta do Mercado Pago. A situação é confirmada na API (não só pelos parâmetros da URL)
// e a cliente envia o resumo do pedido pago para a atendente pelo WhatsApp.
export function RetornoView() {
  const sp = useSearchParams();
  const { setBag, setCupom } = useLoja();
  const [estado, setEstado] = useState<Estado>("carregando");
  const [pend, setPend] = useState<Pendente | null>(null);
  const [pagamentoId, setPagamentoId] = useState("");

  useEffect(() => {
    let p: Pendente | null = null;
    try { p = JSON.parse(localStorage.getItem("tp") || "null"); } catch {}
    setPend(p);
    const id = sp.get("payment_id") || sp.get("collection_id") || "";
    if (!p) return setEstado("sem-pedido");
    if (!id || id === "null") return setEstado("recusado");
    setPagamentoId(id);
    fetch(`/api/pagamento/mercadopago/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((r: { status: string; referencia: string }) => {
        if (r.referencia !== p!.referencia) return setEstado("recusado");
        if (r.status === "approved") {
          setEstado("aprovado");
          setBag(() => []);
          setCupom(null);
        } else if (r.status === "pending" || r.status === "in_process" || r.status === "authorized") setEstado("processando");
        else setEstado("recusado");
      })
      .catch(() => setEstado("recusado"));
  }, [sp, setBag, setCupom]);

  const linkWhatsApp = (status: string) => {
    if (!pend) return "";
    const at = CFG.atendentes.find((a) => a.nome === pend.atendente) ?? CFG.atendentes[0];
    const pedido: Pedido = { ...pend.pedido, pagamentoOnline: { provedor: "Mercado Pago", id: pagamentoId, status } };
    return `https://wa.me/${at.whatsapp}?text=${encodeURIComponent(resumoPedido(pedido))}`;
  };

  if (estado === "carregando") return <div className="pg"><h1>Confirmando pagamento…</h1></div>;
  if (estado === "sem-pedido")
    return (
      <div className="pg">
        <h1>Pedido não encontrado</h1>
        <p>Não encontramos o pedido neste navegador. Se você já pagou, fale com o nosso atendimento.</p>
        <p><Link className="btn" href="/pagina/contato">FALAR COM O ATENDIMENTO</Link></p>
      </div>
    );
  if (estado === "aprovado")
    return (
      <div className="pg">
        <h1>Pagamento aprovado</h1>
        <p>
          Obrigada! Seu pagamento foi confirmado pelo Mercado Pago (pagamento nº {pagamentoId}). Envie agora o resumo do pedido
          para a {pend?.atendente} pelo WhatsApp: o atendimento combina a entrega ou a retirada com você.
        </p>
        <p>
          <a className="btn" href={linkWhatsApp("aprovado")} target="_blank" rel="noopener">ENVIAR PEDIDO PELO WHATSAPP</a>{" "}
          <Link className="btn o" href="/">VOLTAR À HOME</Link>
        </p>
      </div>
    );
  if (estado === "processando")
    return (
      <div className="pg">
        <h1>Pagamento em processamento</h1>
        <p>
          O Mercado Pago ainda está confirmando o seu pagamento (nº {pagamentoId}). Envie o resumo do pedido para o nosso
          atendimento: avisamos assim que for aprovado.
        </p>
        <p>
          <a className="btn" href={linkWhatsApp("em processamento")} target="_blank" rel="noopener">ENVIAR PEDIDO PELO WHATSAPP</a>{" "}
          <Link className="btn o" href="/">VOLTAR À HOME</Link>
        </p>
      </div>
    );
  return (
    <div className="pg">
      <h1>Pagamento não concluído</h1>
      <p>O pagamento não foi aprovado ou foi cancelado. Sua sacola continua salva: você pode tentar de novo ou enviar o pedido pelo WhatsApp.</p>
      <p>
        <Link className="btn" href="/checkout">VOLTAR AO CHECKOUT</Link>
      </p>
    </div>
  );
}
