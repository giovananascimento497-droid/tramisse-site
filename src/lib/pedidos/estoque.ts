// Estoque das vendas registradas no painel (SÓ SERVIDOR).
// Marcou como paga → baixa o estoque; voltou para aguardando ou cancelou → devolve.
// Pedidos do Mercado Pago aprovados já têm o estoque baixado pelo webhook.
import { moverEstoque } from "../admin/catalogo";
import { githubAtivo } from "../admin/github";
import { CL } from "../catalog";
import { VENDIDO, type PedidoSalvo, type Situacao } from "./tipos";

const chaveCor = (nome: string) => Object.entries(CL).find(([, c]) => c.nome === nome)?.[0] ?? nome;
const itensDe = (p: PedidoSalvo) => p.pedido.itens.map((i) => ({ id: i.id, cor: chaveCor(i.cor), tam: i.tam, q: i.q }));

export async function estoqueAoMudar(p: PedidoSalvo, nova: Situacao): Promise<{ estoque?: PedidoSalvo["estoque"]; aviso: string }> {
  const vendido = VENDIDO.includes(nova);
  const estado = p.estoque?.estado;
  const seq = p.estoque?.seq ?? 0;
  if (vendido && estado !== "baixado") {
    if (!estado && p.canal === "mercadopago" && p.mercadoPago?.status === "approved") return { estoque: { estado: "baixado", seq }, aviso: "" };
    if (!githubAtivo()) return { aviso: "Estoque não mudou (painel sem GITHUB_TOKEN)." };
    await moverEstoque(`${p.id}:baixa:${seq + 1}`, `Venda ${p.id} paga (painel): baixa de estoque`, itensDe(p), -1);
    return { estoque: { estado: "baixado", seq: seq + 1 }, aviso: "Estoque baixado (o site atualiza em uns 3 minutos)." };
  }
  if (!vendido && estado === "baixado") {
    if (!githubAtivo()) return { aviso: "Estoque não mudou (painel sem GITHUB_TOKEN)." };
    await moverEstoque(`${p.id}:devolve:${seq + 1}`, `Venda ${p.id} ${nova === "cancelado" ? "cancelada" : "voltou a aguardar"} (painel): estoque devolvido`, itensDe(p), 1);
    return { estoque: { estado: "devolvido", seq: seq + 1 }, aviso: "Peças devolvidas ao estoque (o site atualiza em uns 3 minutos)." };
  }
  return { aviso: "" };
}
