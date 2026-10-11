import { NextResponse } from "next/server";
import { origemEstranha } from "@/lib/admin/rota";
import { porId } from "@/lib/catalog";
import { gravarEvento, type Evento } from "@/lib/pedidos/estatisticas";

export const dynamic = "force-dynamic";

const TIPOS = ["visita", "peca", "sacola", "checkout", "pedido"];
const ROBO = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp\/|curl|wget|python|node-fetch/i;

// Origem conhecida pelo nome do site anterior (ou pelo navegador do app, como o do Instagram).
function nomeOrigem(o: string, ua: string) {
  const x = `${o} ${ua}`.toLowerCase();
  if (/instagram/.test(x)) return "Instagram";
  if (/fban|fbav|facebook|fb\.com|\bfb\b/.test(x)) return "Facebook";
  if (/tiktok|musical_ly|bytedance/.test(x)) return "TikTok";
  if (/pinterest|pin\.it/.test(x)) return "Pinterest";
  if (/whatsapp|wa\.me/.test(x)) return "WhatsApp";
  if (/google\./.test(o) || o === "google") return "Google";
  if (/bing|yahoo|duckduckgo|ecosia/.test(o)) return "Outras buscas";
  if (!o) return "Direto (link ou digitado)";
  return o.slice(0, 40);
}

// Recebe um evento do site (visita, peça vista, sacola, checkout, pedido). Só conta; não identifica ninguém.
export async function POST(req: Request) {
  if (origemEstranha(req)) return new NextResponse(null, { status: 204 });
  const ua = req.headers.get("user-agent") || "";
  if (!ua || ROBO.test(ua)) return new NextResponse(null, { status: 204 });
  const texto = await req.text().catch(() => "");
  if (texto.length > 500) return new NextResponse(null, { status: 204 });
  let d: Record<string, unknown> = {};
  try { d = JSON.parse(texto); } catch {}
  const t = String(d.t);
  if (!TIPOS.includes(t)) return new NextResponse(null, { status: 204 });
  const ev: Evento = { t: t as Evento["t"] };
  if (t === "visita") {
    ev.o = nomeOrigem(String(d.o ?? "").slice(0, 60), ua);
    ev.d = /mobi|android|iphone|ipad/i.test(ua) ? "celular" : "computador";
  }
  if (t === "peca" || t === "sacola") {
    const p = porId(Number(d.p));
    if (!p) return new NextResponse(null, { status: 204 });
    ev.p = p.id;
    if (t === "sacola") ev.q = Math.min(20, Math.max(1, Math.floor(Number(d.q) || 1)));
  }
  try {
    await gravarEvento(ev);
  } catch (e) {
    console.error(e);
  }
  return new NextResponse(null, { status: 204 });
}
