// Funções do painel usadas pelas abas (só navegador).

export async function api(caminho: string, init?: RequestInit) {
  const r = await fetch(caminho, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.erro || "Algo deu errado."), { status: r.status });
  return d;
}

// Reduz a foto no próprio navegador (lado maior 1800 px, JPEG) antes de enviar.
export async function prepararFoto(arquivo: File, max = 1800): Promise<string> {
  const img = await createImageBitmap(arquivo);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.86);
}

// Prepara um vídeo no próprio navegador antes de enviar: refaz em até 720 px de largura, sem som,
// em MP4 (H.264, toca em qualquer celular) e tira a capa (JPEG). O vídeo toca uma vez na tela
// enquanto é refeito, por isso leva o mesmo tempo do vídeo (no máximo 60 s).
const TIPOS_VIDEO = ["video/mp4;codecs=avc1.42E01F", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
export const MAX_SEGUNDOS_VIDEO = 60;

export async function prepararVideo(arquivo: File, progresso: (p: number) => void): Promise<{ video: Blob; capa: string; ext: "mp4" | "webm" }> {
  const tipo = typeof MediaRecorder !== "undefined" ? TIPOS_VIDEO.find((t) => MediaRecorder.isTypeSupported(t)) : undefined;
  if (!tipo) throw new Error("Este navegador não consegue preparar vídeos. Use o Chrome ou o Safari atualizados.");
  const url = URL.createObjectURL(arquivo);
  const v = document.createElement("video");
  v.src = url;
  v.muted = true;
  v.playsInline = true;
  try {
    await new Promise<void>((ok, falha) => {
      v.onloadedmetadata = () => ok();
      v.onerror = () => falha(new Error("Não foi possível abrir este vídeo. Tente outro (MP4 ou MOV)."));
    });
    const k = Math.min(1, 720 / Math.min(v.videoWidth, v.videoHeight) || 1);
    const c = document.createElement("canvas");
    c.width = Math.round((v.videoWidth * k) / 2) * 2;
    c.height = Math.round((v.videoHeight * k) / 2) * 2;
    const ctx = c.getContext("2d")!;
    const fim = Math.min(v.duration || MAX_SEGUNDOS_VIDEO, MAX_SEGUNDOS_VIDEO);
    const stream = c.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: tipo, videoBitsPerSecond: 2_500_000 });
    const pedacos: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) pedacos.push(e.data); };
    let capa = "";
    let rodando = true;
    const desenhar = () => {
      if (!rodando) return;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      if (!capa && v.currentTime >= Math.min(0.5, fim / 2)) capa = c.toDataURL("image/jpeg", 0.85);
      progresso(Math.min(0.99, v.currentTime / fim));
      if (v.currentTime >= fim || v.ended) return parar();
      requestAnimationFrame(desenhar);
    };
    const terminou = new Promise<void>((ok) => { rec.onstop = () => ok(); });
    const parar = () => { if (!rodando) return; rodando = false; v.pause(); rec.stop(); };
    v.onended = parar;
    rec.start(1000);
    await v.play();
    requestAnimationFrame(desenhar);
    await terminou;
    if (!capa) capa = c.toDataURL("image/jpeg", 0.85);
    progresso(1);
    return { video: new Blob(pedacos, { type: tipo.split(";")[0] }), capa, ext: tipo.startsWith("video/mp4") ? "mp4" : "webm" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Envia o vídeo preparado em partes de 3 MB e devolve os caminhos (vídeo e capa) para publicar.
export async function enviarVideo(
  v: { video: Blob; capa: string; ext: "mp4" | "webm" },
  progresso: (p: number) => void,
): Promise<{ src: string; poster: string; novos: { caminho: string; blob: string }[] }> {
  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const TAM = 3 * 1024 * 1024;
  const total = Math.ceil(v.video.size / TAM);
  if (total > 13) throw new Error("Vídeo grande demais. Use um vídeo mais curto (até 1 minuto).");
  for (let i = 0; i < total; i++) {
    const parte = v.video.slice(i * TAM, (i + 1) * TAM);
    const base64 = await new Promise<string>((ok, falha) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result).split(",")[1] || "");
      r.onerror = () => falha(new Error("Não foi possível ler o vídeo."));
      r.readAsDataURL(parte);
    });
    await api("/api/admin/video", { method: "POST", body: JSON.stringify({ acao: "parte", id, i, base64 }) });
    progresso((i + 1) / (total + 1));
  }
  const r = await api("/api/admin/video", { method: "POST", body: JSON.stringify({ acao: "fim", id, total, ext: v.ext, capa: v.capa }) });
  progresso(1);
  return r;
}
