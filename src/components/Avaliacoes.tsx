"use client";

import { useEffect, useState } from "react";
import { Estrelas } from "./Estrelas";

export type AvaliacaoPublica = { id: string; produtoId: number; nota: number; texto: string; nome: string; cidade?: string; tam?: string; criadaEm: string; verificada: boolean };

// Avaliações aprovadas (buscadas no navegador: a página da peça é estática e as avaliações mudam a qualquer hora).
const cache = new Map<string, Promise<AvaliacaoPublica[]>>();
const buscar = (q: string) => {
  if (!cache.has(q)) cache.set(q, fetch(`/api/avaliacoes?${q}`).then((r) => r.json()).then((d) => d.avaliacoes ?? []).catch(() => []));
  return cache.get(q)!;
};
export function useAvaliacoes(q: string) {
  const [l, setL] = useState<AvaliacaoPublica[] | null>(null);
  useEffect(() => { let vivo = true; buscar(q).then((x) => vivo && setL(x)); return () => { vivo = false; }; }, [q]);
  return l;
}
const media = (l: AvaliacaoPublica[]) => l.reduce((a, x) => a + x.nota, 0) / l.length;
const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const quando = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Belem" });

// Nota média ao lado do nome da peça (some se não houver avaliação).
export function NotaPeca({ produtoId }: { produtoId: number }) {
  const l = useAvaliacoes(`p=${produtoId}`);
  if (!l?.length) return null;
  return (
    <a href="#avaliacoes" className="nota-pc">
      <Estrelas nota={media(l)} /> <span>{fmt(media(l))} · {l.length} {l.length === 1 ? "avaliação" : "avaliações"}</span>
    </a>
  );
}

function Cartao({ a, peca }: { a: AvaliacaoPublica; peca?: string }) {
  return (
    <article className="av-c">
      <Estrelas nota={a.nota} />
      {a.texto ? <p>“{a.texto}”</p> : null}
      <small>
        <b>{a.nome}</b>{a.cidade ? `, ${a.cidade}` : ""}{a.tam ? ` · comprou o ${a.tam}` : ""}
        {peca ? <> · {peca}</> : null}
        <br />{a.verificada ? "Compra verificada · " : ""}{quando(a.criadaEm)}
      </small>
    </article>
  );
}

// Seção de avaliações na página da peça.
export function AvaliacoesPeca({ produtoId }: { produtoId: number }) {
  const l = useAvaliacoes(`p=${produtoId}`);
  const [todas, setTodas] = useState(false);
  if (!l?.length) return null;
  const vis = todas ? l : l.slice(0, 4);
  return (
    <section id="avaliacoes" className="av-pc">
      <h2>Avaliações</h2>
      <p className="av-md"><Estrelas nota={media(l)} tam={18} /> <b>{fmt(media(l))}</b> de 5 · {l.length} {l.length === 1 ? "avaliação" : "avaliações"}</p>
      <div className="av-l">{vis.map((a) => <Cartao key={a.id} a={a} />)}</div>
      {l.length > vis.length ? <button className="btn o" onClick={() => setTodas(true)}>VER TODAS ({l.length})</button> : null}
    </section>
  );
}

// Home: "Quem comprou, amou" com as avaliações mais recentes da loja (some se não houver).
export function AvaliacoesHome({ nomes }: { nomes: Record<number, string> }) {
  const l = useAvaliacoes("ultimas=1");
  if (!l?.length) return null;
  return (
    <section className="sec av-home">
      <div className="w">
        <div className="sh"><div><h2>Quem comprou, amou</h2><p>Avaliações de clientes Tramisse.</p></div></div>
        <div className="av-l">{l.slice(0, 4).map((a) => <Cartao key={a.id} a={a} peca={nomes[a.produtoId]} />)}</div>
      </div>
    </section>
  );
}
