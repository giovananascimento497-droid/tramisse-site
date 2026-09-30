"use client";

import { useEffect, useRef, useState } from "react";
import { CFG } from "@/lib/config";

const INTERVALO = 4000; // ms entre uma mensagem e outra

// Barra superior: mostra uma mensagem por vez, trocando sozinha (pausa com o mouse em cima).
// Todas ficam empilhadas no mesmo lugar, então a altura da barra não muda na troca.
export function TopBar() {
  const msgs = CFG.barraSuperior;
  const [i, setI] = useState(0);
  const pausa = useRef(false);

  useEffect(() => {
    if (msgs.length < 2) return;
    const t = setInterval(() => { if (!pausa.current) setI((x) => (x + 1) % msgs.length); }, INTERVALO);
    return () => clearInterval(t);
  }, [msgs.length]);

  return (
    <div
      className="top gira"
      id="top"
      onMouseEnter={() => (pausa.current = true)}
      onMouseLeave={() => (pausa.current = false)}
    >
      {msgs.map((t, k) => (
        <span key={t} className={k === i ? "on" : undefined} aria-hidden={k !== i}>{t}</span>
      ))}
    </div>
  );
}
