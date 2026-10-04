// Imagens da home editáveis no painel (aba Início) — SÓ SERVIDOR.
// Mexe só em hero.imagem, hero.pecas e fotosHome do data/config.json (o resto fica igual).
import type { Catalogo, Config } from "../types";
import { commitArquivos, lerArquivo } from "./github";
import { ARQ_PRODUTOS } from "./catalogo";

export const ARQ_CONFIG = "data/config.json";
// Fotos de "Compre por categoria" (visual loja).
export const CATEGORIAS_HOME = ["BLUSAS", "CALÇAS", "VESTIDOS", "CONJUNTOS", "SAIAS", "MACACÕES"];
export const IMAGEM_ORIGINAL = "/assets/brand/inicio.jpg";
const IMAGEM = /^\/assets\/(brand|inicio)\/[a-z0-9-]+\.jpg$/;

export type Inicio = { imagem: string; pecas: number[]; fotosHome: Record<string, number> };

export async function lerInicio(): Promise<Inicio> {
  const a = await lerArquivo(ARQ_CONFIG);
  if (!a) throw new Error("data/config.json não encontrado no GitHub.");
  const c = JSON.parse(a.texto) as Config;
  const fotosHome: Record<string, number> = {};
  for (const k of CATEGORIAS_HOME) if (typeof c.fotosHome[k] === "number") fotosHome[k] = c.fotosHome[k] as number;
  return { imagem: c.hero.imagem, pecas: c.hero.pecas ?? [], fotosHome };
}

export async function publicarInicio(d: Inicio, foto: { caminho: string; blob: string } | null) {
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
    c.hero = { ...c.hero, imagem, pecas };
    for (const k of CATEGORIAS_HOME) {
      const v = Number(d.fotosHome?.[k]);
      if (ids.has(v)) c.fotosHome[k] = v;
    }
    const arquivos: { caminho: string; texto?: string; blob?: string }[] = [{ caminho: ARQ_CONFIG, texto: JSON.stringify(c, null, 2) + "\n" }];
    if (foto) arquivos.push({ caminho: `public${foto.caminho}`, blob: foto.blob });
    return arquivos;
  });
}
