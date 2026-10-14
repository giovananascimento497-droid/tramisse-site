import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Grid } from "@/components/ProductCard";
import { ProductView } from "@/components/telas/ProductView";
import { CL, esgotado, porSlug, PRODS, temEstoque } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import { brl, precoPix } from "@/lib/payment/pricing";
import { SITE, urlAbsoluta } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
// Refaz uma vez por dia (etiqueta e lista do New In vencem sozinhas depois de 30 dias).
export const revalidate = 86400;
export function generateStaticParams() {
  return PRODS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = porSlug((await params).slug);
  if (!p) return {};
  const descricao =
    (p.descricao ? `${p.descricao} ` : `${p.nome} da Tramisse, moda feminina contemporânea de Belém. `) +
    (p.emBreve ? "Em breve na Tramisse." : `${brl(p.preco)} ou ${brl(precoPix(CFG, p.preco))} no Pix. Envio para todo o Brasil.`);
  return {
    title: p.nome,
    description: descricao.slice(0, 300),
    alternates: { canonical: `/produto/${p.slug}` },
    openGraph: { type: "website", title: `${p.nome} — Tramisse`, description: descricao.slice(0, 300), url: `/produto/${p.slug}`, images: p.imagens.slice(0, 1) },
  };
}

// Dados da peça para o Google (nome, foto, preço, disponibilidade): podem aparecer na busca e no Google Shopping.
function dadosEstruturados(p: NonNullable<ReturnType<typeof porSlug>>) {
  const disponibilidade = p.emBreve ? "PreOrder" : esgotado(p) ? "OutOfStock" : "InStock";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nome,
    sku: String(p.id),
    description: p.descricao || `${p.nome} da Tramisse.`,
    image: p.imagens.slice(0, 5).map(urlAbsoluta),
    brand: { "@type": "Brand", name: "Tramisse" },
    category: p.subcategoria,
    color: [...new Set(p.variantes.map((v) => CL[v.cor]?.nome).filter(Boolean))].join(", ") || undefined,
    ...(p.tecido ? { material: p.tecido } : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE}/produto/${p.slug}`,
      priceCurrency: "BRL",
      price: p.preco.toFixed(2),
      availability: `https://schema.org/${disponibilidade}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Tramisse" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "BR" },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
  };
}

export default async function ProdutoPage({ params }: Props) {
  const p = porSlug((await params).slug);
  if (!p) notFound();
  // Sugestões: só peças à venda, primeiro as do mesmo tipo.
  const rel = PRODS.filter((x) => x.id !== p.id && temEstoque(x) && (x.subcategoria === p.subcategoria || x.categoria === p.categoria))
    .sort((a, b) => Number(b.subcategoria === p.subcategoria) - Number(a.subcategoria === p.subcategoria))
    .slice(0, 4);
  return (
    <div className="w">
      {/* key: ao trocar de produto, a seleção (cor, tamanho, foto) recomeça */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados(p)).replace(/</g, "\\u003c") }} />
      <ProductView key={p.id} id={p.id} />
      <h2 style={{ marginBottom: 24 }}>Você também pode gostar</h2>
      <Grid itens={rel} style={{ marginBottom: 96 }} vazio={null} />
    </div>
  );
}
