import { NextResponse } from "next/server";
import { porId } from "@/lib/catalog";
import { ATENDENTE, CFG } from "@/lib/config";
import { parcelasPedido } from "@/lib/payment/pricing";
import { criarPreferencia, mercadoPagoAtivo } from "@/lib/payment/mercadopago";
import { pedidoDoServidor } from "@/lib/payment/servidor";
import { salvarPedido } from "@/lib/pedidos/store";

// Cria o link de pagamento do Mercado Pago (cartão) para o pedido da sacola.
// O valor é recalculado aqui a partir do catálogo; o navegador só manda o que foi escolhido.
export async function POST(req: Request) {
  if (!mercadoPagoAtivo()) return NextResponse.json({ erro: "Pagamento online indisponível." }, { status: 503 });
  const r = await pedidoDoServidor(await req.json().catch(() => null));
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: r.status });
  const { pedido, estoque, referencia } = r;
  // Pix tem cobrança própria (api/pagamento/pix).
  if (pedido.pagamento === "pix") return NextResponse.json({ erro: "Pix é pago pelo QR Code do site." }, { status: 400 });
  const origem = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  try {
    // Parcelas sem juros: parcela mínima e taxa do Mercado Pago coberta pelo pedido (peças pelo valor base + frete).
    const minimo = pedido.itens.reduce((s, i) => s + (porId(i.id)?.precoBase ?? 0) * i.q, 0) + (pedido.frete?.valor ?? 0);
    const maxParcelas = parcelasPedido(CFG, pedido.total, minimo);
    const { url } = await criarPreferencia(pedido, { referencia, origem, maxParcelas, estoque });
    // Registra no painel (aguardando pagamento). Se falhar, a compra segue normalmente.
    await salvarPedido({ id: referencia, canal: "mercadopago", atendente: ATENDENTE.nome, situacao: "aguardando", pedido }).catch((e) => console.error(e));
    return NextResponse.json({ url, referencia, pedido });
  } catch (e) {
    console.error(e);
    // O motivo dado pelo Mercado Pago vai junto (sem dados secretos) para facilitar o diagnóstico.
    const motivo = e instanceof Error ? e.message : "";
    return NextResponse.json({ erro: `Não foi possível gerar o pagamento agora. Tente de novo.${motivo ? ` [${motivo}]` : ""}` }, { status: 502 });
  }
}
