// Proteções comuns das rotas do painel (SÓ SERVIDOR).
import { NextResponse } from "next/server";
import { logado } from "./auth";

// Pedido vindo de outro site (proteção contra envio forjado).
export function origemEstranha(req: Request) {
  const o = req.headers.get("origin");
  return Boolean(o && new URL(o).host !== new URL(req.url).host && o !== process.env.NEXT_PUBLIC_SITE_URL);
}

export async function exigirLogin(req: Request) {
  if (req.method !== "GET" && origemEstranha(req)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  if (!(await logado())) return NextResponse.json({ erro: "Entre de novo no painel." }, { status: 401 });
  return null;
}
