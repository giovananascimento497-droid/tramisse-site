import { NextResponse } from "next/server";
import { enviarBlob } from "@/lib/admin/github";
import { exigirLogin } from "@/lib/admin/rota";

export const dynamic = "force-dynamic";

// Recebe uma foto (JPEG já reduzido no navegador) e guarda no GitHub até a publicação.
export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  const slug = String(d?.slug || "");
  const base64 = String(d?.base64 || "").replace(/^data:image\/jpeg;base64,/, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({ erro: "Peça inválida." }, { status: 400 });
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length < 1000 || bytes.length > 4_000_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8)
    return NextResponse.json({ erro: "Foto inválida ou grande demais." }, { status: 400 });
  try {
    const blob = await enviarBlob(base64);
    const caminho = `/assets/products/${slug}-${Date.now().toString(36)}.jpg`;
    return NextResponse.json({ caminho, blob });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: `Não foi possível enviar a foto. [${e instanceof Error ? e.message : "erro"}]` }, { status: 502 });
  }
}
