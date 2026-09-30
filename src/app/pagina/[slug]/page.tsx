import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPagina, PAGINAS } from "@/lib/paginas";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return PAGINAS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPagina((await params).slug);
  return p ? { title: p.titulo } : {};
}

export default async function Pagina({ params }: Props) {
  const p = getPagina((await params).slug);
  if (!p) notFound();
  // Conteúdo vem de data/paginas.json (editado pela própria loja).
  return (
    <div className="pg">
      <h1>{p.titulo}</h1>
      <p dangerouslySetInnerHTML={{ __html: p.html }} />
    </div>
  );
}
