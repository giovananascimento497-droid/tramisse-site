"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Links antigos no formato "/#/produto/x" continuam funcionando:
// são redirecionados para a rota real "/produto/x".
export function HashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const h = window.location.hash;
    if (h.startsWith("#/")) router.replace(h.slice(1) || "/");
  }, [router]);
  return null;
}
