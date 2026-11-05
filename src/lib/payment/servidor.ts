// Pedido para pagamento online (cartão ou Pix), remontado no servidor — SÓ SERVIDOR.
// O valor sai do catálogo; o frete dos Correios é cotado de novo aqui (o do navegador é ignorado).
import { porId } from "../catalog";
import { CFG } from "../config";
import { cotarFrete, melhorEnvioAtivo } from "../frete/melhorenvio";
import { jaComprou } from "../pedidos/clientes";
import { limparCliente } from "../pedidos/limpar";
import type { OpcaoFrete, Pedido } from "../types";
import { montarPedido } from "./pedido";
import { acharCupom, calcularTotais } from "./pricing";

type Resultado = { pedido: Pedido; estoque: string; referencia: string } | { erro: string; status: number };

export async function pedidoDoServidor(dados: Record<string, unknown> | null): Promise<Resultado> {
  if (!dados) return { erro: "Pedido inválido. Confira a sacola.", status: 400 };
  const bag = (Array.isArray(dados.bag) ? dados.bag.slice(0, 50) : []) as { id: number; cor: string; tam: string; q: number }[];
  const cliente = limparCliente(dados.cliente);
  let frete: OpcaoFrete | null = null;
  if (dados.entrega === "correios") {
    if (!melhorEnvioAtivo()) return { erro: "Envio pelos Correios indisponível no momento.", status: 503 };
    const linhas = bag.map((l) => ({ p: porId(Number(l.id)), q: Number(l.q) }));
    if (!linhas.length || linhas.some((l) => !l.p)) return { erro: "Pedido inválido. Confira a sacola.", status: 400 };
    const t = calcularTotais(CFG, linhas.map((l) => ({ preco: l.p!.preco, q: l.q, promo: Boolean(l.p!.precoDe) })), null, dados.cupom as string);
    try {
      const opcoes = await cotarFrete(cliente.cep || "", linhas as never, t.subtotal - t.desconto);
      frete = opcoes.find((o) => o.servico === Number((dados.frete as { servico?: number } | null)?.servico)) ?? null;
    } catch (e) {
      console.error(e);
      return { erro: "Não foi possível calcular o frete agora. Tente de novo.", status: 502 };
    }
    if (!frete) return { erro: "Escolha o frete de novo.", status: 400 };
  }
  const pedido = montarPedido({ bag, cupom: typeof dados.cupom === "string" ? dados.cupom : null, pagamento: dados.pagamento as never, entrega: dados.entrega as never, cliente, frete });
  if (!pedido) return { erro: "Pedido inválido. Confira a sacola (alguma peça pode ter acabado).", status: 400 };
  if (!/^\S+@\S+\.\S+$/.test(pedido.cliente.e || "")) return { erro: "E-mail inválido.", status: 400 };
  // Cupom de recompra: só para quem já tem pedido pago no site.
  if (acharCupom(CFG, pedido.cupom)?.somenteClientes && !(await jaComprou(pedido.cliente.e, pedido.cliente.tel).catch(() => false)))
    return { erro: `O cupom ${pedido.cupom} é para quem já comprou no site. Tire o cupom da sacola e tente de novo.`, status: 400 };
  // Peças compradas ("id:cor:tamanho:qtd|..."): voltam no aviso de pagamento para baixar o estoque.
  const estoque = bag.map((l) => [Number(l.id), String(l.cor), String(l.tam), Number(l.q)].join(":")).join("|");
  const referencia = `T${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return { pedido, estoque, referencia };
}
