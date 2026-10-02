// Proteções comuns das rotas do painel (SÓ SERVIDOR).
import { NextResponse } from "next/server";
import { logado } from "./auth";

const host = (u?: string | null) => {
  if (!u) return "";
  try {
    return new URL(u.includes("://") ? u : `https://${u}`).host.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

// Pedido vindo de outro site (proteção contra envio forjado). Na Netlify o endereço
// interno da função é diferente do domínio, então vale qualquer endereço do próprio site.
export function origemEstranha(req: Request) {
  const o = req.headers.get("origin");
  if (!o) return false;
  const permitidos = new Set(
    [
      req.url,
      req.headers.get("host"),
      req.headers.get("x-forwarded-host"),
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.URL, // endereço principal (Netlify)
      process.env.DEPLOY_PRIME_URL,
      process.env.DEPLOY_URL,
      "tramisse.com.br",
    ].map(host).filter(Boolean),
  );
  return !permitidos.has(host(o));
}

export async function exigirLogin(req: Request) {
  if (req.method !== "GET" && origemEstranha(req)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  if (!(await logado())) return NextResponse.json({ erro: "Entre de novo no painel." }, { status: 401 });
  return null;
}
