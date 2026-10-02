import { NextResponse } from "next/server";
import { exigirLogin } from "@/lib/admin/rota";
import { alterarPedido, apagarPedido, idValido, listarPedidos, SITUACOES, type Situacao } from "@/lib/pedidos/store";

export const dynamic = "force-dynamic";

const falha = (e: unknown, acao: string) => {
  console.error(e);
  return NextResponse.json({ erro: `Não foi possível ${acao} agora. [${e instanceof Error ? e.message : "erro"}]` }, { status: 502 });
};

// Lista os pedidos (mais novos primeiro).
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    return NextResponse.json({ pedidos: await listarPedidos() });
  } catch (e) {
    return falha(e, "carregar os pedidos");
  }
}

// Muda a situação, o código de rastreio ou a observação de um pedido.
export async function PATCH(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  if (!d || !idValido(d.id)) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const m: { situacao?: Situacao; rastreio?: string; obs?: string } = {};
  if (d.situacao !== undefined) {
    if (!SITUACOES.includes(d.situacao)) return NextResponse.json({ erro: "Situação inválida." }, { status: 400 });
    m.situacao = d.situacao;
  }
  if (typeof d.rastreio === "string") m.rastreio = d.rastreio.trim().slice(0, 60);
  if (typeof d.obs === "string") m.obs = d.obs.trim().slice(0, 2000);
  try {
    const p = await alterarPedido(d.id, () => m);
    if (!p) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    return NextResponse.json({ pedido: p });
  } catch (e) {
    return falha(e, "salvar o pedido");
  }
}

export async function DELETE(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const id = new URL(req.url).searchParams.get("id");
  if (!idValido(id)) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  try {
    await apagarPedido(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return falha(e, "apagar o pedido");
  }
}
