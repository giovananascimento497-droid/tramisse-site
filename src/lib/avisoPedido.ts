import { brl } from "./payment/pricing";
import { resumoPedido, textoEntrega } from "./payment/whatsapp";
import type { Pedido } from "./types";

const PAGAMENTO = { pix: "Pix (5% de desconto)", debito: "Cartão de débito", credito: "Cartão de crédito (até 2x sem juros)" } as const;

// Registra o pedido no Netlify Forms (formulário "pedidos", definido em public/__forms.html).
// A Netlify guarda o pedido no painel (Forms) e manda e-mail para o endereço configurado lá.
// Nunca atrapalha a compra: se falhar (ex.: rodando fora da Netlify), segue em silêncio.
export function avisarPedido(p: Pedido, info: { id: string; canal: string; situacao: string; atendente: string }) {
  const c = p.cliente;
  const dados: Record<string, string> = {
    "form-name": "pedidos",
    pedido: info.id,
    canal: info.canal,
    situacao: info.situacao,
    atendente: info.atendente,
    cliente: [c.n, c.sn].filter(Boolean).join(" "),
    email: c.e || "",
    telefone: c.tel || "",
    entrega: textoEntrega(p).split(":")[0],
    endereco: p.entrega === "retirada" ? "" : [c.end, c.num, c.cmp, c.bai, c.cid, c.uf, c.cep].filter(Boolean).join(", ") + (c.dest ? ` (destinatário: ${c.dest})` : ""),
    frete: p.frete ? (p.frete.gratis ? "Grátis" : brl(p.frete.valor)) : "",
    pagamento: PAGAMENTO[p.pagamento],
    total: brl(p.total),
    itens: p.itens.map((i) => `${i.q}x ${i.nome} — ${i.cor}, tam. ${i.tam} — ${brl(i.precoFinal * i.q)}`).join("\n"),
    resumo: resumoPedido(p),
  };
  try {
    fetch("/__forms.html", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(dados).toString(),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
