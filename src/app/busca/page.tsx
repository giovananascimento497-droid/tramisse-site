import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/telas/SearchView";

export const metadata: Metadata = { title: "Busca", robots: { index: false } };

export default function BuscaPage() {
  return <Suspense><SearchView /></Suspense>;
}
