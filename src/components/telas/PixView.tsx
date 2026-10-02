"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { CFG } from "@/lib/config";
import { brl } from "@/lib/payment/pricing";
import { formataCnpj } from "@/lib/payment/pix";
import { useLoja } from "@/store/Store";

const PIX = CFG.pagamento.pix;

// Tela do Pix: QR Code + "copia e cola" com o valor do pedido (já com o desconto do Pix),
// e o envio do pedido/comprovante para a atendente pelo WhatsApp.
export function PixView({ codigo, total, at, wa, pedidoId }: { codigo: string; total: number; at: string; wa: string; pedidoId: string }) {
  const { toast } = useLoja();
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(codigo, { margin: 1, width: 440, color: { dark: "#1E1D1B", light: "#FFFFFF" } }).then(setQr).catch(() => setQr(""));
  }, [codigo]);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(codigo); toast("Código Pix copiado."); } catch { toast("Não foi possível copiar. Selecione o código e copie."); }
  };
  return (
    <div className="pg">
      <h1>Pague com Pix</h1>
      <p>
        Pedido nº {pedidoId} · <b style={{ fontWeight: 500 }}>{brl(total)}</b> (já com {Math.round(CFG.pagamento.descontoPix * 100)}% de desconto nas peças). Abra o app do seu banco,
        escolha Pix e leia o QR Code ou use o código copia e cola.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {qr ? <img src={qr} alt="QR Code Pix" width={220} height={220} style={{ display: "block", margin: "24px 0" }} /> : null}
      <div className="cp">
        <input readOnly value={codigo} aria-label="Pix copia e cola" onFocus={(e) => e.currentTarget.select()} />
        <button className="btn o" onClick={copiar} style={{ padding: "0 20px" }}>COPIAR</button>
      </div>
      <p style={{ fontSize: 14 }}>
        Chave Pix: {formataCnpj(PIX.chave)}
        {PIX.titular ? <><br />Favorecida: {PIX.titular}{PIX.banco ? ` (${PIX.banco})` : ""}</> : null}
      </p>
      <p>Depois de pagar, envie o pedido e o comprovante para a {at} pelo WhatsApp: o atendimento confirma e combina a entrega ou a retirada com você.</p>
      <p>
        <a className="btn" href={wa} target="_blank" rel="noopener">ENVIAR PEDIDO E COMPROVANTE</a>{" "}
        <Link className="btn o" href="/">VOLTAR À HOME</Link>
      </p>
    </div>
  );
}
