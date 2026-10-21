// Imagens da home editáveis no painel (aba Início) — SÓ SERVIDOR.
// Mexe só em hero.imagem, hero.video, hero.semPecas, hero.pecas, fotosHome e videos do data/config.json (o resto fica igual).
import type { Catalogo, Config } from "../types";
import { commitArquivos, lerArquivo } from "./github";
import { ARQ_PRODUTOS } from "./catalogo";

export const ARQ_CONFIG = "data/config.json";
// Fotos de "Compre por categoria" (visual loja).
export const CATEGORIAS_HOME = ["BLUSAS", "CALÇAS", "VESTIDOS", "CONJUNTOS", "SAIAS", "MACACÕES"];
export const IMAGEM_ORIGINAL = "/assets/brand/inicio.jpg";
const IMAGEM = /^\/assets\/(brand|inicio)\/[a-z0-9-]+\.jpg$/;

const VIDEO = /^\/assets\/videos\/[a-z0-9-]+\.(mp4|webm)$/;
const CAPA = /^\/assets\/videos\/[a-z0-9-]+\.jpg$/;
export const ARQUIVO_NOVO = /^\/assets\/(inicio\/[a-z0-9-]+\.jpg|videos\/[a-z0-9-]+\.(mp4|webm|jpg))$/;

