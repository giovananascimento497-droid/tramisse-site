// Endereço oficial do site (Google, sitemap, links de compartilhamento). Na Netlify pode vir de
// NEXT_PUBLIC_SITE_URL; sem ela, usa o domínio da loja (nunca "localhost" no ar).
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://tramisse.com.br").replace(/\/+$/, "");
export const urlAbsoluta = (caminho: string) => (/^https?:\/\//.test(caminho) ? caminho : `${SITE}${caminho.startsWith("/") ? "" : "/"}${caminho}`);
