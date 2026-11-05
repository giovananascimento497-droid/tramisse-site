import { NextResponse } from "next/server";
import { ATENDENTE } from "@/lib/config";
import { criarPix, mercadoPagoAtivo } from "@/lib/payment/mercadopago";
import { pedidoDoServidor } from "@/lib/payment/servidor";
import { salvarPedido } from "@/lib/pedidos/store";

// Pix automático: gera a cobrança Pix no Mercado Pago (valor recalculado aqui, já com o desconto
// do Pix). Quando a cliente paga, o aviso do Mercado Pago marca o pedido como "Pago" e baixa o estoque.
export async function POST(req: Request) {
  if (!mercadoPagoAtivo()) return NextResponse.json({ erro: "Pix automático indisponível." }, { status: 503 });
  const r = await pedidoDoServidor(await req.json().catch(() => null));
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: r.status });
  const { pedido, estoque, referencia } = r;
  if (pedido.pagamento !== "pix") return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const origem = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  try {
    const pix = await criarPix(pedido, { referencia, origem, estoque });
    await salvarPedido({ id: referencia, canal: "pix", atendente: ATENDENTE.nome, situacao: "aguardando", pedido, mercadoPago: { id: pix.id, status: pix.status } }).catch((e) => console.error(e));
    return NextResponse.json({ ...pix, referencia, pedido });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível gerar o Pix automático agora." }, { status: 502 });
  }
}
