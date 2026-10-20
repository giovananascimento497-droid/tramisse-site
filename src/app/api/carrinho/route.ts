import { NextResponse } from "next/server";
import { origemEstranha } from "@/lib/admin/rota";
import { CL, porId } from "@/lib/catalog";
import { alterarCarrinho, idCarrinhoValido, lerCarrinho, salvarCarrinho, type ItemCarrinho } from "@/lib/pedidos/carrinhos";

export const dynamic = "force-dynamic";

// Guarda a sacola de quem se identificou no checkout (para o lembrete de compra não concluída),
// ou marca como concluída ({ acao: "concluido" }).
export async function POST(req: Request) {
  if (origemEstranha(req)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  const texto = await req.text().catch(() => "");
  if (texto.length > 10000) return NextResponse.json({ erro: "Dados inválidos." }, { status: 413 });
  let d: Record<string, unknown> = {};
  try { d = JSON.parse(texto); } catch {}
  if (!idCarrinhoValido(d.id)) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  try {
    if (d.acao === "concluido") {
      await alterarCarrinho(d.id, { concluido: new Date().toISOString() });
      return NextResponse.json({ ok: true });
    }
    const c = (d.cliente && typeof d.cliente === "object" ? d.cliente : {}) as Record<string, unknown>;
    const email = String(c.e ?? "").trim().slice(0, 120);
    const tel = String(c.tel ?? "").replace(/\D/g, "").slice(0, 15);
    const nome = [c.n, c.sn].map((x) => String(x ?? "").trim()).filter(Boolean).join(" ").slice(0, 80);
    if (!/^\S+@\S+\.\S+$/.test(email) && tel.length < 10) return NextResponse.json({ erro: "Sem contato." }, { status: 400 });
    const itens: ItemCarrinho[] = [];
    for (const l of (Array.isArray(d.bag) ? d.bag : []).slice(0, 30)) {
      const p = porId(Number(l?.id));
      const q = Math.min(20, Math.max(1, Math.floor(Number(l?.q) || 1)));
      if (!p || p.emBreve) continue;
      itens.push({ id: p.id, slug: p.slug, nome: p.nome, cor: String(l.cor), corNome: CL[String(l.cor)]?.nome ?? String(l.cor), tam: String(l.tam).slice(0, 6), q, preco: p.preco });
    }
    if (!itens.length) return NextResponse.json({ ok: true });
    const total = Math.round(itens.reduce((a, i) => a + i.preco * i.q, 0) * 100) / 100;
    await salvarCarrinho({ id: d.id, nome, email, tel, itens, total });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível salvar." }, { status: 502 });
  }
}

// Link do lembrete: devolve só a sacola (sem dados pessoais) para refazer a compra.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!idCarrinhoValido(id)) return NextResponse.json({ erro: "Link inválido." }, { status: 400 });
  const c = await lerCarrinho(id).catch(() => null);
  if (!c || c.concluido) return NextResponse.json({ erro: "Esta compra já foi concluída ou o link expirou." }, { status: 404 });
  return NextResponse.json({ bag: c.itens.map((i) => ({ id: i.id, cor: i.cor, tam: i.tam, q: i.q })) });
}
