import { NextResponse } from "next/server";
import { origemEstranha } from "@/lib/admin/rota";
import { CFG } from "@/lib/config";
import { montarPedido } from "@/lib/payment/pedido";
import { limparCliente, limparFrete } from "@/lib/pedidos/limpar";
import { idValido, salvarPedido } from "@/lib/pedidos/store";

export const dynamic = "force-dynamic";

// Registra no painel um pedido enviado pelo WhatsApp ou pago no Pix (o do Mercado Pago é
// registrado na criação do link). O pedido é remontado a partir do catálogo: preços e
// estoque são conferidos aqui. Não substitui nem altera um pedido já registrado.
export async function POST(req: Request) {
  if (origemEstranha(req)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  const texto = await req.text().catch(() => "");
  if (texto.length > 20000) return NextResponse.json({ erro: "Pedido grande demais." }, { status: 413 });
  let d: Record<string, unknown> | null = null;
  try { d = JSON.parse(texto); } catch {}
  if (!d || !idValido(d.id)) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const canal = d.canal === "pix" ? "pix" : d.canal === "whatsapp" ? "whatsapp" : null;
  if (!canal) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const pedido = montarPedido({
    bag: Array.isArray(d.bag) ? d.bag.slice(0, 50) : [],
    cupom: typeof d.cupom === "string" ? d.cupom : null,
    pagamento: d.pagamento as never,
    entrega: d.entrega as never,
    cliente: limparCliente(d.cliente),
    frete: limparFrete(d.frete),
  });
  if (!pedido || (canal === "pix" && pedido.pagamento !== "pix")) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const atendente = CFG.atendentes.find((a) => a.nome === d.atendente)?.nome ?? CFG.atendentes[0].nome;
  try {
    await salvarPedido({ id: d.id, canal, atendente, situacao: "aguardando", pedido });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível registrar o pedido." }, { status: 502 });
  }
}
