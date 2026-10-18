// Entrega em Belém por bairro, editável no painel (aba ENTREGA) — SÓ SERVIDOR.
// Mexe só em entrega.belem do data/config.json.
import type { Config } from "../types";
import { commitArquivos, lerArquivo } from "./github";
import { ARQ_CONFIG } from "./inicio";

export type Belem = NonNullable<Config["entrega"]["belem"]>;

export async function lerBelem(): Promise<Belem | null> {
  const a = await lerArquivo(ARQ_CONFIG);
  if (!a) throw new Error("data/config.json não encontrado no GitHub.");
  return (JSON.parse(a.texto) as Config).entrega.belem ?? null;
}

const erro = (m: string) => Object.assign(new Error(m), { validacao: true });

export function limparBelem(d: unknown): Belem {
  const o = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
  const faixas = (Array.isArray(o.faixas) ? o.faixas : []).slice(0, 10).map((f) => {
    const x = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
    const nome = String(x.nome ?? "").trim().slice(0, 30);
    const valor = Math.round(Number(x.valor) * 100) / 100;
    const bairros = [...new Set((Array.isArray(x.bairros) ? x.bairros : []).map((b) => String(b).trim().slice(0, 60)).filter(Boolean))].slice(0, 200);
    if (!nome) throw erro("Toda faixa precisa de nome.");
    if (!(valor >= 0) || valor > 500) throw erro(`Valor inválido na faixa "${nome}".`);
    return { nome, valor, bairros };
  });
  // O mesmo bairro não pode estar em duas faixas.
  const vistos = new Map<string, string>();
  for (const f of faixas)
    for (const b of f.bairros) {
      const k = b.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (vistos.has(k)) throw erro(`O bairro "${b}" está em duas faixas (${vistos.get(k)} e ${f.nome}).`);
      vistos.set(k, f.nome);
    }
  return {
    ativo: Boolean(o.ativo),
    nome: String(o.nome ?? "Entrega em Belém (sábado)").trim().slice(0, 50) || "Entrega em Belém (sábado)",
    aviso: String(o.aviso ?? "").trim().slice(0, 300),
    faixas,
  };
}

export async function publicarBelem(b: Belem) {
  await commitArquivos("Painel: entrega em Belém por bairro", async () => {
    const a = await lerArquivo(ARQ_CONFIG);
    if (!a) throw new Error("data/config.json não encontrado no GitHub.");
    const c = JSON.parse(a.texto) as Config & { entrega: { belem?: Belem & { _comentario?: string } } };
    c.entrega.belem = { ...(c.entrega.belem?._comentario ? { _comentario: c.entrega.belem._comentario } : {}), ...b };
    return [{ caminho: ARQ_CONFIG, texto: JSON.stringify(c, null, 2) + "\n" }];
  });
}
