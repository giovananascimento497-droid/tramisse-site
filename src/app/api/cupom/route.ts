import { NextResponse } from "next/server";
import { origemEstranha } from "@/lib/admin/rota";
import { CFG } from "@/lib/config";
import { acharCupom } from "@/lib/payment/pricing";
import { jaComprou } from "@/lib/pedidos/clientes";

export const dynamic = "force-dynamic";

// Confere um cupom só para clientes (recompra) com o e-mail/telefone da identificação.
export async function POST(req: Request) {
  if (origemEstranha(req)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  const d = await req.json().catch(() => null);
  const c = acharCupom(CFG, d?.codigo);
  if (!c) return NextResponse.json({ erro: "Cupom inválido." }, { status: 400 });
  if (!c.somenteClientes) return NextResponse.json({ ok: true });
  try {
    if (await jaComprou(String(d?.e ?? ""), String(d?.tel ?? ""))) return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível conferir o cupom agora." }, { status: 502 });
  }
  return NextResponse.json({ erro: `O cupom ${c.codigo} é para quem já comprou no site. Não encontramos compra com este e-mail ou telefone.` }, { status: 403 });
}
