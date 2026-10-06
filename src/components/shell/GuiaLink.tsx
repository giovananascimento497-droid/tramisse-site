"use client";

import { useLoja } from "@/store/Store";

// Link do rodapé que abre o guia de tamanhos (mesma janela da página da peça).
export function GuiaLink() {
  const { setGuia } = useLoja();
  return (
    <a href="#guia" onClick={(e) => { e.preventDefault(); setGuia(true); }}>
      Guia de tamanhos
    </a>
  );
}
