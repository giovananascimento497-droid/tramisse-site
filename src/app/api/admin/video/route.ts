import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";
import { enviarBlob } from "@/lib/admin/github";
import { exigirLogin } from "@/lib/admin/rota";

export const dynamic = "force-dynamic";
export const maxDuration = 26;

// Envio de vídeo pelo painel, em partes (cada pedido tem limite de tamanho na Netlify).
// "parte": guarda um pedaço no Netlify Blobs (store "uploads"); "fim": junta, confere e guarda o
// vídeo e a capa no GitHub (blob), devolvendo os caminhos para publicar junto com a aba Início.
const MAX_PARTES = 20;
const MAX_BYTES = 40 * 1024 * 1024;
const ID = /^[a-z0-9]{8,24}$/;

type Partes = { get(k: string): Promise<Buffer | null>; set(k: string, b: Buffer): Promise<void>; del(k: string): Promise<void> };
function partes(): Partes {
  if (process.env.PEDIDOS_DIR) {
    const dir = path.join(process.env.PEDIDOS_DIR, "_uploads");
    const f = (k: string) => path.join(dir, k.replace(/\//g, "_"));
    return {
      get: (k) => readFile(f(k)).catch(() => null),
      set: async (k, b) => { await mkdir(dir, { recursive: true }); await writeFile(f(k), b); },
      del: async (k) => { await rm(f(k), { force: true }); },
    };
  }
  const s = getStore({ name: "uploads", consistency: "strong" });
  return {
    get: async (k) => {
      const a = (await s.get(k, { type: "arrayBuffer" })) as ArrayBuffer | null;
      return a ? Buffer.from(a) : null;
    },
    set: async (k, b) => { await s.set(k, new Uint8Array(b).buffer as ArrayBuffer); },
    del: async (k) => { await s.delete(k); },
  };
}

const erro = (msg: string, status = 400) => NextResponse.json({ erro: msg }, { status });

export async function POST(req: Request) {
  const negado = await exigirLogin(req);
  if (negado) return negado;
  const d = await req.json().catch(() => null);
  if (!d || !ID.test(String(d.id))) return erro("Envio inválido.");
  const p = partes();
  try {
    if (d.acao === "parte") {
      const i = Number(d.i);
      if (!Number.isInteger(i) || i < 0 || i >= MAX_PARTES) return erro("Vídeo grande demais.");
      const b = Buffer.from(String(d.base64 || ""), "base64");
      if (!b.length || b.length > 4 * 1024 * 1024) return erro("Parte inválida.");
      await p.set(`${d.id}/${i}`, b);
      return NextResponse.json({ ok: true });
    }
    if (d.acao === "fim") {
      const total = Number(d.total);
      const ext = d.ext === "webm" ? "webm" : "mp4";
      if (!Number.isInteger(total) || total < 1 || total > MAX_PARTES) return erro("Envio inválido.");
      const bufs: Buffer[] = [];
      for (let i = 0; i < total; i++) {
        const b = await p.get(`${d.id}/${i}`);
        if (!b) return erro("Uma parte do vídeo se perdeu. Envie de novo.");
        bufs.push(b);
      }
      const video = Buffer.concat(bufs);
      // Confere que é mesmo um vídeo MP4 ou WebM.
      const ok = ext === "mp4" ? video.subarray(4, 8).toString("latin1") === "ftyp" : video.readUInt32BE(0) === 0x1a45dfa3;
      if (!ok) return erro("O arquivo não parece um vídeo. Tente outro.");
      if (video.length > MAX_BYTES) return erro("Vídeo grande demais (máximo 40 MB). Use um vídeo mais curto.");
      const capa = Buffer.from(String(d.capa || "").replace(/^data:image\/jpeg;base64,/, ""), "base64");
      if (capa.length < 1000 || capa[0] !== 0xff || capa[1] !== 0xd8) return erro("Capa do vídeo inválida.");
      const nome = `v-${Date.now().toString(36)}`;
      const [blobVideo, blobCapa] = await Promise.all([enviarBlob(video.toString("base64")), enviarBlob(capa.toString("base64"))]);
      await Promise.all(Array.from({ length: total }, (_, i) => p.del(`${d.id}/${i}`).catch(() => {})));
      return NextResponse.json({
        src: `/assets/videos/${nome}.${ext}`,
        poster: `/assets/videos/${nome}.jpg`,
        novos: [{ caminho: `/assets/videos/${nome}.${ext}`, blob: blobVideo }, { caminho: `/assets/videos/${nome}.jpg`, blob: blobCapa }],
      });
    }
    return erro("Ação inválida.");
  } catch (e) {
    console.error(e);
    return erro(`Não foi possível enviar o vídeo. [${e instanceof Error ? e.message : "erro"}]`, 502);
  }
}
