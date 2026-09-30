import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPagina, getPaginas } from "@/lib/paginas";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPaginas()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPagina((await params).slug);
  return p ? { title: p.titulo } : {};
}

export default async function InstitucionalPage({ params }: Props) {
  const p = await getPagina((await params).slug);
  if (!p) notFound();
  return (
    <div className="w">
      <h1>{p.titulo}</h1>
      {p.paragrafos.map((t) => <p key={t}>{t}</p>)}
    </div>
  );
}
