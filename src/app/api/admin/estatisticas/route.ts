import { NextResponse } from "next/server";
import { exigirLogin } from "@/lib/admin/rota";
import { lerEstatisticas } from "@/lib/pedidos/estatisticas";

export const dynamic = "force-dynamic";

// Estatísticas por dia (até 90 dias) para a aba ESTATÍSTICAS do painel.
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const dias = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get("dias")) || 30));
  try {
    return NextResponse.json({ dias: await lerEstatisticas(dias) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: `Não foi possível carregar as estatísticas. [${e instanceof Error ? e.message : "erro"}]` }, { status: 502 });
  }
}
