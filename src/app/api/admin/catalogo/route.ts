import { NextResponse } from "next/server";
import { lerCatalogo, publicar, type Alteracao } from "@/lib/admin/catalogo";
import { exigirLogin } from "@/lib/admin/rota";

export const dynamic = "force-dynamic";

// Catálogo mais novo (direto do GitHub, já com as últimas vendas e alterações).
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    const { catalogo } = await lerCatalogo();
    return NextResponse.json({ catalogo });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: `Não foi possível ler o catálogo. [${e instanceof Error ? e.message : "erro"}]` }, { status: 502 });
  }
}

// Publica as alterações (um commit; a Netlify atualiza o site em ~3 minutos).
export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  const alteracoes: Alteracao[] = Array.isArray(d?.alteracoes) ? d.alteracoes : [];
  const fotos: { caminho: string; blob: string }[] = (Array.isArray(d?.fotos) ? d.fotos : []).filter(
    (f: { caminho?: string; blob?: string }) => /^\/assets\/products\/[a-z0-9-]+\.jpg$/.test(String(f?.caminho)) && /^[0-9a-f]{40}$/.test(String(f?.blob)),
  );
  if (!alteracoes.length) return NextResponse.json({ erro: "Nada para publicar." }, { status: 400 });
  // Fotos usadas nas peças: só as que já existem no site ou as enviadas agora.
  const novas = new Set(fotos.map((f) => f.caminho));
  try {
    const { catalogo } = await lerCatalogo();
    const existentes = new Set(catalogo.produtos.flatMap((p) => p.imagens));
    for (const a of alteracoes)
      for (const i of a.novo?.imagens || [])
        if (!novas.has(i) && !existentes.has(i) && !(a.original?.imagens || []).includes(i))
          return NextResponse.json({ erro: `Foto não encontrada na peça "${a.novo.nome}". Envie a foto de novo.` }, { status: 400 });
    await publicar(alteracoes, fotos.filter((f) => alteracoes.some((a) => a.novo?.imagens?.includes(f.caminho))), "painel");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    const validacao = (e as { validacao?: boolean }).validacao;
    return NextResponse.json(
      { erro: validacao ? (e as Error).message : `Não foi possível publicar agora. [${e instanceof Error ? e.message : "erro"}]` },
      { status: validacao ? 400 : 502 },
    );
  }
}
