// Regras de edição do catálogo pelo painel (SÓ SERVIDOR).
import type { Catalogo, Produto, Variante } from "../types";
import { commitArquivos, lerArquivo, type ArquivoCommit } from "./github";

export const ARQ_PRODUTOS = "data/products.json";
export const ARQ_VENDAS = "data/vendas-processadas.json"; // ids de pagamentos que já baixaram estoque (sem dados pessoais)

export async function lerCatalogo(): Promise<{ catalogo: Catalogo; sha: string }> {
  const a = await lerArquivo(ARQ_PRODUTOS);
  if (!a) throw new Error("data/products.json não encontrado no GitHub.");
  return { catalogo: JSON.parse(a.texto) as Catalogo, sha: a.sha };
}

const json = (d: unknown) => JSON.stringify(d, null, 2) + "\n";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FOTO = /^\/assets\/products\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/;

// Confere um produto vindo do painel e devolve só os campos permitidos (nunca custo, lucro etc.).
export function limparProduto(p: Produto, cat: Catalogo): { ok: Produto } | { erro: string } {
  const nome = String(p.nome || "").trim();
  if (!nome) return { erro: "Toda peça precisa de nome." };
  if (!SLUG.test(String(p.slug || ""))) return { erro: `Endereço inválido na peça "${nome}".` };
  const preco = Number(p.preco), precoDe = Number(p.precoDe || 0);
  if (!(preco > 0) || preco > 100000 || precoDe < 0) return { erro: `Preço inválido na peça "${nome}".` };
  const subs = Object.values(cat.categorias).flatMap((c) => Object.values(c.grupos).flat());
  if (!subs.includes(p.subcategoria)) return { erro: `Categoria inválida na peça "${nome}".` };
  const categoria = Object.entries(cat.categorias).find(([, c]) => Object.values(c.grupos).flat().includes(p.subcategoria))![0];
  const variantes: Variante[] = [];
  for (const v of p.variantes || []) {
    const tamanho = String(v.tamanho || "").trim().toUpperCase();
    const estoque = Number(v.estoque);
    if (!cat.cores[v.cor] || !tamanho || !Number.isInteger(estoque) || estoque < 0 || estoque > 9999)
      return { erro: `Cor, tamanho ou estoque inválido na peça "${nome}".` };
    if (variantes.some((x) => x.cor === v.cor && x.tamanho === tamanho)) return { erro: `Cor e tamanho repetidos na peça "${nome}".` };
    variantes.push({ cor: v.cor, tamanho, estoque });
  }
  if (!variantes.length) return { erro: `A peça "${nome}" precisa de pelo menos uma cor/tamanho.` };
  const imagens = (p.imagens || []).map(String);
  if (imagens.some((i) => !FOTO.test(i)) || imagens.length > 12) return { erro: `Fotos inválidas na peça "${nome}".` };
  return {
    ok: {
      id: Number(p.id),
      slug: p.slug,
      nome,
      descricao: String(p.descricao || "").trim(),
      tecido: String(p.tecido || "").trim(),
      preco: Math.round(preco * 100) / 100,
      precoDe: Math.round(precoDe * 100) / 100,
      categoria,
      subcategoria: p.subcategoria,
      estilo: String(p.estilo || "").trim(),
      colecao: String(p.colecao || "Coleção atual").trim(),
      flags: { novo: Boolean(p.flags?.novo), curadoria: Boolean(p.flags?.curadoria), maisVendida: Boolean(p.flags?.maisVendida), jeans: Boolean(p.flags?.jeans) },
      emBreve: Boolean(p.emBreve),
      variantes,
      imagens,
    },
  };
}

export type Alteracao = { original: Produto | null; novo: Produto };

