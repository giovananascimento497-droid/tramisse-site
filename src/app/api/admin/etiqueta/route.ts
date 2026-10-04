import { NextResponse } from "next/server";
import { exigirLogin } from "@/lib/admin/rota";
import { consultarEtiqueta, gerarEtiqueta, pagarEtiqueta, descartarEtiqueta, linkEtiqueta, prepararEtiqueta } from "@/lib/frete/etiqueta";
import { melhorEnvioAtivo } from "@/lib/frete/melhorenvio";
import { lerRemetente } from "@/lib/pedidos/ajustes";
import { alterarPedido, idValido, lerPedido } from "@/lib/pedidos/store";

export const dynamic = "force-dynamic";

// Etiqueta dos Correios de um pedido: preparar (mostra o preço), comprar (gera), imprimir,
// rastreio e descartar (só antes de comprar).
export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  if (!d || !idValido(d.id)) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  if (!melhorEnvioAtivo()) return NextResponse.json({ erro: "Melhor Envio não configurado (MELHORENVIO_TOKEN)." }, { status: 503 });
  try {
    const p = await lerPedido(d.id);
    if (!p) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    const et = p.etiqueta;
    switch (d.acao) {
      case "preparar": {
        if (et) return NextResponse.json({ pedido: p });
        const rem = await lerRemetente();
        if (!rem) return NextResponse.json({ erro: "Preencha primeiro os dados de quem envia." }, { status: 400 });
        const r = await prepararEtiqueta(p, rem);
        const novo = await alterarPedido(p.id, () => ({ etiqueta: { id: r.id, servico: p.pedido.frete!.servico, preco: r.preco, status: "carrinho", protocolo: r.protocolo } }));
        return NextResponse.json({ pedido: novo });
      }
      case "comprar": {
        if (!et) return NextResponse.json({ erro: "Prepare a etiqueta primeiro." }, { status: 400 });
        // Cada passo fica registrado: se der erro no meio, tentar de novo continua de onde parou (não paga duas vezes).
        if (et.status === "carrinho") {
          await pagarEtiqueta(et.id);
          await alterarPedido(p.id, () => ({ etiqueta: { ...et, status: "paga" } }));
        }
        if (et.status !== "gerada") await gerarEtiqueta(et.id);
        const c = await consultarEtiqueta(et.id).catch(() => ({ rastreio: "" }));
        const novo = await alterarPedido(p.id, () => ({ etiqueta: { ...et, status: "gerada" }, ...(c.rastreio ? { rastreio: c.rastreio } : {}) }));
        return NextResponse.json({ pedido: novo });
      }
      case "imprimir": {
        if (et?.status !== "gerada") return NextResponse.json({ erro: "A etiqueta ainda não foi comprada." }, { status: 400 });
        return NextResponse.json({ url: await linkEtiqueta(et.id) });
      }
      case "rastreio": {
        if (!et) return NextResponse.json({ erro: "Sem etiqueta." }, { status: 400 });
        const c = await consultarEtiqueta(et.id);
        const novo = c.rastreio ? await alterarPedido(p.id, () => ({ rastreio: c.rastreio })) : p;
        return NextResponse.json({ pedido: novo, aviso: c.rastreio ? "" : "O código de rastreio ainda não saiu. Tente de novo mais tarde." });
      }
      case "descartar": {
        if (!et || et.status !== "carrinho") return NextResponse.json({ erro: "Etiqueta já comprada: cancele pelo site do Melhor Envio." }, { status: 400 });
        await descartarEtiqueta(et.id).catch((e) => { if ((e as { status?: number }).status !== 404) throw e; });
        const novo = await alterarPedido(p.id, () => ({ etiqueta: undefined }));
        return NextResponse.json({ pedido: novo });
      }
    }
    return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "erro";
    const saldo = /saldo|balance|insufficient/i.test(msg) ? " Coloque saldo na carteira do Melhor Envio (Pix ou boleto) e tente de novo." : "";
    const permissao = /unauthenticated|unauthorized|403|401|scope|permiss/i.test(msg) ? " O token do Melhor Envio precisa das permissões de etiqueta (veja o README)." : "";
    return NextResponse.json({ erro: `Não foi possível concluir.${saldo}${permissao} [${msg}]` }, { status: 502 });
  }
}