export type VideoHome = { src: string; poster?: string; titulo?: string; produtoId?: number };
export type BannerHome = { imagem: string; mobile?: string; link: string; alt?: string; fundo?: string };
export type Inicio = { imagem: string; video: string; semPecas: boolean; pecas: number[]; fotosHome: Record<string, number>; videos: VideoHome[]; banners: BannerHome[] };
const IMG_INICIO = /^\/assets\/inicio\/[a-z0-9-]+\.jpg$/;
const FUNDO = /^linear-gradient\(#[0-9A-Fa-f]{6},#[0-9A-Fa-f]{6}\)$/;

export async function lerInicio(): Promise<Inicio> {
  const a = await lerArquivo(ARQ_CONFIG);
  if (!a) throw new Error("data/config.json não encontrado no GitHub.");
  const c = JSON.parse(a.texto) as Config;
  const fotosHome: Record<string, number> = {};
  for (const k of CATEGORIAS_HOME) if (typeof c.fotosHome[k] === "number") fotosHome[k] = c.fotosHome[k] as number;
  return {
    imagem: c.hero.imagem, video: c.hero.video ?? "", semPecas: Boolean(c.hero.semPecas), pecas: c.hero.pecas ?? [], fotosHome,
    videos: c.videos.filter((v) => v.src) as VideoHome[],
    banners: c.hero.banners ?? [],
  };
}

// novos: arquivos enviados agora (foto de entrada, vídeos e capas), já guardados no GitHub como blob.
export async function publicarInicio(d: Inicio, foto: { caminho: string; blob: string } | null, novos: { caminho: string; blob: string }[] = []) {
  const imagem = String(d.imagem ?? "");
  if (imagem && !IMAGEM.test(imagem)) throw Object.assign(new Error("Imagem de início inválida."), { validacao: true });
  if (foto && foto.caminho !== imagem) throw Object.assign(new Error("Envie a foto de início de novo."), { validacao: true });
  await commitArquivos("Painel: imagens da home", async () => {
    const [cfgArq, prodArq] = await Promise.all([lerArquivo(ARQ_CONFIG), lerArquivo(ARQ_PRODUTOS)]);
    if (!cfgArq || !prodArq) throw new Error("Arquivos da loja não encontrados no GitHub.");
    const c = JSON.parse(cfgArq.texto) as Config;
    const ids = new Set((JSON.parse(prodArq.texto) as Catalogo).produtos.map((p) => p.id));
    const pecas = [...new Set((Array.isArray(d.pecas) ? d.pecas : []).map(Number))].filter((i) => ids.has(i)).slice(0, 40);
    // Imagem que não veio agora: precisa já existir no site.
    if (imagem && !foto && imagem !== c.hero.imagem && imagem !== IMAGEM_ORIGINAL && !(await lerArquivo(`public${imagem}`)))
      throw Object.assign(new Error("Envie a foto de início de novo."), { validacao: true });
    // Vídeos da seção "Em movimento": os que já estão no site ou os enviados agora (no máximo 12).
    const existentes = new Set(c.videos.flatMap((v) => [v.src, v.poster].filter(Boolean) as string[]));
    const enviados = new Set(novos.map((n) => n.caminho));
    if (Array.isArray(d.videos)) {
      const lista: VideoHome[] = [];
      for (const v of d.videos.slice(0, 12)) {
        const src = String(v?.src ?? "");
        const poster = String(v?.poster ?? "");
        if (!VIDEO.test(src) || (!existentes.has(src) && !enviados.has(src))) throw Object.assign(new Error("Vídeo inválido. Envie de novo."), { validacao: true });
        if (poster && (!CAPA.test(poster) || (!existentes.has(poster) && !enviados.has(poster)))) throw Object.assign(new Error("Capa de vídeo inválida."), { validacao: true });
        const titulo = String(v?.titulo ?? "").trim().slice(0, 40);
        const produtoId = Number(v?.produtoId);
        lista.push({ src, ...(poster ? { poster } : {}), ...(titulo ? { titulo } : {}), ...(ids.has(produtoId) ? { produtoId } : {}) });
      }
      c.videos = lista as Config["videos"];
    }
    // Banners prontos (arte com texto): imagem já no site ou enviada agora; link interno do site.
    if (Array.isArray(d.banners)) {
      const ja = new Set((c.hero.banners ?? []).flatMap((b) => [b.imagem, b.mobile].filter(Boolean) as string[]));
      c.hero.banners = d.banners.slice(0, 8).map((b) => {
        const imagem = String(b?.imagem ?? "");
        const mobile = String(b?.mobile ?? "");
        const ok = (x: string) => IMG_INICIO.test(x) && (ja.has(x) || enviados.has(x));
        if (!ok(imagem) || (mobile && !ok(mobile))) throw Object.assign(new Error("Banner inválido. Envie de novo."), { validacao: true });
        const link = String(b?.link ?? "/categoria/new-in");
        if (!/^\/[a-z0-9\-/]*$/.test(link)) throw Object.assign(new Error("Link de banner inválido."), { validacao: true });
        const alt = String(b?.alt ?? "").trim().slice(0, 120);
        const fundo = String(b?.fundo ?? "");
        return { imagem, ...(mobile ? { mobile } : {}), link, ...(alt ? { alt } : {}), ...(FUNDO.test(fundo) ? { fundo } : {}) };
      });
    }
    // Vídeo da entrada: só um dos vídeos da seção (se tirou o vídeo da lista, a entrada fica sem vídeo).
    let video = String(d.video ?? "");
    if (video && !c.videos.some((v) => v.src === video)) video = "";
    // Sem imagem e sem vídeo, as peças voltam (a entrada nunca fica vazia).
    const semPecas = Boolean(d.semPecas) && Boolean(imagem || video);
    c.hero = { ...c.hero, imagem, video, semPecas, pecas };
    for (const k of CATEGORIAS_HOME) {
      const v = Number(d.fotosHome?.[k]);
      if (ids.has(v)) c.fotosHome[k] = v;
    }
    const arquivos: { caminho: string; texto?: string; blob?: string }[] = [{ caminho: ARQ_CONFIG, texto: JSON.stringify(c, null, 2) + "\n" }];
    if (foto) arquivos.push({ caminho: `public${foto.caminho}`, blob: foto.blob });
    // Só os arquivos novos que ficaram em uso.
    const usados = new Set([...c.videos.flatMap((v) => [v.src, v.poster]), ...(c.hero.banners ?? []).flatMap((b) => [b.imagem, b.mobile])]);
    for (const n of novos) if (usados.has(n.caminho)) arquivos.push({ caminho: `public${n.caminho}`, blob: n.blob });
    return arquivos;
  });
}
