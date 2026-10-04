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
