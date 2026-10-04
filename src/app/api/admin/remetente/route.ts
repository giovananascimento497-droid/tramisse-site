import { NextResponse } from "next/server";
import { exigirLogin } from "@/lib/admin/rota";
import { CFG } from "@/lib/config";
import { gravarRemetente, lerRemetente, limparRemetente } from "@/lib/pedidos/ajustes";

export const dynamic = "force-dynamic";

// Dados de quem envia (para a etiqueta dos Correios). Guardados no Netlify Blobs, nunca no GitHub.
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    const r = await lerRemetente();
    // Primeira vez: sugere o CNPJ e o CEP de origem que já estão na configuração.
    return NextResponse.json({ remetente: r, sugestao: { documento: CFG.empresa?.cnpj ?? "", cep: CFG.entrega.correios.cepOrigem, nome: "Tramisse" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível ler os dados de envio." }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const r = limparRemetente(await req.json().catch(() => null));
  if ("erro" in r) return NextResponse.json({ erro: r.erro }, { status: 400 });
  try {
    await gravarRemetente(r);
    return NextResponse.json({ remetente: r });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível salvar os dados de envio." }, { status: 502 });
  }
}
