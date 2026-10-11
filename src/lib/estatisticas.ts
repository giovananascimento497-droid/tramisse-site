// Estatísticas do site (só navegador): conta visitas, peças vistas, sacola, checkout e pedidos.
// Só números: sem cookie, sem identificar a pessoa (nada de nome, e-mail ou IP). O servidor
// soma por dia e o painel mostra na aba ESTATÍSTICAS.
export type TipoEvento = "visita" | "peca" | "sacola" | "checkout" | "pedido";

// De onde a visita veio: ?utm_source=... ou o site anterior.
function origem(): string {
  try {
    const u = new URLSearchParams(location.search).get("utm_source");
    if (u) return u.toLowerCase().slice(0, 30);
    const r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    if (!r || r === location.hostname.replace(/^www\./, "")) return "";
    return r;
  } catch {
    return "";
  }
}

// Uma vez por aba aberta (visita e checkout); o resto, sempre.
function primeiraVez(chave: string) {
  try {
    if (sessionStorage.getItem(chave)) return false;
    sessionStorage.setItem(chave, "1");
  } catch {}
  return true;
}

export function registrar(t: TipoEvento, dados: { p?: number; q?: number } = {}) {
  try {
    if (location.pathname.startsWith("/admin")) return;
    if (t === "visita" && !primeiraVez("tv")) return;
    if (t === "checkout" && !primeiraVez("tk")) return;
    const corpo = JSON.stringify({ t, ...dados, ...(t === "visita" ? { o: origem() } : {}) });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/evento", new Blob([corpo], { type: "text/plain" }));
    else fetch("/api/evento", { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo, keepalive: true }).catch(() => {});
  } catch {}
}
