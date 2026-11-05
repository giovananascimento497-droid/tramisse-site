import { NextResponse } from "next/server";
import { origemEstranha } from "@/lib/admin/rota";
import { porId } from "@/lib/catalog";
import { avaliacoesDaPeca, chaveValida, nomeCurto, publica, salvarAvaliacao, todasAvaliacoes } from "@/lib/pedidos/avaliacoes";
import { lerPedido, VENDIDO } from "@/lib/pedidos/store";

export const dynamic = "force-dynamic";

// Avaliações aprovadas: de uma peça (?p=<id>) ou as mais recentes da loja (?ultimas=1, para a home).
export async function GET(req: Request) {
  const u = new URL(req.url);
  const cache = { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } };
  try {
    if (u.searchParams.get("ultimas")) {
      const l = (await todasAvaliacoes()).filter((a) => a.status === "aprovada" && a.nota >= 4 && a.texto.length >= 10 && porId(a.produtoId)).slice(0, 8);
      return NextResponse.json({ avaliacoes: l.map(publica) }, cache);
    }
    const id = Number(u.searchParams.get("p"));
    if (!porId(id)) return NextResponse.json({ avaliacoes: [] });
    const l = (await avaliacoesDaPeca(id)).filter((a) => a.status === "aprovada").sort((x, y) => y.criadaEm.localeCompare(x.criadaEm));
    return NextResponse.json({ avaliacoes: l.map(publica) }, cache);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ avaliacoes: [] });
  }
}

// A cliente avalia as peças de um pedido pelo link recebido depois da entrega (fica para aprovação no painel).
export async function POST(req: Request) {
  if (origemEstranha(req)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  const texto = await req.text().catch(() => "");
  if (texto.length > 20000) return NextResponse.json({ erro: "Avaliação grande demais." }, { status: 413 });
  let d: Record<string, unknown> = {};
  try { d = JSON.parse(texto); } catch {}
  const pedidoId = String(d.p ?? "");
  if (!chaveValida(pedidoId, String(d.k ?? ""))) return NextResponse.json({ erro: "Link de avaliação inválido." }, { status: 403 });
  try {
    const ped = await lerPedido(pedidoId);
    if (!ped || !VENDIDO.includes(ped.situacao)) return NextResponse.json({ erro: "Este pedido ainda não pode ser avaliado." }, { status: 400 });
    const nome = String(d.nome ?? "").trim().slice(0, 40) || nomeCurto(ped.pedido.cliente.n || "", ped.pedido.cliente.sn || "");
    const cidade = String(d.cidade ?? "").trim().slice(0, 40);
    const itens = (Array.isArray(d.itens) ? d.itens : []).slice(0, 20) as { produtoId?: unknown; nota?: unknown; texto?: unknown }[];
    let n = 0;
    for (const it of itens) {
      const item = ped.pedido.itens.find((i) => i.id === Number(it.produtoId));
      const nota = Math.round(Number(it.nota));
      if (!item || !(nota >= 1 && nota <= 5)) continue;
      await salvarAvaliacao({
        produtoId: item.id, nota, texto: String(it.texto ?? "").trim().slice(0, 1000), nome, ...(cidade ? { cidade } : {}), tam: item.tam,
        origem: "site", pedidoId, status: "pendente",
      });
      n++;
    }
    if (!n) return NextResponse.json({ erro: "Dê uma nota (de 1 a 5 estrelas) para pelo menos uma peça." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível enviar agora. Tente de novo." }, { status: 502 });
  }
}
