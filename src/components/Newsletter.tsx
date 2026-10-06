"use client";

import { useState } from "react";

// Cadastro de e-mail: registrado no Netlify Forms (formulário "newsletter" em public/__forms.html).
export function Newsletter() {
  const [msg, setMsg] = useState<React.ReactNode>("");
  return (
    <section className="nl">
      <h2>Fique por perto</h2>
      <p style={{ color: "var(--mut)" }}>Receba os lançamentos em primeira mão, com acesso antecipado às novidades da Tramisse.</p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const v = String(new FormData(f).get("e") || "");
          if (!/^\S+@\S+\.\S+$/.test(v)) return setMsg("Digite um e-mail válido.");
          fetch("/__forms.html", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ "form-name": "newsletter", email: v }).toString(),
          }).catch(() => {});
          setMsg(<span className="okk">Cadastro feito. Até logo!</span>);
          f.reset();
        }}
      >
        <input type="email" name="e" placeholder="Seu melhor e-mail" aria-label="Seu melhor e-mail" required />
        <button className="btn">CADASTRAR</button>
      </form>
      <small style={{ color: "var(--mut)", display: "block", marginTop: 8 }}>
        Ao se cadastrar, você concorda com a nossa <a href="/pagina/privacidade" style={{ textDecoration: "underline" }}>política de privacidade</a>. Cancele quando quiser.
      </small>
      <div className="er">{msg}</div>
    </section>
  );
}
