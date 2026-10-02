import { NextResponse } from "next/server";
import { porId } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import { cotarFrete, melhorEnvioAtivo } from "@/lib/frete/melhorenvio";
import { cepValido, faltaFreteGratis } from "@/lib/frete/regras";
import { calcularTotais } from "@/lib/payment/pricing";

// Cota o frete pelos Correios (Melhor Envio) para as peças e o CEP informados.
// Usado no checkout e no "Calcular frete" da página do produto.
export async function POST(req: Request) {
  if (!melhorEnvioAtivo()) return NextResponse.json({ erro: "Cálculo de frete indisponível no momento." }, { status: 503 });
  const dados = await req.json().catch(() => null);
  if (!dados || !cepValido(dados.cep)) return NextResponse.json({ erro: "CEP inválido." }, { status: 400 });
  const itens: { id: number; q: number }[] = Array.isArray(dados.itens) ? dados.itens : [];
  const linhas = itens.map((i) => ({ p: porId(Number(i.id)), q: Number(i.q) }));
  if (!linhas.length || linhas.some((l) => !l.p || !Number.isInteger(l.q) || l.q < 1 || l.q > 50))
    return NextResponse.json({ erro: "Sacola inválida." }, { status: 400 });
  const ok = linhas as { p: NonNullable<(typeof linhas)[number]["p"]>; q: number }[];
  const t = calcularTotais(CFG, ok.map((l) => ({ preco: l.p.preco, q: l.q })), null, dados.cupom);
  const valorPecas = t.subtotal - t.desconto;
  try {
    const opcoes = await cotarFrete(dados.cep, ok, valorPecas);
    if (!opcoes.length) return NextResponse.json({ erro: "Não há envio pelos Correios para este CEP." }, { status: 422 });
    return NextResponse.json({ opcoes, faltaFreteGratis: faltaFreteGratis(CFG, valorPecas) });
  } catch (e) {
    console.error(e);
    // O motivo dado pelo Melhor Envio vai junto (sem dados secretos) para facilitar o diagnóstico.
    const motivo = e instanceof Error ? e.message : "";
    return NextResponse.json({ erro: `Não foi possível calcular o frete agora. Tente de novo.${motivo ? ` [${motivo}]` : ""}` }, { status: 502 });
  }
}
