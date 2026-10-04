// E-mails para a cliente sobre o pedido (SÓ SERVIDOR), pelo Resend (resend.com).
// Variáveis na Netlify: RESEND_API_KEY e EMAIL_REMETENTE (ex.: "Tramisse <pedidos@tramisse.com.br>",
// com o domínio verificado no Resend). Opcional: EMAIL_RESPOSTA (para onde vão as respostas).
// Sem essas variáveis, nada é enviado (o resto funciona normalmente).
import { CFG } from "./config";
import { linkRastreio, textoAviso, type TipoAviso } from "./pedidos/mensagens";
import type { PedidoSalvo } from "./pedidos/tipos";

const chave = () => (process.env.RESEND_API_KEY || "").trim();
const remetente = () => (process.env.EMAIL_REMETENTE || "").trim();
export const emailAtivo = () => Boolean(chave() && remetente());

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function html(linhas: string[], rastreio?: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://tramisse.com.br";
  const corpo = linhas
    .map((l) => (l ? `<p style="margin:0 0 10px">${esc(l).replace(/(https:\/\/\S+)/g, '<a href="$1" style="color:#1E1D1B">$1</a>')}</p>` : '<div style="height:8px"></div>'))
    .join("");
  const botao = rastreio
    ? `<p style="margin:20px 0"><a href="${esc(linkRastreio(rastreio))}" style="display:inline-block;background:#1E1D1B;color:#F7F5F1;padding:14px 28px;text-decoration:none;letter-spacing:.16em;font-size:12px">ACOMPANHAR ENTREGA</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#EFE8DA;font-family:Helvetica,Arial,sans-serif;color:#1E1D1B">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#EFE8DA;padding:32px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#F7F5F1;padding:36px 32px;font-size:15px;line-height:1.6">
<tr><td style="text-align:center;letter-spacing:.5em;font-size:20px;padding-bottom:28px">TRAMISSE</td></tr>
<tr><td>${corpo}${botao}</td></tr>
<tr><td style="border-top:1px solid #DDD6CA;padding-top:18px;font-size:12px;color:#77726B">${esc(CFG.assinatura)}<br>
<a href="${esc(site)}" style="color:#77726B">${esc(site.replace(/^https?:\/\//, ""))}</a> · Instagram @tramissebrasil</td></tr>
</table></td></tr></table></body></html>`;
}

export async function enviarEmail(para: string, assunto: string, linhas: string[], rastreio?: string) {
  const r = await fetch((process.env.RESEND_API_URL || "https://api.resend.com") + "/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: remetente(),
      to: [para],
      subject: assunto,
      html: html(linhas, rastreio),
      text: linhas.join("\n"),
      ...(process.env.EMAIL_RESPOSTA ? { reply_to: process.env.EMAIL_RESPOSTA } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
}

// Qual e-mail mandar quando o pedido é criado (antes = null) ou muda de situação.
export function avisoParaMudanca(antes: PedidoSalvo | null, novo: PedidoSalvo): TipoAviso | null {
  let t: TipoAviso | null = null;
  // Cartão: só avisa quando o pagamento é aprovado (quem desiste no Mercado Pago não recebe e-mail).
  if (!antes) t = novo.canal === "mercadopago" ? null : "recebido";
  else if (antes.situacao !== novo.situacao) {
    if (["pago", "separacao"].includes(novo.situacao) && ["aguardando", "cancelado"].includes(antes.situacao)) t = "pago";
    else if (novo.situacao === "enviado") t = "enviado";
  }
  return t && !novo.avisos?.includes(t) ? t : null;
}

// Manda o e-mail (se configurado e se a cliente informou e-mail). Retorna o tipo enviado.
export async function avisarCliente(antes: PedidoSalvo | null, novo: PedidoSalvo): Promise<TipoAviso | null> {
  const para = novo.pedido.cliente.e || "";
  const t = avisoParaMudanca(antes, novo);
  if (!t || !emailAtivo() || !/^\S+@\S+\.\S+$/.test(para)) return null;
  const { assunto, linhas } = textoAviso(t, novo);
  await enviarEmail(para, assunto, linhas, t === "enviado" ? novo.rastreio : undefined);
  return t;
}
