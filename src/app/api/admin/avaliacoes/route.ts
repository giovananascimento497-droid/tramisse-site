import { NextResponse } from "next/server";
import { exigirLogin } from "@/lib/admin/rota";
import { porId } from "@/lib/catalog";
import { mudarAvaliacao, salvarAvaliacao, todasAvaliacoes } from "@/lib/pedidos/avaliacoes";

export const dynamic = "force-dynamic";

const falha = (e: unknown) => {
  console.error(e);
  return NextResponse.json({ erro: "Não foi possível salvar agora. Tente de novo." }, { status: 502 });
};

// Todas as avaliações (pendentes, aprovadas e recusadas), mais novas primeiro.
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    return NextResponse.json({ avaliacoes: await todasAvaliacoes() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível carregar as avaliações." }, { status: 502 });
  }
}

// A loja cadastra uma avaliação real recebida no WhatsApp/Instagram (já aprovada).
export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  const p = porId(Number(d?.produtoId));
  const nota = Math.round(Number(d?.nota));
  const nome = String(d?.nome ?? "").trim().slice(0, 40);
  if (!p) return NextResponse.json({ erro: "Escolha a peça." }, { status: 400 });
  if (!(nota >= 1 && nota <= 5)) return NextResponse.json({ erro: "Escolha a nota (1 a 5 estrelas)." }, { status: 400 });
  if (!nome) return NextResponse.json({ erro: "Escreva o nome da cliente (ex.: Ana S.)." }, { status: 400 });
  const cidade = String(d?.cidade ?? "").trim().slice(0, 40);
  const tam = String(d?.tam ?? "").trim().toUpperCase().slice(0, 6);
  try {
    const ok = await salvarAvaliacao({
      produtoId: p.id, nota, texto: String(d?.texto ?? "").trim().slice(0, 1000), nome, ...(cidade ? { cidade } : {}), ...(tam ? { tam } : {}),
      origem: "painel", status: "aprovada",
    });
    if (!ok) return NextResponse.json({ erro: "Esta peça já tem avaliações demais." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return falha(e);
  }
}

// Aprova, recusa ou apaga.
export async function PATCH(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  const acao = ["aprovar", "recusar", "apagar"].includes(d?.acao) ? (d.acao as "aprovar" | "recusar" | "apagar") : null;
  if (!acao || !Number(d?.produtoId) || !/^a[a-z0-9]{4,30}$/.test(String(d?.id))) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  try {
    await mudarAvaliacao(Number(d.produtoId), String(d.id), acao);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return falha(e);
  }
}
