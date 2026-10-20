import { NextResponse } from "next/server";
import { exigirLogin } from "@/lib/admin/rota";
import { emailAtivo } from "@/lib/email";
import { alterarCarrinho, apagarCarrinho, idCarrinhoValido, listarCarrinhos } from "@/lib/pedidos/carrinhos";

export const dynamic = "force-dynamic";

// Compras não concluídas (aba CARRINHOS do painel).
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    return NextResponse.json({ carrinhos: await listarCarrinhos(), email: emailAtivo() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível carregar." }, { status: 502 });
  }
}

// Marca que a loja mandou o WhatsApp, ou apaga.
export async function PATCH(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  if (!d || !idCarrinhoValido(d.id)) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  try {
    if (d.acao === "apagar") {
      await apagarCarrinho(d.id);
      return NextResponse.json({ ok: true });
    }
    const c = await alterarCarrinho(d.id, d.acao === "concluido" ? { concluido: new Date().toISOString() } : { lembreteWhats: new Date().toISOString() });
    return NextResponse.json({ carrinho: c });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível salvar." }, { status: 502 });
  }
}
