"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { estoqueDe, porId } from "@/lib/catalog";
import type { ItemSacola } from "@/lib/types";

// Estado da loja no navegador. Usa as mesmas chaves de localStorage do site
// original (tb, tf, tu), então sacolas e favoritos já salvos continuam valendo.
const ST = {
  g<T>(k: string, d: T): T {
    try { return JSON.parse(localStorage.getItem(k) as string) ?? d; } catch { return d; }
  },
  s(k: string, v: unknown) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
};

export type Usuario = { n: string; e: string } | null;
export type Filtros = { tam?: string; cor?: string; pr?: string; est?: string; o?: string; disp?: boolean };
type Gaveta = "m" | "g" | null;

type Loja = {
  pronto: boolean;
  bag: ItemSacola[];
  fav: number[];
  user: Usuario;
  cupom: string | null;
  filtros: Filtros;
  gaveta: Gaveta;
  setBag: (f: (b: ItemSacola[]) => ItemSacola[]) => void;
  toggleFav: (id: number) => void;
  setUser: (u: Usuario) => void;
  setCupom: (c: string | null) => void;
  setFiltros: (f: Filtros) => void;
  abrir: (g: Gaveta) => void;
  toast: (m: string) => void;
  mensagem: string;
  guia: boolean;
  setGuia: (v: boolean) => void;
};

const Ctx = createContext<Loja | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [bag, setBagS] = useState<ItemSacola[]>([]);
  const [fav, setFav] = useState<number[]>([]);
  const [user, setUserS] = useState<Usuario>(null);
  const [cupom, setCupom] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [gaveta, abrir] = useState<Gaveta>(null);
  const [mensagem, setMensagem] = useState("");
  const [guia, setGuia] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Sacola salva: descarta peças que saíram do catálogo/estoque e limita ao estoque atual.
    const salva = ST.g<ItemSacola[]>("tb", []);
    const valida = salva.flatMap((l) => {
      const p = porId(l.id);
      const q = p && !p.emBreve ? Math.min(l.q, estoqueDe(p, l.cor, l.tam)) : 0;
      return q > 0 ? [{ ...l, q }] : [];
    });
    if (valida.length !== salva.length || valida.some((l, i) => l.q !== salva[i].q)) ST.s("tb", valida);
    setBagS(valida);
    setFav(ST.g("tf", []));
    setUserS(ST.g("tu", null));
    setPronto(true);
  }, []);

  const setBag = useCallback((f: (b: ItemSacola[]) => ItemSacola[]) => {
    setBagS((b) => { const n = f(b); ST.s("tb", n); return n; });
  }, []);
  const toggleFav = useCallback((id: number) => {
    setFav((l) => { const n = l.includes(id) ? l.filter((x) => x !== id) : [...l, id]; ST.s("tf", n); return n; });
  }, []);
  const setUser = useCallback((u: Usuario) => { setUserS(u); ST.s("tu", u); }, []);
  const toast = useCallback((m: string) => {
    setMensagem(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMensagem(""), 2200);
  }, []);

  return (
    <Ctx.Provider
      value={{ pronto, bag, fav, user, cupom, filtros, gaveta, setBag, toggleFav, setUser, setCupom, setFiltros, abrir, toast, mensagem, guia, setGuia }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useLoja() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLoja fora do StoreProvider");
  return c;
}
