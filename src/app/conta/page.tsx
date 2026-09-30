import type { Metadata } from "next";
import { AccountView } from "@/components/telas/AccountView";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

export default function ContaPage() {
  return <AccountView />;
}
