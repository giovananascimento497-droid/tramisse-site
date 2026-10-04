import { NextResponse } from "next/server";
import { baixarEstoque } from "@/lib/admin/catalogo";
import { githubAtivo } from "@/lib/admin/github";
import { consultarPagamento, mercadoPagoAtivo } from "@/lib/payment/mercadopago";
import { atualizarPorMercadoPago } from "@/lib/pedidos/store";

export const dynamic = "force-dynamic";

// Aviso do Mercado Pago (webhook). O conteúdo do aviso não é confiado: o pagamento é
// consultado de novo no Mercado Pago e, se estiver aprovado, o estoque baixa sozinho
// (uma vez só por pagamento) com um commit em data/products.json. O pedido no painel
// também é atualizado.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const corpo = await req.json().catch(() => ({}));
  const tipo = corpo?.type || corpo?.topic || url.searchParams.get("type") || url.searchParams.get("topic");
  const id = String(corpo?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "");
  if (tipo !== "payment" || !/^\d+$/.test(id) || !mercadoPagoAtivo()) return NextResponse.json({ ok: true });
  try {
    const p = await consultarPagamento(id);
    // Situação do pedido no painel (aprovado → Pago).
    const ped = await atualizarPorMercadoPago(p.referencia, { id: p.id, status: p.status }).catch((e) => { console.error(e); return null; });
    if (p.status !== "approved" || !p.estoque || !githubAtivo()) return NextResponse.json({ ok: true, status: p.status });
    // A loja já marcou como pago no painel (estoque baixado por lá): não baixa de novo.
    if (ped?.estoque && ped.estoque.seq > 0) return NextResponse.json({ ok: true, baixou: false });
    const itens = p.estoque.split("|").map((s) => {
      const [i, cor, tam, q] = s.split(":");
      return { id: Number(i), cor, tam, q: Number(q) };
    }).filter((x) => x.id > 0 && x.cor && x.tam && x.q > 0);
    const baixou = itens.length ? await baixarEstoque(p.id, itens) : false;
    return NextResponse.json({ ok: true, baixou });
  } catch (e) {
    console.error(e);
    // Erro: o Mercado Pago tenta avisar de novo mais tarde.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
