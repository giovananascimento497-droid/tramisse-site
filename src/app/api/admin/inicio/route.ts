import { NextResponse } from "next/server";
import { ARQUIVO_NOVO, lerInicio, publicarInicio } from "@/lib/admin/inicio";
import { exigirLogin } from "@/lib/admin/rota";

export const dynamic = "force-dynamic";

// Imagens da home (imagem de início, peças do banner e fotos das categorias), versão mais nova.
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    return NextResponse.json({ inicio: await lerInicio() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: `Não foi possível ler as imagens da home. [${e instanceof Error ? e.message : "erro"}]` }, { status: 502 });
  }
}

// Publica (um commit; a Netlify atualiza o site em ~3 minutos).
export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  if (!d?.inicio) return NextResponse.json({ erro: "Nada para publicar." }, { status: 400 });
  const f = d.foto;
  const foto = f && /^\/assets\/inicio\/[a-z0-9-]+\.jpg$/.test(String(f.caminho)) && /^[0-9a-f]{40}$/.test(String(f.blob)) ? { caminho: String(f.caminho), blob: String(f.blob) } : null;
  try {
    const novos = (Array.isArray(d.novos) ? d.novos : [])
      .filter((n: { caminho?: string; blob?: string }) => ARQUIVO_NOVO.test(String(n?.caminho)) && /^[0-9a-f]{40}$/.test(String(n?.blob)))
      .map((n: { caminho: string; blob: string }) => ({ caminho: String(n.caminho), blob: String(n.blob) }))
      .slice(0, 30);
    await publicarInicio(d.inicio, foto, novos);
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
