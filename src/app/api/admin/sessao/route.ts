import { NextResponse } from "next/server";
import { adminConfigurado, COOKIE, logado, novaSessao, senhaCorreta } from "@/lib/admin/auth";
import { githubAtivo } from "@/lib/admin/github";
import { origemEstranha } from "@/lib/admin/rota";

export const dynamic = "force-dynamic";

// Situação do painel: se está configurado e se a pessoa está logada.
export async function GET() {
  return NextResponse.json({ configurado: adminConfigurado(), github: githubAtivo(), logado: await logado() });
}

// Entrar com a senha.
export async function POST(req: Request) {
  if (origemEstranha(req)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  const { senha } = await req.json().catch(() => ({}));
  if (!senhaCorreta(String(senha || ""))) {
    await new Promise((r) => setTimeout(r, 1200)); // atrasa tentativas seguidas
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }
  const s = novaSessao();
  const r = NextResponse.json({ ok: true });
  r.cookies.set(COOKIE, s.valor, { httpOnly: true, secure: new URL(req.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: s.maxAge });
  return r;
}

// Sair.
export async function DELETE() {
  const r = NextResponse.json({ ok: true });
  r.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return r;
}
