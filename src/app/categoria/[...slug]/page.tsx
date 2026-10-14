import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/telas/CategoryView";
import { INFO, rotasCategorias, slug, TREE } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string[] }> };

const valida = (s: string[]) => rotasCategorias().some((r) => r.join("/") === s.join("/"));

export const dynamicParams = false;
// Refaz uma vez por dia (etiqueta e lista do New In vencem sozinhas depois de 30 dias).
export const revalidate = 86400;
export function generateStaticParams() {
  return rotasCategorias().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = (await params).slug;
  const [k] = s;
  const I = INFO[k] || INFO.todos;
  // Subcategoria (ex.: roupas/blusas) ou estilo (estilo/office): o título usa o nome dela.
  const sub = s[1] ? Object.values(TREE[k]?.grupos ?? {}).flat().find((x) => slug(x) === s[1]) ?? s[1].replace(/-/g, " ") : "";
  const nome = sub ? sub.charAt(0).toUpperCase() + sub.slice(1) : I.titulo;
  return {
    title: k === "estilo" ? `Estilo ${nome}` : nome,
    description: `${nome} da Tramisse, moda feminina contemporânea de Belém/PA. ${I.texto} Envio para todo o Brasil.`,
    alternates: { canonical: `/categoria/${s.join("/")}` },
  };
}

export default async function CategoriaPage({ params }: Props) {
  const s = (await params).slug;
  if (!valida(s)) notFound();
  return <CategoryView k={s[0]} sub={s[1]} />;
}