// Aplica as alterações do painel sobre a versão MAIS NOVA do catálogo.
// Estoque entra como diferença (o que a pessoa mudou), para não desfazer uma venda
// que aconteceu enquanto o painel estava aberto. Os outros campos ficam como a pessoa salvou.
export function aplicarAlteracoes(cat: Catalogo, alteracoes: Alteracao[]): Catalogo | { erro: string } {
  const produtos = [...cat.produtos];
  for (const { original, novo } of alteracoes) {
    const limpo = limparProduto(novo, cat);
    if ("erro" in limpo) return limpo;
    const p = limpo.ok;
    const i = original ? produtos.findIndex((x) => x.id === original.id) : -1;
    if (i >= 0) {
      const atual = produtos[i];
      const est = (l: Variante[], v: Variante) => l.find((x) => x.cor === v.cor && x.tamanho === v.tamanho)?.estoque;
      p.id = atual.id;
      p.variantes = p.variantes.map((v) => {
        const antes = est(original!.variantes, v) ?? 0;
        const agora = est(atual.variantes, v) ?? antes;
        return { ...v, estoque: Math.max(0, agora + (v.estoque - antes)) };
      });
      produtos[i] = p;
    } else {
      p.id = Math.max(0, ...produtos.map((x) => x.id)) + 1;
      produtos.push(p);
    }
    if (produtos.filter((x) => x.slug === p.slug).length > 1) return { erro: `Já existe outra peça com o endereço "${p.slug}".` };
  }
  return { ...cat, produtos };
}

export async function publicar(alteracoes: Alteracao[], fotos: { caminho: string; blob: string }[], quem: string) {
  let erro = "";
  const nomes = alteracoes.map((a) => a.novo.nome).slice(0, 3).join(", ") + (alteracoes.length > 3 ? "…" : "");
  await commitArquivos(`Painel: ${nomes || "fotos"} (${quem})`, async () => {
    const { catalogo } = await lerCatalogo();
    const r = aplicarAlteracoes(catalogo, alteracoes);
    if ("erro" in r) {
      erro = r.erro;
      throw new Error(r.erro);
    }
    const arquivos: ArquivoCommit[] = [{ caminho: ARQ_PRODUTOS, texto: json(r) }];
    for (const f of fotos) arquivos.push({ caminho: `public${f.caminho}`, blob: f.blob });
    return arquivos;
  }).catch((e) => {
    throw erro ? Object.assign(new Error(erro), { validacao: true }) : e;
  });
}

// Muda o estoque de uma venda, uma vez só por chave (ids guardados em vendas-processadas.json).
// sinal -1 = baixa (venda), +1 = devolve (pedido cancelado). Retorna false se já tinha sido feito.
export async function moverEstoque(chave: string, mensagem: string, itens: { id: number; cor: string; tam: string; q: number }[], sinal: -1 | 1) {
  let jaFeito = false;
  await commitArquivos(mensagem, async () => {
    const { catalogo } = await lerCatalogo();
    const v = await lerArquivo(ARQ_VENDAS);
    const feitos: string[] = v ? JSON.parse(v.texto) : [];
    if (feitos.includes(chave)) {
      jaFeito = true;
      throw new Error("ja-feito");
    }
    for (const it of itens) {
      const p = catalogo.produtos.find((x) => x.id === it.id);
      const va = p?.variantes.find((x) => x.cor === it.cor && x.tamanho === it.tam);
      if (va) va.estoque = Math.max(0, va.estoque + sinal * it.q);
    }
    return [
      { caminho: ARQ_PRODUTOS, texto: json(catalogo) },
      { caminho: ARQ_VENDAS, texto: json([...feitos, chave].slice(-1000)) },
    ];
  }).catch((e) => {
    if (!jaFeito) throw e;
  });
  return !jaFeito;
}

// Baixa o estoque de um pagamento aprovado no Mercado Pago (uma vez só por pagamento).
export const baixarEstoque = (pagamentoId: string, itens: { id: number; cor: string; tam: string; q: number }[]) =>
  moverEstoque(pagamentoId, `Venda paga (Mercado Pago ${pagamentoId}): baixa de estoque`, itens, -1);
