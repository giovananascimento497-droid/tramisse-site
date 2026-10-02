// Login do painel (SÓ SERVIDOR). Senha em ADMIN_SENHA (Netlify → Environment variables).
// A sessão é um cookie assinado (HMAC) que vale 12 horas; trocar a senha derruba as sessões.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "tadm";
const DURACAO = 12 * 60 * 60 * 1000;

const senha = () => (process.env.ADMIN_SENHA || "").trim();
export const adminConfigurado = () => senha().length >= 8;
const segredo = () => createHash("sha256").update(`tramisse-admin:${senha()}:${process.env.GITHUB_TOKEN || ""}`).digest();

const igual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const assinar = (s: string) => createHmac("sha256", segredo()).update(s).digest("hex");

export function senhaCorreta(tentativa: string) {
  if (!adminConfigurado()) return false;
  const h = (s: string) => createHash("sha256").update(s).digest("hex");
  return igual(h(tentativa), h(senha()));
}

export function novaSessao() {
  const ate = String(Date.now() + DURACAO);
  return { valor: `${ate}.${assinar(ate)}`, maxAge: DURACAO / 1000 };
}

export async function logado() {
  if (!adminConfigurado()) return false;
  const v = (await cookies()).get(COOKIE)?.value || "";
  const [ate, assinatura] = v.split(".");
  if (!ate || !assinatura || Number(ate) < Date.now()) return false;
  return igual(assinatura, assinar(ate));
}
