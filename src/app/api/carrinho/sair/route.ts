import { alterarCarrinho, idCarrinhoValido } from "@/lib/pedidos/carrinhos";

export const dynamic = "force-dynamic";

// "Não quero receber lembretes" (link no rodapé do e-mail).
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (idCarrinhoValido(id)) await alterarCarrinho(id, { semLembrete: true }).catch(() => null);
  return new Response(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tramisse</title>
<body style="margin:0;background:#F7F5F1;font-family:Helvetica,Arial,sans-serif;color:#1E1D1B;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px">
<div><p style="letter-spacing:.5em">TRAMISSE</p><p>Pronto. Você não vai mais receber lembretes desta compra.</p><p><a href="/" style="color:#1E1D1B">Voltar ao site</a></p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
