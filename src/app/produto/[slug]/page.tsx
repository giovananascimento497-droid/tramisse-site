import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduto, getProdutos } from "@/lib/catalog";
import { brl } from "@/lib/payment/pricing";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProdutos()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduto((await params).slug);
  if (!p) return {};
  return { title: p.nome, description: p.descricao, openGraph: { images: p.imagens.slice(0, 1) } };
}

export default async function ProdutoPage({ params }: Props) {
  const p = await getProduto((await params).slug);
  if (!p) notFound();
  return (
    <div className="w">
      <h1>{p.nome}</h1>
      <p>{brl(p.preco)}</p>
      {p.descricao && <p>{p.descricao}</p>}
    </div>
  );
}
