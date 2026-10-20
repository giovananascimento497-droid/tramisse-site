// Texto do lembrete de compra não concluída (e-mail automático e WhatsApp do painel).
import type { Carrinho } from "./carrinhos";

export function textoLembrete(c: Carrinho, cupom: string, link: string) {
  const nome = c.nome.split(" ")[0] || "";
  return {
    assunto: "Suas peças continuam esperando por você · Tramisse",
    linhas: [
      `Olá${nome ? `, ${nome}` : ""}!`,
      "Vimos que você separou algumas peças na Tramisse e não finalizou a compra:",
      "",
      ...c.itens.map((i) => `• ${i.q}x ${i.nome} (${i.corNome}, tam. ${i.tam})`),
      "",
      `Para te ajudar a decidir, use o cupom ${cupom} e ganhe 5% de desconto nas peças (não cumulativo com outros cupons).`,
      "As peças são vendidas conforme o estoque; vale garantir a sua.",
    ],
    link,
  };
}
