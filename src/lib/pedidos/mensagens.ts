// Textos dos avisos para a cliente (e-mail automático e botão de WhatsApp no painel).
import { brl } from "../payment/pricing";
import { textoPrazo } from "../frete/regras";
import type { PedidoSalvo } from "./tipos";

export type TipoAviso = "recebido" | "pago" | "enviado";
export const linkRastreio = (codigo: string) => `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(codigo)}`;

const primeiroNome = (p: PedidoSalvo) => (p.pedido.cliente.n || "").trim().split(/\s+/)[0] || "";

// Qual aviso combina com a situação atual do pedido.
export function avisoDaSituacao(p: PedidoSalvo): TipoAviso | null {
  if (p.situacao === "aguardando") return "recebido";
  if (p.situacao === "pago" || p.situacao === "separacao") return "pago";
  if (p.situacao === "enviado") return "enviado";
  return null;
}

export function textoAviso(tipo: TipoAviso, p: PedidoSalvo): { assunto: string; linhas: string[] } {
  const ola = `Olá${primeiroNome(p) ? `, ${primeiroNome(p)}` : ""}!`;
  const pecas = p.pedido.itens.map((i) => `• ${i.q}x ${i.nome} (${i.cor}, tam. ${i.tam})`);
  const ped = p.pedido;
  if (tipo === "recebido")
    return {
      assunto: `Recebemos o seu pedido ${p.id} · Tramisse`,
      linhas: [
        ola,
        `Recebemos o seu pedido ${p.id} na Tramisse. Obrigada pela escolha!`,
        "",
        ...pecas,
        `Total: ${brl(ped.total)}`,
        "",
        ped.pagamento === "pix"
          ? "Assim que confirmarmos o Pix, avisamos por aqui. Se ainda não enviou o comprovante, mande para o nosso WhatsApp."
          : "Assim que o pagamento for confirmado, avisamos por aqui.",
      ],
    };
  if (tipo === "pago")
    return {
      assunto: `Pagamento confirmado · pedido ${p.id} · Tramisse`,
      linhas: [
        ola,
        `O pagamento do seu pedido ${p.id} foi confirmado. Já estamos separando as suas peças com todo o cuidado.`,
        "",
        ...pecas,
        "",
        ped.entrega === "correios" && ped.frete
          ? `Ele vai pelos Correios (${ped.frete.nome}, ${textoPrazo(ped.frete.prazo)}). Mandamos o código de rastreio assim que for postado.`
          : ped.entrega === "retirada"
            ? "Vamos combinar a retirada com você pelo WhatsApp."
            : "Vamos combinar a entrega com você pelo WhatsApp.",
      ],
    };
  return {
    assunto: `Seu pedido ${p.id} foi enviado · Tramisse`,
    linhas: [
      ola,
      `O seu pedido ${p.id} já está a caminho!`,
      ...(p.rastreio ? ["", `Código de rastreio: ${p.rastreio}`, `Acompanhe: ${linkRastreio(p.rastreio)}`] : []),
      "",
      "Esperamos que você ame as suas peças. Qualquer dúvida, é só chamar a gente no WhatsApp.",
    ],
  };
}
