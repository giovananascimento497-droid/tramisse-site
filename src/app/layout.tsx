import type { Metadata, Viewport } from "next";
import { HashRedirect } from "@/components/HashRedirect";
import { BagDrawer } from "@/components/shell/BagDrawer";
import { Chrome } from "@/components/shell/Chrome";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { MenuDrawer } from "@/components/shell/MenuDrawer";
import { Overlays } from "@/components/shell/Overlays";
import { TopBar } from "@/components/shell/TopBar";
import { CFG } from "@/lib/config";
import { StoreProvider } from "@/store/Store";
import "@/styles/tramisse.css";
import "@/styles/logo.css";
import "@/styles/topbar.css";
import "@/styles/hero.css";
import "@/styles/loja.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Tramisse — Threads of Identity", template: "%s — Tramisse" },
  description: "Tramisse, moda feminina brasileira contemporânea. Essencial. Atemporal.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Dados estruturados da marca (Google): nome, site, logo e perfis oficiais (Instagram etc.).
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tramisse.com.br";
const ORGANIZACAO = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: CFG.marca,
  url: SITE,
  logo: `${SITE}/assets/brand/logo.png`,
  sameAs: CFG.redes.map((r) => r.url).filter(Boolean),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Mesmo carregamento de fontes do site estático, para o CSS original funcionar sem mudanças. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={CFG.aparencia === "loja" ? "loja" : undefined}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZACAO) }} />
        <StoreProvider>
          <TopBar />
          <Header />
          <main id="app">{children}</main>
          <Footer />
          <MenuDrawer />
          <BagDrawer />
          <Overlays />
          <Chrome />
          <HashRedirect />
        </StoreProvider>
      </body>
    </html>
  );
}
