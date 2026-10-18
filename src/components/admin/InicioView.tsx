"use client";

import { useEffect, useMemo, useState } from "react";
import { CFG } from "@/lib/config";
import { brl, precoVitrine } from "@/lib/payment/pricing";
import type { Catalogo, Produto } from "@/lib/types";
import { api, enviarVideo, MAX_SEGUNDOS_VIDEO, prepararFoto, prepararVideo } from "./util";

type VideoHome = { src: string; poster?: string; titulo?: string; produtoId?: number };
type Inicio = { imagem: string; video: string; semPecas: boolean; pecas: number[]; fotosHome: Record<string, number>; videos: VideoHome[] };
type FotoNova = { caminho: string; blob: string; preview: string };

const ORIGINAL = "/assets/brand/inicio.jpg";
const CATEGORIAS = ["BLUSAS", "CALÇAS", "VESTIDOS", "CONJUNTOS", "SAIAS", "MACACÕES"];
const estoque = (p: Produto) => p.variantes.reduce((a, v) => a + v.estoque, 0);
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Aba "Início" do painel: imagem de entrada da home, peças que se revezam no banner e
// fotos de "Compre por categoria". Publica com um commit (o site atualiza em ~3 minutos).
export function InicioView({ cat, onSair }: { cat: Catalogo; onSair: () => void }) {
  const [orig, setOrig] = useState<Inicio | null>(null);
  const [ed, setEd] = useState<Inicio | null>(null);
  const [foto, setFoto] = useState<FotoNova | null>(null);
  const [ultimaImagem, setUltimaImagem] = useState(ORIGINAL);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [add, setAdd] = useState("");
  // Vídeos enviados agora (ainda não publicados) e a prévia local deles.
  const [novos, setNovos] = useState<{ caminho: string; blob: string }[]>([]);
  const [previas, setPrevias] = useState<Record<string, string>>({});
  const [envioVideo, setEnvioVideo] = useState("");

  const carregar = async () => {
    setErro("");
    try {
      const d = await api("/api/admin/inicio");
      setOrig(d.inicio);
      setEd(d.inicio);
      setFoto(null);
      if (d.inicio.imagem) setUltimaImagem(d.inicio.imagem);
    } catch (e) {
      if ((e as { status?: number }).status === 401) return onSair();
      setErro((e as Error).message);
    }
  };
  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const comFoto = useMemo(() => cat.produtos.filter((p) => p.imagens.length && !p.emBreve).sort((a, b) => a.nome.localeCompare(b.nome)), [cat]);
  const porId = (id: number) => cat.produtos.find((p) => p.id === id);
  const noBanner = (p: Produto) => p.imagens.length > 0 && !p.emBreve && estoque(p) > 0;

  if (!ed || !orig) return erro ? <p className="er">{erro}</p> : <p>Carregando…</p>;
  const mudou = !igual(ed, orig);
  const set = (m: Partial<Inicio>) => { setAviso(""); setEd({ ...ed, ...m }); };
  const src = (c: string) => (foto?.caminho === c ? foto.preview : c);

  const trocarFoto = async (arquivos: FileList | null) => {
    const a = arquivos?.[0];
    if (!a) return;
    setErro("");
    setOcupado("Enviando a foto…");
    try {
      const preview = await prepararFoto(a, 2600);
      const r = await api("/api/admin/foto", { method: "POST", body: JSON.stringify({ slug: "inicio", pasta: "inicio", base64: preview }) });
      setFoto({ caminho: r.caminho, blob: r.blob, preview });
      setUltimaImagem(r.caminho);
      set({ imagem: r.caminho });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado("");
    }
  };

  const mover = (i: number, d: number) => {
    const l = [...ed.pecas];
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    set({ pecas: l });
  };

  const moverVideo = (i: number, d: number) => {
    const l = [...ed.videos];
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    set({ videos: l });
  };
  const tirarVideo = (i: number) => {
    const v = ed.videos[i];
    if (!confirm("Tirar este vídeo do site?")) return;
    set({ videos: ed.videos.filter((_, k) => k !== i), ...(ed.video === v.src ? { video: "" } : {}) });
  };
  const adicionarVideo = async (arquivo?: File) => {
    if (!arquivo) return;
    setErro("");
    try {
      setEnvioVideo("Preparando o vídeo… 0%");
      const pronto = await prepararVideo(arquivo, (p) => setEnvioVideo(`Preparando o vídeo… ${Math.round(p * 100)}%`));
      setEnvioVideo("Enviando… 0%");
      const r = await enviarVideo(pronto, (p) => setEnvioVideo(`Enviando… ${Math.round(p * 100)}%`));
      setNovos((n) => [...n, ...r.novos]);
      setPrevias((x) => ({ ...x, [r.src]: URL.createObjectURL(pronto.video) }));
      setEd((e) => e && { ...e, videos: [...e.videos, { src: r.src, poster: r.poster, titulo: "Tramisse" }] });
      setAviso("");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnvioVideo("");
    }
  };

  const publicar = async () => {
    setErro("");
    setOcupado("Publicando…");
    try {
      await api("/api/admin/inicio", {
        method: "POST",
        body: JSON.stringify({ inicio: ed, foto: foto && ed.imagem === foto.caminho ? { caminho: foto.caminho, blob: foto.blob } : null, novos }),
      });
      setOrig(ed);
      setNovos([]);
      setAviso("Publicado! O site atualiza em uns 3 minutos.");
      scrollTo(0, 0);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado("");
    }
  };

  // Peças do banner: escolhidas (na ordem) ou automático (todas com foto e estoque).
  const automatico = ed.pecas.length === 0;
  const listaBanner = automatico ? cat.produtos.filter(noBanner) : ed.pecas.map(porId).filter((p): p is Produto => !!p);

  return (
    <div className="adm-ini">
      {aviso ? <p className="adm-ok">{aviso}</p> : null}
      {erro ? <p className="er" style={{ margin: "8px 0" }}>{erro}</p> : null}

      <h3 style={{ marginTop: 8 }}>Imagem de entrada</h3>
      <p className="adm-dica">É a primeira imagem da home, com o logo no centro e a frase embaixo. Use uma foto na horizontal e com o centro limpo: no celular aparece só a parte do meio.</p>
      {ed.imagem ? (
        <div className="adm-prev">
          <figure>
            <div className="adm-tela pc"><img src={src(ed.imagem)} alt="" /><span className="adm-lg" /></div>
            <figcaption>No computador</figcaption>
          </figure>
          <figure>
            <div className="adm-tela cel"><img src={src(ed.imagem)} alt="" /><span className="adm-lg" /></div>
            <figcaption>No celular</figcaption>
          </figure>
        </div>
      ) : (
        <p className="adm-ok">Sem imagem de entrada: a home começa direto nas peças.</p>
      )}
      <div className="adm-bts">
        <label className="btn o">
          {ocupado === "Enviando a foto…" ? ocupado : "TROCAR FOTO"}
          <input type="file" accept="image/*" hidden onChange={(e) => { trocarFoto(e.target.files); e.target.value = ""; }} />
        </label>
        {ed.imagem && ed.imagem !== ORIGINAL ? <button className="btn o" onClick={() => set({ imagem: ORIGINAL })}>VOLTAR PARA A ORIGINAL</button> : null}
        {ed.imagem ? (
          <button className="btn o" onClick={() => set({ imagem: "" })}>TIRAR A IMAGEM DE ENTRADA</button>
        ) : (
          <button className="btn o" onClick={() => set({ imagem: ultimaImagem })}>MOSTRAR A IMAGEM DE ENTRADA</button>
        )}
      </div>

      <h3>Vídeos</h3>
      <p className="adm-dica">
        Os vídeos aparecem na seção &quot;Em movimento&quot; da home. Marque <b>Na entrada</b> no vídeo que deve passar na primeira tela,
        alternando com a imagem (ela fica 6 segundos, o vídeo passa inteiro e sem som). Vídeos de até {MAX_SEGUNDOS_VIDEO} segundos;
        de preferência na vertical.
      </p>
      <div className="adm-vids">
        <label className={!ed.video ? "on" : ""}>
          <span className="adm-vid-sem">Sem vídeo na entrada</span>
          <span><input type="radio" checked={!ed.video} onChange={() => set({ video: "" })} /> Só a imagem</span>
        </label>
        {ed.videos.map((v, i) => (
          <div key={v.src} className={`adm-vid${ed.video === v.src ? " on" : ""}`}>
            <video src={previas[v.src] ?? v.src} poster={previas[v.src] ? undefined : v.poster} muted loop playsInline autoPlay preload="metadata" />
            <label><input type="radio" checked={ed.video === v.src} onChange={() => set({ video: v.src })} /> Na entrada</label>
            <input
              className="adm-vid-tit"
              value={v.titulo ?? ""}
              placeholder="Texto embaixo"
              aria-label="Texto embaixo do vídeo"
              onChange={(e) => set({ videos: ed.videos.map((x, k) => (k === i ? { ...x, titulo: e.target.value } : x)) })}
            />
            <select
              value={v.produtoId ?? ""}
              aria-label="Peça do vídeo"
              onChange={(e) => set({ videos: ed.videos.map((x, k) => (k === i ? { ...x, produtoId: e.target.value ? Number(e.target.value) : undefined } : x)) })}
            >
              <option value="">Sem link de peça</option>
              {cat.produtos.filter((p) => !p.emBreve).sort((a, b) => a.nome.localeCompare(b.nome)).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <span className="adm-ord">
              <button type="button" onClick={() => moverVideo(i, -1)} disabled={i === 0} aria-label="Mover para a esquerda">←</button>
              <button type="button" onClick={() => tirarVideo(i)} aria-label="Tirar vídeo">×</button>
              <button type="button" onClick={() => moverVideo(i, 1)} disabled={i === ed.videos.length - 1} aria-label="Mover para a direita">→</button>
            </span>
          </div>
        ))}
        <label className={`adm-add adm-vid-add${envioVideo ? " ocupado" : ""}`}>
          {envioVideo || "+ Adicionar vídeo"}
          <input type="file" accept="video/*" hidden disabled={!!envioVideo} onChange={(e) => { adicionarVideo(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>
      {envioVideo ? <p className="adm-dica" style={{ marginTop: 8 }}>Deixe esta tela aberta até terminar.</p> : null}

      <h3>Peças do banner</h3>
      <p className="adm-dica">Depois da imagem e do vídeo, as peças podem se revezar uma por vez (a cada 5 segundos), com a primeira foto de cada uma. Peça esgotada sai do banner sozinha.</p>
      <div className="adm-flags" style={{ marginBottom: 12 }}>
        <label><input type="radio" checked={ed.semPecas} onChange={() => set({ semPecas: true })} /> Não mostrar peças (só a imagem e o vídeo)</label>
        <label><input type="radio" checked={!ed.semPecas && automatico} onChange={() => set({ semPecas: false, pecas: [] })} /> Automático (todas as peças com foto e estoque)</label>
        <label><input type="radio" checked={!ed.semPecas && !automatico} onChange={() => set({ semPecas: false, pecas: automatico ? cat.produtos.filter(noBanner).slice(0, 6).map((p) => p.id) : ed.pecas })} /> Escolher as peças e a ordem</label>
      </div>
      <div hidden={ed.semPecas}>
      {automatico ? (
        <div className="adm-mini">
          {listaBanner.map((p) => <span key={p.id} className="adm-th" title={p.nome} style={{ backgroundImage: `url(${p.imagens[0]})` }} />)}
          <small>{listaBanner.length} peças se revezando</small>
        </div>
      ) : null}
      <ul className="adm-ul" hidden={automatico}>
        {listaBanner.map((p, i) => (
          <li key={p.id} className="adm-ln">
            <span className="adm-th" style={{ backgroundImage: `url(${p.imagens[0]})` }} />
            <span className="adm-nm">
              <b>{automatico ? "" : `${i + 1}. `}{p.nome}</b>
              <small>{brl(precoVitrine(CFG, p.preco))}{noBanner(p) ? "" : " · não aparece agora (esgotada ou sem foto)"}</small>
            </span>
            {automatico ? null : (
              <span className="adm-ord">
                <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                <button onClick={() => mover(i, 1)} disabled={i === listaBanner.length - 1} aria-label="Descer">↓</button>
                <button onClick={() => set({ pecas: ed.pecas.filter((x) => x !== p.id) })} aria-label="Tirar do banner">×</button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {!automatico ? (
        <div className="adm-filtros" style={{ marginTop: 12 }}>
          <select value={add} onChange={(e) => setAdd(e.target.value)} aria-label="Peça para adicionar">
            <option value="">Escolha uma peça para adicionar…</option>
            {comFoto.filter((p) => !ed.pecas.includes(p.id)).map((p) => (
              <option key={p.id} value={p.id}>{p.nome}{estoque(p) ? "" : " (esgotada)"}</option>
            ))}
          </select>
          <button className="btn o" disabled={!add} onClick={() => { set({ pecas: [...ed.pecas, Number(add)] }); setAdd(""); }}>+ ADICIONAR</button>
        </div>
      ) : null}

      </div>

      <h3>Fotos de &quot;Compre por categoria&quot;</h3>
      <p className="adm-dica">Escolha de qual peça vem a foto de cada categoria (usa a primeira foto da peça).</p>
      <div className="adm-cats">
        {CATEGORIAS.map((k) => {
          const p = porId(ed.fotosHome[k]);
          return (
            <label key={k}>
              <span className="adm-cat-img" style={p?.imagens[0] ? { backgroundImage: `url(${p.imagens[0]})` } : undefined} />
              <b>{k}</b>
              <select value={ed.fotosHome[k] ?? ""} onChange={(e) => set({ fotosHome: { ...ed.fotosHome, [k]: Number(e.target.value) } })}>
                {!p ? <option value="">Escolha…</option> : null}
                {comFoto.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
              </select>
            </label>
          );
        })}
      </div>

      {mudou ? (
        <div className="adm-pub">
          <span>Imagens da home alteradas (ainda não publicado)</span>
          <span style={{ display: "flex", gap: 8 }}>
            <button className="btn o" onClick={() => { setEd(orig); setFoto(null); setNovos([]); }} disabled={!!ocupado || !!envioVideo}>DESFAZER</button>
            <button className="btn" onClick={publicar} disabled={!!ocupado || !!envioVideo}>{ocupado === "Publicando…" ? ocupado : "PUBLICAR"}</button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
