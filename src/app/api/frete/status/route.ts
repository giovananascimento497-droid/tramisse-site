import { NextResponse } from "next/server";
import { porId, PRODS } from "@/lib/catalog";
import { cotarFrete, melhorEnvioAtivo } from "@/lib/frete/melhorenvio";

// Diagnóstico do frete (abrir /api/frete/status no navegador). Nunca mostra o token:
// só se está configurado e uma cotação de teste (uma peça de Belém para São Paulo).
export const dynamic = "force-dynamic";

export async function GET() {
  const h = { "Cache-Control": "no-store" };
  if (!melhorEnvioAtivo())
    return NextResponse.json({ configurado: false, mensagem: "MELHORENVIO_TOKEN não está configurado no servidor (ou o deploy foi feito antes de criar a variável)." }, { headers: h });
  const p = PRODS.find((x) => !x.emBreve) ?? porId(PRODS[0].id)!;
  try {
    const opcoes = await cotarFrete("01310100", [{ p, q: 1 }], p.preco);
    return NextResponse.json(
      {
        configurado: true,
        ambiente: process.env.MELHORENVIO_AMBIENTE === "sandbox" ? "teste (sandbox)" : "produção",
        aceito: true,
        mensagem: opcoes.length ? "Token aceito: cotação de teste feita." : "Token aceito, mas nenhum serviço retornou preço.",
        teste: `1 ${p.nome} de Belém para São Paulo (CEP 01310-100)`,
        opcoes: opcoes.map((o) => ({ servico: o.nome, valor: o.valor, prazo: `${o.prazo} dias úteis` })),
      },
      { headers: h },
    );
  } catch (e) {
    return NextResponse.json(
      {
        configurado: true,
        aceito: false,
        mensagem: e instanceof Error ? e.message : "erro",
        dica: "401 = token errado, vencido ou de outro ambiente (sandbox x produção). 403 = faltou a permissão shipping-calculate no token.",
      },
      { headers: h },
    );
  }
}
