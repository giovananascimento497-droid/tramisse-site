"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Links antigos do site estático ("/#/p/vestido-poa", "/#/c/roupas/blusas"...)
// continuam funcionando: são levados para a rota real equivalente.
const MAPA: Record<string, string> = { c: "categoria", p: "produto" };

export function HashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const h = location.hash;
    if (!h.startsWith("#/")) return;
    const [a, ...resto] = h.slice(2).split("/");
    router.replace("/" + [MAPA[a] ?? a, ...resto].filter(Boolean).join("/"));
  }, [router]);
  return null;
}
