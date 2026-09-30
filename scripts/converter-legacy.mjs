// Converte os dados do site estático (legacy/js/*.js) para os JSON em data/.
// Uso: node scripts/converter-legacy.mjs  (só é preciso rodar uma vez)
import fs from "node:fs";
import vm from "node:vm";

const ctx = vm.createContext({});
for (const f of ["images", "config", "products"]) {
  vm.runInContext(fs.readFileSync(`legacy/js/${f}.js`, "utf8").replace(/^const /gm, "var "), ctx);
}
const { IMGS, CFG, TREE, CL, RAW, slug } = ctx;
const fotos = fs.readdirSync("public/assets/products");

const produtos = RAW.map((r, i) => {
  const s = slug(r[0]);
  const imagens = fotos
    .filter((f) => f.startsWith(s + "-") && /^\d+\.jpg$/.test(f.slice(s.length + 1)))
    .sort((a, b) => parseInt(a.slice(s.length + 1)) - parseInt(b.slice(s.length + 1)))
    .map((f) => `/assets/products/${f}`);
  return {
    id: i + 1,
    slug: s,
    nome: r[0],
    descricao: r[5],
    tecido: r[7],
    preco: r[2],
    precoDe: 0,
    categoria: "roupas",
    subcategoria: r[1],
    estilo: r[3],
    colecao: "Coleção atual",
    flags: { novo: r[6].includes("N"), curadoria: r[6].includes("K"), maisVendida: r[6].includes("B") },
    // Estoque provisório: 2 por variante (cor + tamanho), como no site original.
    variantes: r[4].split(";").flatMap((g) => {
      const [cor, t] = g.split(":");
      return t.split(",").map((tamanho) => ({ cor, tamanho, estoque: 2 }));
    }),
    imagens,
  };
});

const catalogo = {
  categorias: Object.fromEntries(
    Object.entries(TREE).map(([k, grupos]) => [k, { nome: k === "roupas" ? "Roupas" : "Acessórios", grupos }]),
  ),
  cores: Object.fromEntries(Object.entries(CL).map(([k, [nome, hex]]) => [k, { nome, hex }])),
  produtos,
};

const config = JSON.parse(fs.readFileSync("data/config.json", "utf8"));
Object.assign(config, {
  barraSuperior: CFG.top,
  pagamento: {
    pix: { acrescimo: 0 },
    debito: { acrescimo: CFG.card },
    credito: { acrescimo: CFG.card, maxParcelas: CFG.inst },
  },
  atendentes: CFG.wa.map(([nome, whatsapp]) => ({
    nome,
    whatsapp,
    exibicao: `(${whatsapp.slice(2, 4)}) ${whatsapp.slice(4, 9)}-${whatsapp.slice(9)}`,
  })),
  cupons: Object.entries(CFG.coupons).map(([codigo, valor]) => ({ codigo, tipo: "percentual", valor })),
  redes: CFG.social.map(([nome, url]) => ({ nome, url })),
  hero: CFG.hero,
  videos: CFG.videos.map((v) => ({ produtoId: v.pid, src: v.src })),
  // Fotos da marca (fundo/capa) ainda não enviadas: ficam vazias até existirem em public/assets/brand/.
  imagensMarca: Object.fromEntries(
    Object.entries(IMGS).map(([k, v]) => [k, fs.existsSync("public/" + v) ? "/" + v : ""]),
  ),
  // Foto de cada bloco da home: id do produto, ou "brand"/"cover" para as fotos da marca.
  fotosHome: ctx.TP,
});

fs.writeFileSync("data/products.json", JSON.stringify(catalogo, null, 2) + "\n");
fs.writeFileSync("data/config.json", JSON.stringify(config, null, 2) + "\n");
console.log(produtos.length, "produtos;", produtos.filter((p) => p.imagens.length).length, "com foto");
