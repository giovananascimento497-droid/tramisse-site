import { NextResponse } from "next/server";
import { consultarPagamento, mercadoPagoAtivo } from "@/lib/payment/mercadopago";

// Confirma no Mercado Pago a situação real de um pagamento (a página de retorno
// não confia só nos parâmetros da URL, que podem ser alterados).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mercadoPagoAtivo() || !/^\d{1,20}$/.test(id)) return NextResponse.json({ erro: "Consulta inválida." }, { status: 400 });
  try {
    return NextResponse.json(await consultarPagamento(id));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível consultar o pagamento." }, { status: 502 });
  }
}
