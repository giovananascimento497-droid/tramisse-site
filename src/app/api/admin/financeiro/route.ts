import { NextResponse } from "next/server";
import { moverEstoque } from "@/lib/admin/catalogo";
import { githubAtivo } from "@/lib/admin/github";
import { exigirLogin } from "@/lib/admin/rota";
import { porId } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import { parcelasPermitidas, r2, taxaParcelas } from "@/lib/payment/pricing";
import { lerFinanceiro, mudarFinanceiro, novoIdFin, type VendaFora } from "@/lib/pedidos/financeiro";
import { listarPedidos, VENDIDO } from "@/lib/pedidos/store";

export const dynamic = "force-dynamic";

const falha = (e: unknown, acao: string) => {
  console.error(e);
  return NextResponse.json({ erro: `Não foi possível ${acao} agora. [${e instanceof Error ? e.message : "erro"}]` }, { status: 502 });
};
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const hojeBelem = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Belem" });
const dataBelem = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Belem" });

// Taxa estimada do Mercado Pago num pedido do site (Pix automático 0,99%; cartão pelo nº máximo de parcelas liberado).
function taxaPedido(pagamento: string, total: number, automatico: boolean) {
  if (pagamento === "pix") return automatico ? r2(total * 0.0099) : 0;
  if (pagamento === "debito") return r2(total * taxaParcelas(CFG, 1));
  return r2(total * taxaParcelas(CFG, parcelasPermitidas(CFG, total)));
}

// Tudo o que a aba precisa: custos, compras, vendas fora do site e as vendas pagas do site (resumidas).
export async function GET(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  try {
    const [fin, pedidos] = await Promise.all([lerFinanceiro(), listarPedidos().catch((e) => { console.error(e); return []; })]);
    const site = pedidos
      .filter((p) => VENDIDO.includes(p.situacao))
      .map((p) => {
        const frete = p.pedido.frete?.valor ?? 0;
        const total = p.pedido.total;
        return {
          id: p.id,
          data: dataBelem(p.criadoEm),
          pagamento: p.pedido.pagamento,
          pecas: r2(total - frete),
          taxa: taxaPedido(p.pedido.pagamento, total, !!p.mercadoPago),
          itens: p.pedido.itens.map((i) => ({ id: i.id, nome: i.nome, q: i.q })),
        };
      });
    return NextResponse.json({ ...fin, site, hoje: hojeBelem() });
  } catch (e) {
    return falha(e, "carregar o financeiro");
  }
}

// Ações: custos | compra | apagarCompra | venda | apagarVenda.
export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  if (!d || typeof d.acao !== "string") return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  const num = (v: unknown) => Math.round(Number(String(v ?? "").replace(",", ".")) * 100) / 100;
  try {
    if (d.acao === "custos") {
      const custos: Record<string, number> = {};
      for (const [k, v] of Object.entries(d.custos ?? {})) {
        const n = num(v);
        if (porId(Number(k)) && n > 0 && n < 100000) custos[k] = n;
      }
      const f = await mudarFinanceiro((x) => { x.custos = custos; });
      return NextResponse.json({ ok: true, custos: f.custos });
    }
    if (d.acao === "compra") {
      const valor = num(d.valor);
      const descricao = String(d.descricao ?? "").trim().slice(0, 120);
      const data = DATA.test(String(d.data)) ? String(d.data) : hojeBelem();
      if (!(valor > 0)) return NextResponse.json({ erro: "Coloque o valor da compra." }, { status: 400 });
      if (!descricao) return NextResponse.json({ erro: "Descreva a compra (ex.: Jeans fornecedora X, com frete)." }, { status: 400 });
      const f = await mudarFinanceiro((x) => { x.compras.push({ id: novoIdFin("c"), data, descricao, valor }); });
      return NextResponse.json({ ok: true, compras: f.compras });
    }
    if (d.acao === "apagarCompra") {
      const f = await mudarFinanceiro((x) => { x.compras = x.compras.filter((c) => c.id !== d.id); });
      return NextResponse.json({ ok: true, compras: f.compras });
    }
    if (d.acao === "venda") {
      const p = porId(Number(d.produtoId));
      const q = Math.max(1, Math.min(50, Math.floor(Number(d.q) || 1)));
      const valor = num(d.valor);
      const taxa = Math.max(0, num(d.taxa) || 0);
      const forma = (["pix", "dinheiro", "cartao", "outro"] as const).find((x) => x === d.forma) ?? "outro";
      if (!p) return NextResponse.json({ erro: "Escolha a peça." }, { status: 400 });
      const va = p.variantes.find((v) => v.cor === d.cor && v.tamanho === d.tam) ?? (p.variantes.length === 1 ? p.variantes[0] : undefined);
      if (!va) return NextResponse.json({ erro: "Escolha o tamanho." }, { status: 400 });
      if (!(valor > 0)) return NextResponse.json({ erro: "Coloque o valor da venda." }, { status: 400 });
      const baixar = d.estoque !== false && githubAtivo();
      const venda: VendaFora = {
        id: novoIdFin("v"), data: DATA.test(String(d.data)) ? String(d.data) : hojeBelem(), produtoId: p.id, nome: p.nome,
        cor: va.cor, tam: va.tamanho, q, valor, taxa, forma, estoque: baixar, ...(String(d.obs ?? "").trim() ? { obs: String(d.obs).trim().slice(0, 200) } : {}),
      };
      // Baixa do estoque do site primeiro (se falhar, a venda não é registrada).
      if (baixar) await moverEstoque(`${venda.id}:baixa`, `Venda fora do site: ${p.nome} (${va.tamanho})`, [{ id: p.id, cor: va.cor, tam: va.tamanho, q }], -1);
      const f = await mudarFinanceiro((x) => { x.vendas.push(venda); });
      return NextResponse.json({ ok: true, vendas: f.vendas, aviso: baixar ? "Estoque atualizado: o site muda em uns 3 minutos." : "" });
    }
    if (d.acao === "apagarVenda") {
      const atual = (await lerFinanceiro()).vendas.find((v) => v.id === d.id);
      if (!atual) return NextResponse.json({ erro: "Venda não encontrada." }, { status: 404 });
      // Devolve ao estoque o que tinha sido baixado.
      if (atual.estoque && githubAtivo())
        await moverEstoque(`${atual.id}:devolve`, `Venda fora do site apagada: ${atual.nome} (${atual.tam}) volta ao estoque`, [{ id: atual.produtoId, cor: atual.cor, tam: atual.tam, q: atual.q }], 1);
      const f = await mudarFinanceiro((x) => { x.vendas = x.vendas.filter((v) => v.id !== d.id); });
      return NextResponse.json({ ok: true, vendas: f.vendas });
    }
    return NextResponse.json({ erro: "Ação inválida." }, { status: 400 });
  } catch (e) {
    return falha(e, "salvar");
  }
}
