import type { Metadata } from "next";
import { Suspense } from "react";
import { RetornoView } from "@/components/telas/RetornoView";

export const metadata: Metadata = { title: "Pagamento", robots: { index: false } };

export default function RetornoPage() {
  return <Suspense><RetornoView /></Suspense>;
}
