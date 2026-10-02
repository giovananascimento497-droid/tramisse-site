import { NextResponse } from "next/server";
import { porId } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import { cotarFrete, melhorEnvioAtivo } from "@/lib/frete/melhorenvio";
import { calcularTotais, parcelasPedido } from "@/lib/payment/pricing";
import { criarPreferencia, mercadoPagoAtivo } from "@/lib/payment/mercadopago";
import { montarPedido } from "@/lib/payment/pedido";
import { salvarPedido } from "@/lib/pedidos/store";

// Cria o link de pagamento do Mercado Pago para o pedido da sacola.
// O valor é recalculado aqui a partir do catálogo; o navegador só manda o que foi escolhido.
export async function POST(req: Request) {
  if (!mercadoPagoAtivo()) return NextResponse.json({ erro: "Pagamento online indisponível." }, { status: 503 });
  const dados = await req.json().catch(() => null);
  if (!dados) return NextResponse.json({ erro: "Pedido inválido. Confira a sacola." }, { status: 400 });
  // Correios: o frete é cotado de novo aqui (o valor que veio do navegador é ignorado).
  let frete = null;
  if (dados.entrega === "correios") {
    if (!melhorEnvioAtivo()) return NextResponse.json({ erro: "Envio pelos Correios indisponível no momento." }, { status: 503 });
    const linhas = (Array.isArray(dados.bag) ? dados.bag : []).map((l: { id: number; q: number }) => ({ p: porId(Number(l.id)), q: Number(l.q) }));
    if (!linhas.length || linhas.some((l: { p?: unknown }) => !l.p)) return NextResponse.json({ erro: "Pedido inválido. Confira a sacola." }, { status: 400 });
    const t = calcularTotais(CFG, linhas.map((l: { p: { preco: number }; q: number }) => ({ preco: l.p.preco, q: l.q })), null, dados.cupom);
    try {
      const opcoes = await cotarFrete(dados.cliente?.cep || "", linhas, t.subtotal - t.desconto);
      frete = opcoes.find((o) => o.servico === Number(dados.frete?.servico)) ?? null;
    } catch (e) {
      console.error(e);
      return NextResponse.json({ erro: "Não foi possível calcular o frete agora. Tente de novo." }, { status: 502 });
    }
    if (!frete) return NextResponse.json({ erro: "Escolha o frete de novo." }, { status: 400 });
  }
  const pedido = montarPedido({ ...dados, frete });
  if (!pedido) return NextResponse.json({ erro: "Pedido inválido. Confira a sacola." }, { status: 400 });
  // Pix é pago direto na chave da loja (com desconto), não pelo Mercado Pago.
  if (pedido.pagamento === "pix") return NextResponse.json({ erro: "Pix é pago pela chave da loja." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(pedido.cliente.e || "")) return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });

  const referencia = `T${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const origem = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  try {
    const estoque = (dados.bag as { id: number; cor: string; tam: string; q: number }[])
      .map((l) => [Number(l.id), String(l.cor), String(l.tam), Number(l.q)].join(":"))
      .join("|");
    // Parcelas sem juros: parcela mínima e taxa do Mercado Pago coberta pelo pedido (peças pelo valor base + frete).
    const minimo = pedido.itens.reduce((s, i) => s + (porId(i.id)?.precoBase ?? 0) * i.q, 0) + (pedido.frete?.valor ?? 0);
    const maxParcelas = parcelasPedido(CFG, pedido.total, minimo);
    const { url } = await criarPreferencia(pedido, { referencia, origem, maxParcelas, estoque });
    // Registra no painel (aguardando pagamento). Se falhar, a compra segue normalmente.
    const atendente = CFG.atendentes.find((a) => a.nome === dados.atendente)?.nome ?? CFG.atendentes[0].nome;
    await salvarPedido({ id: referencia, canal: "mercadopago", atendente, situacao: "aguardando", pedido }).catch((e) => console.error(e));
    return NextResponse.json({ url, referencia, pedido });
  } catch (e) {
    console.error(e);
    // O motivo dado pelo Mercado Pago vai junto (sem dados secretos) para facilitar o diagnóstico.
    const motivo = e instanceof Error ? e.message : "";
    return NextResponse.json({ erro: `Não foi possível gerar o pagamento agora. Tente de novo ou envie pelo WhatsApp.${motivo ? ` [${motivo}]` : ""}` }, { status: 502 });
  }
}
