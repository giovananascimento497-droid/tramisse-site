import { NextResponse } from "next/server";
import { verificarToken } from "@/lib/payment/mercadopago";

// Diagnóstico da configuração do Mercado Pago (abrir /api/pagamento/status no navegador).
// Nunca mostra o token: só se está configurado, o tipo e se o Mercado Pago o aceita.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await verificarToken(), { headers: { "Cache-Control": "no-store" } });
}
