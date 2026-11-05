"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { CFG } from "@/lib/config";
import { brl } from "@/lib/payment/pricing";
import { formataCnpj } from "@/lib/payment/pix";
import { useLoja } from "@/store/Store";

const PIX = CFG.pagamento.pix;
export type PixAberto = { codigo: string; qr?: string; total: number; pedidoId: string; mpId?: string; expira?: number };

// Tela do Pix: QR Code + "copia e cola" com o valor do pedido (já com o desconto do Pix).
// Pix automático (mpId): a tela confere o pagamento sozinha e confirma o pedido na hora.
// Sem Pix automático: chave da loja, e a cliente manda o comprovante pelo WhatsApp (wa).
export function PixView({ pix, wa, onPago, onNovo }: { pix: PixAberto; wa?: string; onPago?: () => void; onNovo?: () => void }) {
  const { toast } = useLoja();
  const [qr, setQr] = useState(pix.qr ? `data:image/png;base64,${pix.qr}` : "");
  const [estado, setEstado] = useState<"aguardando" | "pago" | "vencido">("aguardando");
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (pix.qr) return;
    QRCode.toDataURL(pix.codigo, { margin: 1, width: 440, color: { dark: "#1E1D1B", light: "#FFFFFF" } }).then(setQr).catch(() => setQr(""));
  }, [pix.codigo, pix.qr]);

  // Confere no Mercado Pago a cada 5 s se o Pix foi pago.
  useEffect(() => {
    if (!pix.mpId) return;
    let vivo = true;
    const conferir = async () => {
      try {
        const r = await fetch(`/api/pagamento/mercadopago/${encodeURIComponent(pix.mpId!)}`);
        const d = await r.json();
        if (!vivo || !r.ok || d.referencia !== pix.pedidoId) return;
        if (d.status === "approved") { setEstado("pago"); onPago?.(); }
        else if (["cancelled", "rejected", "expired"].includes(d.status)) setEstado("vencido");
      } catch {}
    };
    conferir();
    const t = setInterval(() => { setAgora(Date.now()); conferir(); }, 5000);
    return () => { vivo = false; clearInterval(t); };
  }, [pix.mpId, pix.pedidoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const copiar = async () => {
    try { await navigator.clipboard.writeText(pix.codigo); toast("Código Pix copiado."); } catch { toast("Não foi possível copiar. Selecione o código e copie."); }
  };

  if (estado === "pago")
    return (
      <div className="pg">
        <h1>Pagamento confirmado</h1>
        <p>
          Obrigada! Recebemos o seu Pix de <b style={{ fontWeight: 500 }}>{brl(pix.total)}</b> e o pedido nº {pix.pedidoId} está confirmado.
          {" "}Você recebe as novidades da entrega pelo e-mail e pelo WhatsApp que informou.
        </p>
        <p><Link className="btn" href="/">CONTINUAR COMPRANDO</Link></p>
      </div>
    );

  const restam = pix.expira ? Math.max(0, Math.ceil((pix.expira - agora) / 60000)) : 0;
  if (estado === "vencido" || (pix.mpId && pix.expira && restam === 0))
    return (
      <div className="pg">
        <h1>O Pix venceu</h1>
        <p>O prazo para pagar este Pix (pedido nº {pix.pedidoId}) acabou e nada foi cobrado. Suas peças continuam na sacola: é só gerar um novo Pix.</p>
        <p><button className="btn" onClick={onNovo}>GERAR NOVO PIX</button></p>
      </div>
    );

  return (
    <div className="pg pix">
      <h1>Pague com Pix</h1>
      <p>
        Pedido nº {pix.pedidoId} · <b style={{ fontWeight: 500 }}>{brl(pix.total)}</b>. Abra o app do seu banco, escolha Pix e leia o QR Code
        ou use o código copia e cola.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {qr ? <img src={qr} alt="QR Code Pix" width={220} height={220} style={{ display: "block", margin: "24px 0" }} /> : null}
      <div className="cp">
        <input readOnly value={pix.codigo} aria-label="Pix copia e cola" onFocus={(e) => e.currentTarget.select()} />
        <button className="btn o" onClick={copiar} style={{ padding: "0 20px" }}>COPIAR</button>
      </div>
      {pix.mpId ? (
        <>
          <p className="pix-esp"><span className="pix-pt" aria-hidden="true" /> Aguardando o pagamento… Assim que você pagar, esta tela confirma sozinha (não precisa mandar comprovante).</p>
          <p style={{ fontSize: 13, color: "var(--mut)" }}>
            {restam ? `O código vale por mais ${restam} ${restam === 1 ? "minuto" : "minutos"}. ` : ""}Pagamento processado pelo Mercado Pago.
          </p>
          <p><a href="#" onClick={(e) => { e.preventDefault(); onNovo?.(); }} style={{ textDecoration: "underline", fontSize: 14 }}>← Voltar e mudar o pedido</a></p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 14 }}>
            Chave Pix: {formataCnpj(PIX.chave)}
            {PIX.titular ? <><br />Favorecida: {PIX.titular}{PIX.banco ? ` (${PIX.banco})` : ""}</> : null}
          </p>
          <p>Depois de pagar, envie o comprovante pelo WhatsApp para confirmarmos o seu pedido.</p>
          <p>
            {wa ? <><a className="btn" href={wa} target="_blank" rel="noopener">ENVIAR COMPROVANTE</a>{" "}</> : null}
            <Link className="btn o" href="/">VOLTAR À HOME</Link>
          </p>
        </>
      )}
    </div>
  );
}
