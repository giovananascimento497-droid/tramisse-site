"use client";

import { useEffect } from "react";

// Header transparente sobre o banner e sólido ao rolar (classe body.sol).
export function ScrollState() {
  useEffect(() => {
    const f = () => document.body.classList.toggle("sol", window.scrollY > 10);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return null;
}
