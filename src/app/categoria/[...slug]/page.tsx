import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/telas/CategoryView";
import { INFO, rotasCategorias } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string[] }> };

const valida = (s: string[]) => rotasCategorias().some((r) => r.join("/") === s.join("/"));

export const dynamicParams = false;
// Refaz uma vez por dia (etiqueta e lista do New In vencem sozinhas depois de 30 dias).
export const revalidate = 86400;
export function generateStaticParams() {
  return rotasCategorias().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [k] = (await params).slug;
  const I = INFO[k] || INFO.todos;
  return { title: I.titulo, description: I.texto };
}

export default async function CategoriaPage({ params }: Props) {
  const s = (await params).slug;
  if (!valida(s)) notFound();
  return <CategoryView k={s[0]} sub={s[1]} />;
}
