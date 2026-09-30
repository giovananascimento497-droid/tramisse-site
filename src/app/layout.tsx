import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollState } from "@/components/ScrollState";
import { HashRedirect } from "@/components/HashRedirect";
import "@/styles/tramisse.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Tramisse — Threads of Identity", template: "%s — Tramisse" },
  description: "Tramisse, moda feminina brasileira contemporânea. Essencial. Atemporal.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Mesmo carregamento de fontes do site estático, para o CSS original funcionar sem mudanças. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="top" id="top"></div>
        <Header />
        <main id="app">{children}</main>
        <Footer />
        <div className="ov" data-a="close"></div>
        <aside className="dr" id="menu" aria-label="Menu"></aside>
        <aside className="dr" id="bag" aria-label="Sacola"></aside>
        <div className="mod" id="mod" role="dialog" aria-modal="true"><div id="modc"></div></div>
        <div id="toast" role="status"></div>
        <ScrollState />
        <HashRedirect />
      </body>
    </html>
  );
}
