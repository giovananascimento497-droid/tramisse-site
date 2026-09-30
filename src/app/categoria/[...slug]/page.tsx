import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoria, getProdutosDaCategoria } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoria((await params).slug);
  return cat ? { title: cat.nome } : {};
}

export default async function CategoriaPage({ params }: Props) {
  const cat = await getCategoria((await params).slug);
  if (!cat) notFound();
  const produtos = await getProdutosDaCategoria(cat);
  return (
    <div className="w">
      <h1>{cat.nome}</h1>
      <p>{produtos.length} peças</p>
    </div>
  );
}
