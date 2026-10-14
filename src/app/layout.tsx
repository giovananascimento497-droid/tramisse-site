import type { Metadata, Viewport } from "next";
import { HashRedirect } from "@/components/HashRedirect";
import { BagDrawer } from "@/components/shell/BagDrawer";
import { Chrome } from "@/components/shell/Chrome";
import { CookieBanner } from "@/components/shell/CookieBanner";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { MenuDrawer } from "@/components/shell/MenuDrawer";
import { Overlays } from "@/components/shell/Overlays";
import { TopBar } from "@/components/shell/TopBar";
import { WhatsFlutuante } from "@/components/shell/WhatsFlutuante";
import { CFG } from "@/lib/config";
import { SITE } from "@/lib/site";
import { StoreProvider } from "@/store/Store";
import "@/styles/tramisse.css";
import "@/styles/logo.css";
import "@/styles/topbar.css";
import "@/styles/hero.css";
import "@/styles/loja.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Tramisse — Moda feminina contemporânea de Belém", template: "%s — Tramisse" },
  description:
    "Tramisse, moda feminina contemporânea de Belém/PA: conjuntos, alfaiataria feminina, blusas, calças e vestidos. Essencial. Atemporal. Envio para todo o Brasil.",
  // Prévia ao compartilhar o link (WhatsApp, Instagram, Facebook).
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Tramisse",
    url: "/",
    images: [{ url: "/assets/brand/inicio.jpg", alt: "Tramisse" }],
  },
  twitter: { card: "summary_large_image" },
  // Google Search Console: código de verificação (Netlify → NEXT_PUBLIC_GOOGLE_VERIFICACAO).
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICACAO ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICACAO } } : {}),
};

// Sempre no visual claro da marca (mesmo com o celular no modo escuro).
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", colorScheme: "only light", themeColor: "#F7F5F1" };

// Dados estruturados da marca (Google): nome, site, logo e perfis oficiais (Instagram etc.).
const ORGANIZACAO = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: CFG.marca,
  url: SITE,
  logo: `${SITE}/assets/brand/logo.png`,
  image: `${SITE}/assets/brand/inicio.jpg`,
  description: "Moda feminina contemporânea de Belém/PA: conjuntos, alfaiataria feminina, blusas, calças e vestidos.",
  slogan: CFG.assinatura,
  telephone: `+${CFG.atendentes[0].whatsapp}`,
  address: { "@type": "PostalAddress", addressLocality: "Belém", addressRegion: "PA", addressCountry: "BR" },
  areaServed: "BR",
  sameAs: CFG.redes.map((r) => r.url).filter(Boolean),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light">
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
          <WhatsFlutuante />
          <CookieBanner />
        </StoreProvider>
      </body>
    </html>
  );
}
