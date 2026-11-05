import { NextResponse } from "next/server";
import { lerCupons, limparCupons, publicarCupons, vendasPorCupom } from "@/lib/admin/cupons";
import { exigirLogin } from "@/lib/admin/rota";

export const dynamic = "force-dynamic";

// Cupons (versão mais nova do GitHub) e as vendas de cada um.
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    const [c, vendas] = await Promise.all([lerCupons(), vendasPorCupom().catch((e) => { console.error(e); return {}; })]);
    return NextResponse.json({ ...c, vendas });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: `Não foi possível ler os cupons. [${e instanceof Error ? e.message : "erro"}]` }, { status: 502 });
  }
}

// Publica a lista inteira (um commit; o site atualiza em ~3 minutos).
export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    const { recuperacao } = await lerCupons();
    const cupons = limparCupons((await req.json().catch(() => null))?.cupons, recuperacao);
    await publicarCupons(cupons);
    return NextResponse.json({ ok: true, cupons });
  } catch (e) {
    console.error(e);
    const validacao = (e as { validacao?: boolean }).validacao;
    return NextResponse.json(
      { erro: validacao ? (e as Error).message : `Não foi possível publicar agora. [${e instanceof Error ? e.message : "erro"}]` },
      { status: validacao ? 400 : 502 },
    );
  }
}
