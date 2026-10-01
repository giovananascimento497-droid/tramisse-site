import { CL, estoqueDe, porId } from "../catalog";
import { CFG } from "../config";
import type { DadosCliente, FormaEntrega, FormaPagamento, ItemSacola, OpcaoFrete, Pedido } from "../types";
import { acharCupom, calcularTotais, r2 } from "./pricing";

const PAGAMENTOS: FormaPagamento[] = ["pix", "debito", "credito"];
const ENTREGAS: FormaEntrega[] = ["aplicativo", "retirada", "correios"];

// Monta o pedido a partir do catálogo (preços oficiais), nunca de valores vindos do navegador.
// Usado no checkout e na API de pagamento. Retorna null se algo for inválido.
export function montarPedido(dados: {
  bag: ItemSacola[];
  cupom?: string | null;
  pagamento: FormaPagamento;
  entrega: FormaEntrega;
  cliente: DadosCliente;
  // Correios: opção de frete escolhida. No servidor (Mercado Pago) vem da cotação refeita lá, nunca do navegador.
  frete?: OpcaoFrete | null;
}): Pedido | null {
  if (!PAGAMENTOS.includes(dados.pagamento) || !ENTREGAS.includes(dados.entrega)) return null;
  const frete = dados.entrega === "correios" ? dados.frete : undefined;
  if (dados.entrega === "correios" && !(frete && frete.valor >= 0)) return null;
  if (!Array.isArray(dados.bag) || !dados.bag.length) return null;
  const linhas = [];
  for (const l of dados.bag) {
    const p = porId(Number(l.id));
    const q = Number(l.q);
    if (!p || p.emBreve || !Number.isInteger(q) || q < 1) return null;
    // Não vende mais do que o estoque da variante (somando linhas repetidas da sacola).
    const jaPedidas = linhas.filter((x) => x.p.id === p.id && x.cor === l.cor && x.tam === l.tam).reduce((a, x) => a + x.q, 0);
    if (q + jaPedidas > estoqueDe(p, l.cor, l.tam)) return null;
    linhas.push({ p, cor: l.cor, tam: l.tam, q });
  }
  const cupom = acharCupom(CFG, dados.cupom)?.codigo;
  const t = calcularTotais(CFG, linhas.map((l) => ({ preco: l.p.preco, q: l.q })), dados.pagamento, cupom);
  return {
    itens: linhas.map((l, i) => ({
      id: l.p.id,
      slug: l.p.slug,
      nome: l.p.nome,
      cor: CL[l.cor]?.nome ?? l.cor,
      tam: l.tam,
      q: l.q,
      precoUnitario: l.p.preco,
      precoFinal: t.unitarios[i],
    })),
    cupom,
    pagamento: dados.pagamento,
    entrega: dados.entrega,
    cliente: dados.cliente ?? {},
    subtotal: t.subtotal,
    desconto: t.desconto,
    descontoPix: t.descontoPix,
    ...(frete ? { frete } : {}),
    // O desconto Pix vale só sobre as peças; o frete entra cheio.
    total: r2(t.total + (frete?.valor ?? 0)),
  };
}
