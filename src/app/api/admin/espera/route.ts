import { NextResponse } from "next/server";
import { exigirLogin } from "@/lib/admin/rota";
import { listasDeEspera, mudarNaLista } from "@/lib/pedidos/espera";

export const dynamic = "force-dynamic";

// Listas de espera ("Avise-me") de todas as peças.
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    return NextResponse.json({ listas: await listasDeEspera() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível carregar as listas de espera." }, { status: 502 });
  }
}

// Marca alguém como avisada ou tira da lista.
export async function PATCH(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  const acao = d?.acao === "remover" ? "remover" : d?.acao === "avisada" ? "avisada" : null;
  if (!acao || !Number(d?.produtoId) || !/^\d{10,15}$/.test(String(d?.tel))) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  try {
    const l = await mudarNaLista(Number(d.produtoId), String(d.tel), acao);
    return NextResponse.json({ lista: l });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível salvar agora." }, { status: 502 });
  }
}
