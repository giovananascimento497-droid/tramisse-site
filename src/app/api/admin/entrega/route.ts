import { NextResponse } from "next/server";
import { lerBelem, limparBelem, publicarBelem } from "@/lib/admin/entrega";
import { exigirLogin } from "@/lib/admin/rota";

export const dynamic = "force-dynamic";

// Entrega em Belém por bairro (versão mais nova do GitHub).
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    return NextResponse.json({ belem: await lerBelem() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: `Não foi possível ler a entrega. [${e instanceof Error ? e.message : "erro"}]` }, { status: 502 });
  }
}

// Publica (um commit; o site atualiza em ~3 minutos).
export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    const b = limparBelem((await req.json().catch(() => null))?.belem);
    await publicarBelem(b);
    return NextResponse.json({ ok: true, belem: b });
  } catch (e) {
    console.error(e);
    const validacao = (e as { validacao?: boolean }).validacao;
    return NextResponse.json(
      { erro: validacao ? (e as Error).message : `Não foi possível publicar agora. [${e instanceof Error ? e.message : "erro"}]` },
      { status: validacao ? 400 : 502 },
    );
  }
}
