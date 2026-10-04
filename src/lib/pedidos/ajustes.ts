// Dados da loja que não podem ficar no GitHub (repositório pode ser público), como o endereço
// de quem envia as encomendas. Guardados no Netlify Blobs (store "loja"), privado. SÓ SERVIDOR.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";

export type Remetente = {
  nome: string; telefone: string; email: string; documento: string; // CPF ou CNPJ
  endereco: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; cep: string;
};
export const CAMPOS_REMETENTE: (keyof Remetente)[] = ["nome", "telefone", "email", "documento", "endereco", "numero", "complemento", "bairro", "cidade", "uf", "cep"];
export const OBRIG_REMETENTE: (keyof Remetente)[] = ["nome", "telefone", "email", "documento", "endereco", "numero", "bairro", "cidade", "uf", "cep"];

async function ler<T>(chave: string): Promise<T | null> {
  if (process.env.PEDIDOS_DIR)
    return readFile(path.join(process.env.PEDIDOS_DIR, "_loja", `${chave}.json`), "utf8").then((t) => JSON.parse(t) as T).catch(() => null);
  return ((await getStore({ name: "loja", consistency: "strong" }).get(chave, { type: "json" })) as T | null) ?? null;
}
async function gravar(chave: string, v: unknown) {
  if (process.env.PEDIDOS_DIR) {
    const dir = path.join(process.env.PEDIDOS_DIR, "_loja");
    await mkdir(dir, { recursive: true });
    return writeFile(path.join(dir, `${chave}.json`), JSON.stringify(v));
  }
  await getStore({ name: "loja", consistency: "strong" }).setJSON(chave, v);
}

export const lerRemetente = () => ler<Remetente>("remetente");
export function limparRemetente(d: unknown): Remetente | { erro: string } {
  const o = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
  const r = Object.fromEntries(CAMPOS_REMETENTE.map((k) => [k, String(o[k] ?? "").trim().slice(0, 120)])) as Remetente;
  r.uf = r.uf.toUpperCase().slice(0, 2);
  r.cep = r.cep.replace(/\D/g, "");
  r.documento = r.documento.replace(/\D/g, "");
  if (OBRIG_REMETENTE.some((k) => !r[k])) return { erro: "Preencha todos os campos (só o complemento é opcional)." };
  if (r.cep.length !== 8) return { erro: "CEP inválido." };
  if (![11, 14].includes(r.documento.length)) return { erro: "CPF ou CNPJ inválido." };
  return r;
}
export const gravarRemetente = (r: Remetente) => gravar("remetente", r);
