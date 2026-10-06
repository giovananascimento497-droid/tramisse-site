import { NextResponse } from "next/server";
import { origemEstranha } from "@/lib/admin/rota";
import { esgotado, porId } from "@/lib/catalog";
import { entrarNaLista, soNumeros } from "@/lib/pedidos/espera";

export const dynamic = "force-dynamic";

// "Avise-me": a cliente entra na lista de espera de uma peça Coming Soon ou esgotada.
export async function POST(req: Request) {
  if (origemEstranha(req)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  const texto = await req.text().catch(() => "");
  if (texto.length > 2000) return NextResponse.json({ erro: "Dados inválidos." }, { status: 413 });
  let d: Record<string, unknown> = {};
  try { d = JSON.parse(texto); } catch {}
  const p = porId(Number(d.produtoId));
  const nome = String(d.nome ?? "").trim().slice(0, 80);
  let tel = soNumeros(String(d.tel ?? ""));
  if (tel.length === 10 || tel.length === 11) tel = `55${tel}`;
  const tam = String(d.tam ?? "").trim().toUpperCase().slice(0, 6);
  if (!p || !(p.emBreve || esgotado(p))) return NextResponse.json({ erro: "Esta peça não tem lista de espera." }, { status: 400 });
  if (!nome) return NextResponse.json({ erro: "Escreva o seu nome." }, { status: 400 });
  if (!/^55\d{10,11}$/.test(tel)) return NextResponse.json({ erro: "Escreva o WhatsApp com DDD (ex.: 91 99999-9999)." }, { status: 400 });
  if (d.aceite !== true) return NextResponse.json({ erro: "Marque que aceita receber o aviso pelo WhatsApp." }, { status: 400 });
  try {
    const ok = await entrarNaLista(p.id, nome, tel, tam || undefined);
    if (!ok) return NextResponse.json({ erro: "A lista desta peça está cheia. Fale com a gente no WhatsApp." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível entrar na lista agora. Tente de novo ou fale com a gente no WhatsApp." }, { status: 502 });
  }
}
