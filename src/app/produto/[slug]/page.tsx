import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Grid } from "@/components/ProductCard";
import { ProductView } from "@/components/telas/ProductView";
import { porSlug, PRODS } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
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
  const rel = PRODS.filter((x) => x.id !== p.id && (x.subcategoria === p.subcategoria || x.categoria === p.categoria)).slice(0, 4);
  return (
    <div className="w">
      {/* key: ao trocar de produto, a seleção (cor, tamanho, foto) recomeça */}
      <ProductView key={p.id} id={p.id} />
      <h2 style={{ marginBottom: 24 }}>Você também pode gostar</h2>
      <Grid itens={rel} style={{ marginBottom: 96 }} vazio={null} />
    </div>
  );
}
