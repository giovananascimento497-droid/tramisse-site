import { CL, porId } from "../catalog";
import { CFG } from "../config";
import type { DadosCliente, FormaEntrega, FormaPagamento, ItemSacola, Pedido } from "../types";
import { acharCupom, calcularTotais } from "./pricing";

const PAGAMENTOS: FormaPagamento[] = ["pix", "debito", "credito"];
const ENTREGAS: FormaEntrega[] = ["aplicativo", "retirada"];

// Monta o pedido a partir do catálogo (preços oficiais), nunca de valores vindos do navegador.
// Usado no checkout e na API de pagamento. Retorna null se algo for inválido.
export function montarPedido(dados: {
  bag: ItemSacola[];
  cupom?: string | null;
  pagamento: FormaPagamento;
  entrega: FormaEntrega;
  cliente: DadosCliente;
}): Pedido | null {
  if (!PAGAMENTOS.includes(dados.pagamento) || !ENTREGAS.includes(dados.entrega)) return null;
  if (!Array.isArray(dados.bag) || !dados.bag.length) return null;
  const itens: Pedido["itens"] = [];
  for (const l of dados.bag) {
    const p = porId(Number(l.id));
    const q = Number(l.q);
    if (!p || !Number.isInteger(q) || q < 1 || q > 99) return null;
    if (!p.variantes.some((v) => v.cor === l.cor && v.tamanho === l.tam)) return null;
    itens.push({ nome: p.nome, cor: CL[l.cor]?.nome ?? l.cor, tam: l.tam, q, precoUnitario: p.preco });
  }
  const subtotalBruto = itens.reduce((a, i) => a + i.precoUnitario * i.q, 0);
  const cupom = acharCupom(CFG, dados.cupom)?.codigo;
  const { subtotal, desconto, acrescimo, total } = calcularTotais(CFG, subtotalBruto, dados.pagamento, cupom);
  return { itens, cupom, pagamento: dados.pagamento, entrega: dados.entrega, cliente: dados.cliente ?? {}, subtotal, desconto, acrescimo, total };
}
