// Função agendada da Netlify (de hora em hora): pede ao site para mandar os lembretes de compra
// não concluída (rota /api/carrinho/lembretes). A chave é derivada da ADMIN_SENHA, como no site.
import { createHash } from "node:crypto";

export default async () => {
  const senha = (process.env.ADMIN_SENHA || "").trim();
  const site = process.env.URL || "https://tramisse.com.br";
  if (!senha) return new Response("sem ADMIN_SENHA", { status: 200 });
  const chave = createHash("sha256").update(`lembrete:${senha}`).digest("hex");
  const r = await fetch(`${site}/api/carrinho/lembretes`, { method: "POST", headers: { "x-tramisse-agendamento": chave } });
  return new Response(await r.text(), { status: 200 });
};

export const config = { schedule: "@hourly" };
