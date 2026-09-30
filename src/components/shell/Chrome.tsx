"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLoja } from "@/store/Store";

// Classes do <body> que o CSS original usa:
//  home (página inicial), sol (header sólido ao rolar), m/g (menu/sacola abertos).
// Também posiciona o header logo abaixo da barra superior (--ty) e fecha tudo com Esc.
export function Chrome() {
  const home = usePathname() === "/";
  const { gaveta, abrir, setGuia } = useLoja();

  useEffect(() => {
    const b = document.body;
    b.classList.toggle("home", home);
    const sc = () => {
      const tb = document.getElementById("top")?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--ty", Math.max(0, tb - scrollY) + "px");
      b.classList.toggle("sol", !home || scrollY > 60);
    };
    sc();
    addEventListener("scroll", sc, { passive: true });
    addEventListener("resize", sc);
    return () => { removeEventListener("scroll", sc); removeEventListener("resize", sc); };
  }, [home]);

  useEffect(() => {
    document.body.classList.remove("m", "g");
    if (gaveta) document.body.classList.add(gaveta);
  }, [gaveta]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { abrir(null); setGuia(false); } };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [abrir, setGuia]);

  return null;
}
