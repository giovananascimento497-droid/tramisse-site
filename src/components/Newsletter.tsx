"use client";

import { useState } from "react";

// Cadastro de e-mail (ainda sem envio real: ligar a uma ferramenta de e-mail marketing no backend).
export function Newsletter() {
  const [msg, setMsg] = useState<React.ReactNode>("");
  return (
    <section className="nl">
      <h2>Fique por perto</h2>
      <p style={{ color: "var(--mut)" }}>Receba novidades, lançamentos e conteúdos da Tramisse.</p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const v = String(new FormData(f).get("e") || "");
          if (!/^\S+@\S+\.\S+$/.test(v)) return setMsg("Digite um e-mail válido.");
          setMsg(<span className="okk">Cadastro feito. Até logo!</span>);
          f.reset();
        }}
      >
        <input type="email" name="e" placeholder="Seu melhor e-mail" aria-label="Seu melhor e-mail" required />
        <button className="btn">CADASTRAR</button>
      </form>
      <div className="er">{msg}</div>
    </section>
  );
}
