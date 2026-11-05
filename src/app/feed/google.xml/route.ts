import { CL, PRODS } from "@/lib/catalog";
import { urlAbsoluta } from "@/lib/site";

// Lista de produtos para o Google Merchant Center (Google Shopping / listagens gratuitas).
// Endereço: /feed/google.xml (cadastrado no Merchant Center como "busca programada", uma vez por dia).
// Um item por cor + tamanho, agrupados pela peça. Só peças à venda e com foto (o Google exige imagem).
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const preco = (v: number) => `${v.toFixed(2)} BRL`;
// Categoria do Google para roupas femininas (Vestuário e acessórios > Roupas).
const CATEGORIA_GOOGLE = "1604";

export function GET() {
  const itens = PRODS.filter((p) => !p.emBreve && p.imagens.length > 0).flatMap((p) => {
    const descricao =
      p.descricao?.trim() ||
      `${p.nome}: ${p.subcategoria.toLowerCase()} feminina da Tramisse, marca de moda contemporânea de Belém.${p.tecido ? ` Tecido: ${p.tecido}.` : ""} Trocas em até 7 dias.`;
    return p.variantes.map((v) => {
      const cor = CL[v.cor]?.nome ?? v.cor;
      const campos: [string, string][] = [
        ["g:id", `${p.id}-${v.cor}-${v.tamanho}`],
        ["g:item_group_id", String(p.id)],
        // A cor entra no título, a menos que já esteja no nome (ex.: "Conjunto Xadrez").
        ["g:title", `${p.nome} ${cor === "Cor única" || p.nome.toLowerCase().includes(cor.split(" ")[0].toLowerCase()) ? "" : `${cor} `}- Tramisse`.replace(/\s+/g, " ")],
        ["g:description", descricao],
        ["g:link", urlAbsoluta(`/produto/${p.slug}`)],
        ["g:image_link", urlAbsoluta(p.imagens[0])],
        ...p.imagens.slice(1, 10).map((i): [string, string] => ["g:additional_image_link", urlAbsoluta(i)]),
        ["g:availability", v.estoque > 0 ? "in_stock" : "out_of_stock"],
        ["g:condition", "new"],
        ...(p.precoDe ? [["g:price", preco(p.precoDe)], ["g:sale_price", preco(p.preco)]] as [string, string][] : [["g:price", preco(p.preco)]] as [string, string][]),
        ["g:brand", "Tramisse"],
        ["g:identifier_exists", "no"],
        ["g:google_product_category", CATEGORIA_GOOGLE],
        ["g:product_type", `Roupas > ${p.subcategoria}`],
        ["g:gender", "female"],
        ["g:age_group", "adult"],
        ["g:color", cor],
        ["g:size", v.tamanho],
        ["g:size_system", "BR"],
      ];
      return `<item>\n${campos.map(([k, x]) => `  <${k}>${esc(x)}</${k}>`).join("\n")}\n</item>`;
    });
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Tramisse</title>
<link>${esc(urlAbsoluta("/"))}</link>
<description>Moda feminina contemporânea. Established in Belém.</description>
${itens.join("\n")}
</channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
