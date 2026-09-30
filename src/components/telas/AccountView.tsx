"use client";

import Link from "next/link";
import { useState } from "react";
import { useLoja } from "@/store/Store";

type Modo = "login" | "cad" | "esq";

// Conta de demonstração, igual ao site original (salva só no navegador).
// Ligar ao backend de clientes quando existir.
export function AccountView() {
  const { user, setUser, fav } = useLoja();
  const [m, setM] = useState<Modo>("login");
  const [erro, setErro] = useState<React.ReactNode>("");

  if (user)
    return (
      <div className="pg">
        <h1>Minha conta</h1>
        <p>Olá, {user.n}.</p>
        <div style={{ display: "grid", gap: 8, margin: "24px 0" }}>
          {["Meus pedidos", "Dados pessoais", "Endereços", "Senha"].map((t) => (
            <details key={t}><summary>{t.toUpperCase()}</summary><p>Área ligada ao backend de clientes (a implementar).</p></details>
          ))}
          <Link href="/favoritos" style={{ padding: "14px 0", borderTop: "1px solid var(--ln)", letterSpacing: ".14em", fontSize: 13 }}>
            FAVORITOS ({fav.length})
          </Link>
        </div>
        <button className="btn o" onClick={() => setUser(null)}>SAIR</button>
      </div>
    );

  const trocar = (x: Modo) => (e: React.MouseEvent) => { e.preventDefault(); setM(x); setErro(""); };
  const lk = (x: Modo, t: string) => <a href="#" onClick={trocar(x)} style={{ textDecoration: "underline" }}>{t}</a>;
  return (
    <div className="pg" style={{ maxWidth: 460 }}>
      <h1 style={{ fontSize: 44 }}>{m === "cad" ? "Cadastro" : m === "esq" ? "Esqueci minha senha" : "Entrar"}</h1>
      <form
        key={m}
        className="fg"
        style={{ gridTemplateColumns: "1fr" }}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
          if (!/^\S+@\S+\.\S+$/.test(fd.e || "")) return setErro("Digite um e-mail válido.");
          if (m === "esq") return setErro(<span className="okk">Enviamos o link para o seu e-mail (demonstração).</span>);
          if (!fd.s) return setErro("Digite sua senha.");
          setUser({ n: fd.n || fd.e.split("@")[0], e: fd.e });
        }}
      >
        {m === "cad" ? <label>Nome<input name="n" type="text" autoComplete="on" /></label> : null}
        <label>E-mail<input name="e" type="email" autoComplete="on" /></label>
        {m !== "esq" ? <label>Senha<input name="s" type="password" autoComplete="on" /></label> : null}
        <div className="er">{erro}</div>
        <button className="btn">{m === "cad" ? "CRIAR CONTA" : m === "esq" ? "ENVIAR LINK" : "ENTRAR"}</button>
      </form>
      <p style={{ marginTop: 20, fontSize: 14 }}>
        {m !== "login" ? <>{lk("login", "Entrar")} · </> : null}
        {m !== "cad" ? <>{lk("cad", "Criar conta")} · </> : null}
        {m !== "esq" ? lk("esq", "Esqueci minha senha") : null}
      </p>
    </div>
  );
}
