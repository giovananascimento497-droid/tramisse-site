import type { Metadata } from "next";
import { Suspense } from "react";
import { AvaliarView } from "@/components/telas/AvaliarView";

export const metadata: Metadata = { title: "Avalie suas peças", robots: { index: false } };

export default function AvaliarPage() {
  return <Suspense><AvaliarView /></Suspense>;
}
