import { NextResponse } from "next/server";
import { porId } from "@/lib/catalog";
import { chaveValida, nomeCurto } from "@/lib/pedidos/avaliacoes";
import { lerPedido, VENDIDO } from "@/lib/pedidos/store";

export const dynamic = "force-dynamic";

// Peças do pedido para a página de avaliação (só com o link certo; sem dados pessoais além do nome curto).
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = String(u.searchParams.get("p") ?? "");
  if (!chaveValida(id, String(u.searchParams.get("k") ?? ""))) return NextResponse.json({ erro: "Link de avaliação inválido." }, { status: 403 });
  try {
    const ped = await lerPedido(id);
    if (!ped || !VENDIDO.includes(ped.situacao)) return NextResponse.json({ erro: "Este pedido ainda não pode ser avaliado." }, { status: 400 });
    const vistos = new Set<number>();
    const itens = ped.pedido.itens.filter((i) => !vistos.has(i.id) && vistos.add(i.id)).map((i) => {
      const p = porId(i.id);
      return { produtoId: i.id, nome: i.nome, cor: i.cor, tam: i.tam, imagem: p?.imagens[0] ?? "", slug: p?.slug ?? "" };
    });
    return NextResponse.json({ nome: nomeCurto(ped.pedido.cliente.n || "", ped.pedido.cliente.sn || ""), itens });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível abrir agora. Tente de novo." }, { status: 502 });
  }
}
