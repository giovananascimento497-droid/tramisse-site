// Gravação dos dados da loja no repositório do GitHub (SÓ SERVIDOR).
// O painel /admin altera data/products.json (e envia fotos) com um commit; a Netlify
// percebe o commit e publica o site de novo sozinha (leva ~3 minutos).
// Variáveis (Netlify → Environment variables): GITHUB_TOKEN (token com permissão de
// escrita em "Contents" só neste repositório), GITHUB_REPO (dono/repositório) e GITHUB_BRANCH.
const API = () => process.env.GITHUB_API_URL || "https://api.github.com";
const token = () => (process.env.GITHUB_TOKEN || "").trim();
const repo = () => (process.env.GITHUB_REPO || "giovananascimento497-droid/tramisse-site").trim();
const branch = () => (process.env.GITHUB_BRANCH || "claude/determined-lovelace-33qqkg").trim();

export const githubAtivo = () => Boolean(token());

async function gh(caminho: string, init?: RequestInit) {
  const r = await fetch(`${API()}/repos/${repo()}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tramisse-admin",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(`GitHub ${r.status}: ${corpo.message || "erro"}`) as Error & { status?: number };
    e.status = r.status;
    throw e;
  }
  return corpo;
}

// Lê um arquivo de texto do branch publicado (sempre a versão mais nova, não a do build).
export async function lerArquivo(caminho: string): Promise<{ texto: string; sha: string } | null> {
  try {
    const r = await gh(`/contents/${caminho.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch())}`);
    return { texto: Buffer.from(r.content, "base64").toString("utf8"), sha: r.sha };
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

// Envia um arquivo binário (foto) e devolve o identificador (sha) para usar no commit.
export async function enviarBlob(base64: string): Promise<string> {
  const r = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: base64, encoding: "base64" }) });
  return r.sha as string;
}

export type ArquivoCommit = { caminho: string; texto?: string; blob?: string };

// Um commit com vários arquivos (dados + fotos). Se outro commit entrar no meio, tenta de novo.
export async function commitArquivos(mensagem: string, montar: () => Promise<ArquivoCommit[]>) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch())}`);
    const pai = ref.object.sha as string;
    const commitPai = await gh(`/git/commits/${pai}`);
    const arquivos = await montar();
    const tree = await gh("/git/trees", {
      method: "POST",
      body: JSON.stringify({
        base_tree: commitPai.tree.sha,
        tree: arquivos.map((a) =>
          a.blob ? { path: a.caminho, mode: "100644", type: "blob", sha: a.blob } : { path: a.caminho, mode: "100644", type: "blob", content: a.texto },
        ),
      }),
    });
    const commit = await gh("/git/commits", {
      method: "POST",
      body: JSON.stringify({ message: mensagem, tree: tree.sha, parents: [pai] }),
    });
    try {
      await gh(`/git/refs/heads/${encodeURIComponent(branch())}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
      return commit.sha as string;
    } catch (e) {
      // 422 = o branch andou (outro commit); recomeça com os dados mais novos.
      if ((e as { status?: number }).status !== 422 || tentativa === 2) throw e;
    }
  }
  throw new Error("Não foi possível salvar agora.");
}
