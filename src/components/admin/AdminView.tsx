"use client";

import { useEffect, useMemo, useState } from "react";
import { CFG } from "@/lib/config";
import { brl, precoPix, precoVitrine } from "@/lib/payment/pricing";
import type { Catalogo, Produto, Variante } from "@/lib/types";

type Sessao = { configurado: boolean; github: boolean; logado: boolean };
type FotoNova = { caminho: string; blob: string; preview: string };
type Filtro = "todas" | "venda" | "esgotadas" | "embreve" | "semfoto";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const total = (p: Produto) => p.variantes.reduce((a, v) => a + v.estoque, 0);
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

async function api(caminho: string, init?: RequestInit) {
  const r = await fetch(caminho, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.erro || "Algo deu errado."), { status: r.status });
  return d;
}

// Reduz a foto no próprio navegador (lado maior 1800 px, JPEG) antes de enviar.
async function prepararFoto(arquivo: File): Promise<string> {
  const img = await createImageBitmap(arquivo);
  const k = Math.min(1, 1800 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.86);
}

// Painel da loja: peças, preços, estoque e fotos. As mudanças ficam pendentes até
// "PUBLICAR ALTERAÇÕES"; aí viram um commit no GitHub e a Netlify atualiza o site.
export function AdminView() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [cat, setCat] = useState<Catalogo | null>(null);
  const [originais, setOriginais] = useState<Record<number, Produto>>({});
  const [edits, setEdits] = useState<Record<number, Produto>>({});
  const [fotos, setFotos] = useState<FotoNova[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [ocupado, setOcupado] = useState("");

  const carregarSessao = () => api("/api/admin/sessao").then(setSessao).catch(() => setSessao({ configurado: false, github: false, logado: false }));
  useEffect(() => { carregarSessao(); }, []);

  const carregar = async () => {
    setErro("");
    setOcupado("Carregando o catálogo…");
    try {
      const d = await api("/api/admin/catalogo");
      setCat(d.catalogo);
      setOriginais(Object.fromEntries((d.catalogo as Catalogo).produtos.map((p) => [p.id, p])));
      setEdits({});
      setFotos([]);
    } catch (e) {
      if ((e as { status?: number }).status === 401) setSessao((s) => s && { ...s, logado: false });
      setErro((e as Error).message);
    } finally {
      setOcupado("");
    }
  };
  useEffect(() => { if (sessao?.logado) carregar(); }, [sessao?.logado]);

  // Avisa antes de sair da página com alterações não publicadas.
  const pendentes = Object.keys(edits).length;
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => { if (pendentes) e.preventDefault(); };
    addEventListener("beforeunload", f);
    return () => removeEventListener("beforeunload", f);
  }, [pendentes]);

  const lista: Produto[] = useMemo(() => {
    if (!cat) return [];
    const ids = new Set(cat.produtos.map((p) => p.id));
    const todos = [...cat.produtos.map((p) => edits[p.id] ?? p), ...Object.values(edits).filter((p) => !ids.has(p.id))];
    const q = slugify(busca);
    return todos.filter((p) => {
      if (q && !slugify(p.nome).includes(q)) return false;
      if (filtro === "venda") return !p.emBreve && total(p) > 0;
      if (filtro === "esgotadas") return !p.emBreve && total(p) === 0;
      if (filtro === "embreve") return p.emBreve;
      if (filtro === "semfoto") return !p.imagens.length;
      return true;
    });
  }, [cat, edits, busca, filtro]);

  const atual = sel == null ? null : edits[sel] ?? originais[sel] ?? null;
  const mudar = (p: Produto) => {
    setAviso("");
    setEdits((e) => {
      const o = originais[p.id];
      const n = { ...e };
      if (o && igual(o, p)) delete n[p.id];
      else n[p.id] = p;
      return n;
    });
  };

  const entrar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErro("");
    setOcupado("Entrando…");
    try {
      await api("/api/admin/sessao", { method: "POST", body: JSON.stringify({ senha }) });
      setSenha("");
      await carregarSessao();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado("");
    }
  };
  const sair = async () => {
    if (pendentes && !confirm("Há alterações não publicadas. Sair mesmo assim?")) return;
    await api("/api/admin/sessao", { method: "DELETE" }).catch(() => {});
    setCat(null);
    setEdits({});
    carregarSessao();
  };

  const novaPeca = () => {
    if (!cat) return;
    const id = -Date.now();
    const p: Produto = {
      id, slug: "", nome: "", descricao: "", tecido: "", preco: 0, precoDe: 0, categoria: "roupas", subcategoria: "Blusas",
      estilo: "", colecao: "Coleção atual", flags: { novo: true, curadoria: false, maisVendida: false }, emBreve: false,
      variantes: [{ cor: "un", tamanho: "M", estoque: 1 }], imagens: [],
    };
    setEdits((e) => ({ ...e, [id]: p }));
    setSel(id);
  };

  const publicarTudo = async () => {
    setErro("");
    setAviso("");
    for (const p of Object.values(edits)) {
      if (!p.nome.trim()) return setErro("Toda peça precisa de nome.");
      if (!p.slug) return setErro(`Falta o endereço da peça "${p.nome}".`);
      if (!(p.preco > 0)) return setErro(`Falta o preço da peça "${p.nome}".`);
      if (lista.filter((x) => x.slug === p.slug).length > 1 || cat!.produtos.some((x) => x.slug === p.slug && x.id !== p.id))
        return setErro(`Já existe outra peça com o endereço "${p.slug}". Mude o nome ou o endereço.`);
    }
    setOcupado("Publicando…");
    try {
      const alteracoes = Object.values(edits).map((novo) => ({ original: originais[novo.id] ?? null, novo }));
      await api("/api/admin/catalogo", { method: "POST", body: JSON.stringify({ alteracoes, fotos: fotos.map(({ caminho, blob }) => ({ caminho, blob })) }) });
      setAviso(`Publicado! O site atualiza em uns 3 minutos (${alteracoes.length} ${alteracoes.length === 1 ? "peça alterada" : "peças alteradas"}).`);
      setSel(null);
      await carregar();
      scrollTo(0, 0);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado("");
    }
  };

  const enviarFotos = async (p: Produto, arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    if (!p.slug) return setErro("Dê um nome à peça antes de enviar fotos.");
    setErro("");
    const novas: FotoNova[] = [];
    try {
      for (const [i, a] of [...arquivos].entries()) {
        setOcupado(`Enviando foto ${i + 1} de ${arquivos.length}…`);
        const preview = await prepararFoto(a);
        const r = await api("/api/admin/foto", { method: "POST", body: JSON.stringify({ slug: p.slug, base64: preview }) });
        novas.push({ caminho: r.caminho, blob: r.blob, preview });
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado("");
      if (novas.length) {
        setFotos((f) => [...f, ...novas]);
        mudar({ ...p, imagens: [...p.imagens, ...novas.map((n) => n.caminho)] });
      }
    }
  };
  const srcFoto = (c: string) => fotos.find((f) => f.caminho === c)?.preview ?? c;

  // ---------- Telas ----------
  if (!sessao) return <p style={{ padding: "48px 0" }}>Carregando…</p>;
  if (!sessao.configurado || !sessao.github)
    return (
      <div className="pg adm">
        <h1>Painel Tramisse</h1>
        <p>O painel ainda não está ligado. Na Netlify (Project configuration → Environment variables), crie:</p>
        <ul>
          {!sessao.configurado ? <li><b>ADMIN_SENHA</b>: a senha do painel (pelo menos 8 caracteres).</li> : null}
          {!sessao.github ? <li><b>GITHUB_TOKEN</b>: token do GitHub com permissão de escrita no repositório do site.</li> : null}
        </ul>
        <p>Depois, faça Deploys → Trigger deploy.</p>
      </div>
    );
  if (!sessao.logado)
    return (
      <div className="pg adm" style={{ maxWidth: 420 }}>
        <h1>Painel Tramisse</h1>
        <form className="fg" onSubmit={entrar} style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
          <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" autoFocus /></label>
          <div className="er">{erro}</div>
          <button className="btn" disabled={!!ocupado}>{ocupado || "ENTRAR"}</button>
        </form>
      </div>
    );

  return (
    <div className="adm">
      <div className="adm-top">
        <h1>Painel Tramisse</h1>
        <div className="adm-acoes">
          <button className="btn o" onClick={novaPeca}>+ NOVA PEÇA</button>
          <button className="btn o" onClick={sair}>SAIR</button>
        </div>
      </div>
      {aviso ? <p className="adm-ok">{aviso}</p> : null}
      {erro ? <p className="er" style={{ margin: "8px 0" }}>{erro}</p> : null}

      {atual ? (
        <Editor
          p={atual}
          cat={cat!}
          alterado={!!edits[atual.id]}
          srcFoto={srcFoto}
          onChange={mudar}
          onFotos={(fl) => enviarFotos(atual, fl)}
          onVoltar={() => setSel(null)}
          onDesfazer={() => {
            setEdits((e) => { const n = { ...e }; delete n[atual.id]; return n; });
            if (!originais[atual.id]) setSel(null);
          }}
          slugsUsados={lista.filter((x) => x.id !== atual.id).map((x) => x.slug)}
        />
      ) : (
        <>
          <div className="adm-filtros">
            <input placeholder="Buscar peça…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar peça" />
            <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} aria-label="Filtrar">
              <option value="todas">Todas</option>
              <option value="venda">À venda</option>
              <option value="esgotadas">Esgotadas</option>
              <option value="embreve">Coming soon</option>
              <option value="semfoto">Sem foto</option>
            </select>
          </div>
          {!cat ? <p>{ocupado || "Carregando…"}</p> : null}
          <ul className="adm-lista">
            {lista.map((p) => (
              <li key={p.id}>
                <button onClick={() => { setSel(p.id); scrollTo(0, 0); }}>
                  <span className="adm-th" style={p.imagens[0] ? { backgroundImage: `url(${srcFoto(p.imagens[0])})` } : undefined} />
                  <span className="adm-nm">
                    <b>{p.nome || "(sem nome)"}</b>
                    <small>
                      {p.subcategoria} · {p.preco > 0 ? brl(precoVitrine(CFG, p.preco)) : "sem preço"} ·{" "}
                      {p.emBreve ? "Coming soon" : total(p) ? `${total(p)} em estoque` : "ESGOTADA"}
                      {!p.imagens.length ? " · sem foto" : ""}
                    </small>
                  </span>
                  {edits[p.id] ? <em className="adm-tag">alterada</em> : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {pendentes ? (
        <div className="adm-pub">
          <span>{pendentes} {pendentes === 1 ? "peça alterada" : "peças alteradas"} (ainda não publicado)</span>
          <button className="btn" onClick={publicarTudo} disabled={!!ocupado}>{ocupado || "PUBLICAR ALTERAÇÕES"}</button>
        </div>
      ) : ocupado && cat ? (
        <div className="adm-pub"><span>{ocupado}</span></div>
      ) : null}
    </div>
  );
}

function Editor(props: {
  p: Produto;
  cat: Catalogo;
  alterado: boolean;
  srcFoto: (c: string) => string;
  onChange: (p: Produto) => void;
  onFotos: (f: FileList | null) => void;
  onVoltar: () => void;
  onDesfazer: () => void;
  slugsUsados: string[];
}) {
  const { p, cat, onChange } = props;
  const set = (m: Partial<Produto>) => onChange({ ...p, ...m });
  const novo = p.id < 0;
  const subs = Object.values(cat.categorias).flatMap((c) => Object.entries(c.grupos).map(([g, l]) => [g, l] as const));
  const setVar = (i: number, m: Partial<Variante>) => set({ variantes: p.variantes.map((v, k) => (k === i ? { ...v, ...m } : v)) });
  const mover = (i: number, d: number) => {
    const l = [...p.imagens];
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    set({ imagens: l });
  };
  const vitrine = p.preco > 0 ? precoVitrine(CFG, p.preco) : 0;

  return (
    <div className="adm-ed">
      <p><a href="#" onClick={(e) => { e.preventDefault(); props.onVoltar(); }} style={{ textDecoration: "underline" }}>← Voltar para a lista</a></p>
      <h2>{novo ? "Nova peça" : p.nome}</h2>

      <form className="fg" onSubmit={(e) => e.preventDefault()} style={{ marginTop: 16 }}>
        <label className="s">
          Nome
          <input
            value={p.nome}
            onChange={(e) => {
              const nome = e.target.value;
              // Peça nova: o endereço acompanha o nome. Peça já publicada mantém o endereço (links e fotos).
              set(novo ? { nome, slug: slugify(nome) } : { nome });
            }}
          />
        </label>
        <label className="s">
          Endereço da página
          <input value={p.slug} disabled={!novo} onChange={(e) => set({ slug: slugify(e.target.value) })} />
          <small style={{ color: "var(--mut)" }}>
            tramisse.com.br/produto/{p.slug || "…"}
            {props.slugsUsados.includes(p.slug) ? <b style={{ color: "#8a3b2e" }}> · já existe outra peça com esse endereço</b> : null}
          </small>
        </label>
        <label>
          Categoria
          <select value={p.subcategoria} onChange={(e) => set({ subcategoria: e.target.value })}>
            {subs.map(([g, l]) => (
              <optgroup key={g} label={g}>{l.map((s) => <option key={s}>{s}</option>)}</optgroup>
            ))}
          </select>
        </label>
        <label>
          Estilo (opcional)
          <input value={p.estilo} placeholder="Ex.: Office, Night" onChange={(e) => set({ estilo: e.target.value })} />
        </label>
        <label>
          Preço base (R$)
          <input type="number" inputMode="decimal" min="0" step="0.01" value={p.preco || ""} onChange={(e) => set({ preco: Number(e.target.value) })} />
          <small style={{ color: "var(--mut)" }}>
            {vitrine ? <>Na loja: <b>{brl(vitrine)}</b> (com os 5% do cartão) · Pix: {brl(precoPix(CFG, vitrine))}</> : "O site soma 5% e arredonda para ,90."}
          </small>
        </label>
        <label>
          Preço &quot;de&quot; (promoção, opcional)
          <input type="number" inputMode="decimal" min="0" step="0.01" value={p.precoDe || ""} onChange={(e) => set({ precoDe: Number(e.target.value) })} />
          <small style={{ color: "var(--mut)" }}>Preencha só se a peça estiver em promoção (vai para a Sale).</small>
        </label>
        <label className="s">
          Descrição
          <textarea rows={4} value={p.descricao} onChange={(e) => set({ descricao: e.target.value })} />
        </label>
        <label className="s">
          Tecido / composição
          <input value={p.tecido} onChange={(e) => set({ tecido: e.target.value })} />
        </label>
        <div className="s adm-flags">
          <label><input type="checkbox" checked={p.flags.novo} onChange={(e) => set({ flags: { ...p.flags, novo: e.target.checked } })} /> New In</label>
          <label><input type="checkbox" checked={p.flags.curadoria} onChange={(e) => set({ flags: { ...p.flags, curadoria: e.target.checked } })} /> Curadoria</label>
          <label><input type="checkbox" checked={p.flags.maisVendida} onChange={(e) => set({ flags: { ...p.flags, maisVendida: e.target.checked } })} /> Mais desejada</label>
          <label><input type="checkbox" checked={!!p.emBreve} onChange={(e) => set({ emBreve: e.target.checked })} /> Coming soon (ainda não chegou)</label>
        </div>
      </form>

      <h3>Estoque por cor e tamanho</h3>
      <div className="adm-vars">
        {p.variantes.map((v, i) => (
          <div key={i} className="adm-var">
            <select value={v.cor} onChange={(e) => setVar(i, { cor: e.target.value })} aria-label="Cor">
              {Object.entries(cat.cores).map(([k, c]) => <option key={k} value={k}>{c.nome}</option>)}
            </select>
            <input value={v.tamanho} onChange={(e) => setVar(i, { tamanho: e.target.value.toUpperCase() })} aria-label="Tamanho" placeholder="Tam." />
            <span className="qty">
              <button type="button" onClick={() => setVar(i, { estoque: Math.max(0, v.estoque - 1) })} aria-label="Diminuir">−</button>
              <span>{v.estoque}</span>
              <button type="button" onClick={() => setVar(i, { estoque: v.estoque + 1 })} aria-label="Aumentar">+</button>
            </span>
            <button type="button" className="adm-x" onClick={() => set({ variantes: p.variantes.filter((_, k) => k !== i) })} aria-label="Remover" disabled={p.variantes.length === 1}>×</button>
          </div>
        ))}
        <button type="button" className="btn o" onClick={() => set({ variantes: [...p.variantes, { cor: p.variantes.at(-1)?.cor ?? "un", tamanho: "", estoque: 1 }] })}>
          + COR / TAMANHO
        </button>
        <small style={{ color: "var(--mut)", display: "block", marginTop: 8 }}>
          Vendeu fora do site? Diminua aqui. Pagamentos aprovados no Mercado Pago já baixam o estoque sozinhos.
        </small>
      </div>

      <h3>Fotos</h3>
      <p style={{ color: "var(--mut)", fontSize: 13 }}>A primeira é a capa. Use as setas para mudar a ordem.</p>
      <div className="adm-fotos">
        {p.imagens.map((img, i) => (
          <div key={img} className="adm-foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.srcFoto(img)} alt={`Foto ${i + 1}`} />
            <div>
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Mover para a esquerda">←</button>
              <button type="button" onClick={() => set({ imagens: p.imagens.filter((x) => x !== img) })} aria-label="Remover foto">×</button>
              <button type="button" onClick={() => mover(i, 1)} disabled={i === p.imagens.length - 1} aria-label="Mover para a direita">→</button>
            </div>
          </div>
        ))}
        <label className="adm-add">
          + Adicionar fotos
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { props.onFotos(e.target.files); e.target.value = ""; }} />
        </label>
      </div>

      <p style={{ marginTop: 32, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" onClick={props.onVoltar}>OK, VOLTAR PARA A LISTA</button>
        {props.alterado ? <button className="btn o" onClick={props.onDesfazer}>{novo ? "DESCARTAR PEÇA" : "DESFAZER ALTERAÇÕES"}</button> : null}
        {!novo ? <a className="btn o" href={`/produto/${p.slug}`} target="_blank" rel="noopener">VER NO SITE</a> : null}
      </p>
    </div>
  );
}
