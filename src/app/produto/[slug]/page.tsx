import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Grid } from "@/components/ProductCard";
import { ProductView } from "@/components/telas/ProductView";
import { porSlug, PRODS, temEstoque } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
// Refaz uma vez por dia (etiqueta e lista do New In vencem sozinhas depois de 30 dias).
export const revalidate = 86400;
export function generateStaticParams() {
  return PRODS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = porSlug((await params).slug);
  if (!p) return {};
  return { title: p.nome, description: p.descricao, openGraph: { images: p.imagens.slice(0, 1) } };
}

export default async function ProdutoPage({ params }: Props) {
  const p = porSlug((await params).slug);
  if (!p) notFound();
  // Sugestões: só peças à venda, primeiro as do mesmo tipo.
  const rel = PRODS.filter((x) => x.id !== p.id && temEstoque(x) && (x.subcategoria === p.subcategoria || x.categoria === p.categoria))
    .sort((a, b) => Number(b.subcategoria === p.subcategoria) - Number(a.subcategoria === p.subcategoria))
    .slice(0, 4);
  return (
    <div className="w">
      {/* key: ao trocar de produto, a seleção (cor, tamanho, foto) recomeça */}
      <ProductView key={p.id} id={p.id} />
      <h2 style={{ marginBottom: 24 }}>Você também pode gostar</h2>
      <Grid itens={rel} style={{ marginBottom: 96 }} vazio={null} />
    </div>
  );
}
