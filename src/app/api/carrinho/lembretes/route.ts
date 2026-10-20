import { NextResponse } from "next/server";
import { CFG } from "@/lib/config";
import { emailAtivo, enviarEmail } from "@/lib/email";
import { alterarCarrinho, apagarCarrinho, chaveAgendamento, listarCarrinhos } from "@/lib/pedidos/carrinhos";
import { textoLembrete } from "@/lib/pedidos/lembrete";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 26;

// Roda de hora em hora: manda o e-mail com cupom para compras não concluídas há mais de
// `recuperacao.horas` (até 3 dias) e apaga carrinhos com mais de 30 dias.
export async function POST(req: Request) {
  const chave = chaveAgendamento();
  if (!chave || req.headers.get("x-tramisse-agendamento") !== chave) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  const r = CFG.recuperacao;
  if (!r?.ativo) return NextResponse.json({ ok: true, enviados: 0 });
  const agora = Date.now();
  let enviados = 0;
  for (const c of await listarCarrinhos()) {
    const idade = agora - new Date(c.atualizadoEm).getTime();
    if (idade > 30 * 86400000) { await apagarCarrinho(c.id).catch(() => {}); continue; }
    if (c.concluido || c.semLembrete || c.lembreteEmail || !emailAtivo()) continue;
    if (idade < r.horas * 3600000 || idade > 3 * 86400000 || !/^\S+@\S+\.\S+$/.test(c.email)) continue;
    const t = textoLembrete(c, r.cupom, `${SITE}/checkout?carrinho=${c.id}`);
    try {
      await enviarEmail(c.email, t.assunto, t.linhas, undefined, { texto: "FINALIZAR MINHA COMPRA", url: t.link },
        `Não quer receber lembretes desta compra? <a href="${SITE}/api/carrinho/sair?id=${c.id}" style="color:#77726B">Clique aqui</a>.`);
      await alterarCarrinho(c.id, { lembreteEmail: new Date().toISOString() });
      enviados++;
    } catch (e) {
      console.error(e);
    }
    if (enviados >= 40) break;
  }
  return NextResponse.json({ ok: true, enviados });
}
