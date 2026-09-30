// Importa o estoque real (planilha enviada em 30/09/2026) para data/products.json.
// Cada linha da planilha = 1 peça num tamanho. Preço = "PREÇO SUGERIDO" (a vitrine soma 5%).
// Custo, lucro e fornecedora NÃO entram aqui (o catálogo é público no site).
// Peças que já existiam no catálogo antigo reaproveitam foto, descrição, tecido e estilo (campo `antigo`).
// Uso: node scripts/importar-estoque-2026-09.mjs (rodar uma vez; depois editar o JSON direto)
import fs from "node:fs";

// [nome na planilha, tamanho, preço sugerido, em estoque?]
const LINHAS = `
Body com bluse|P|117.90|1
Conjunto xadrez|P|211.06|1
Vestido recorte na cintura|P|164.39|1
Vestido recorte no busto - vestido poá|M|212.72|1
Blusa degage|P|129.39|1
Camisa listrada|M|100.22|1
Conjunto poá|P|249.90|1
Conjunto com renda no busto e calça básica|P|225.27|1
Blusa Mármore Preta|M|102.51|1
Blusa Mármore Preta|G|102.51|1
Blusa Mármore Marrom|M|102.51|1
Blusa Mármore Marrom|G|102.51|1
Camisa Over Amarela|P|152.34|1
Camisa Over Amarela|M|152.34|1
Camisa Over Amarela|G|152.34|1
Blusa Tule Manga Marrom|M|121.06|1
Blusa Tule Manga Marrom|P|121.06|1
Blusa Alça Liocel|P|109.48|1
Saia Mid Cinto Faixa Marrom|P|164.05|1
Calça Ingrid Amarelo|M|161.06|1
Calça Ingrid Amarelo|G|161.06|1
Conjunto Luma Marrom|GG|230.24|1
Conjunto Pietra Marrom|M|238.93|1
Conjunto Pietra Marrom|GG|238.93|1
Conjunto Margot Marsala|GG|247.53|1
Macacão Adele Caramelo|P|252.34|1
Conjunto Clarissa Beringela|GG|211.06|1
Conjunto Dandara Azul M|P|211.06|1
Blusa Amarelo Manteiga|P|71.06|1
Blusa Amarelo Manteiga|P|71.06|1
Colete Mayumi|G|159.90|1
Calça Mayumi|G|200.00|1
Calça Leila|G|200.00|1
Blusa Paola|G|110.00|1
Blusa Juliemy|M|110.00|1
Caça Juliemy|M|280.00|1
Blusa Paris|P|149.90|1
Blusa Paris|M|149.90|1
Blusa Paris|G|149.90|1
Blusa Geovana|P|139.90|1
Blusa Isabel|P|200.00|1
Regata Isabel|M|149.90|1
Blusa Hannah|P|149.90|1
Blusa Mavie|G|149.90|1
Calça Luara (Hannah)|P|230.00|1
Calça Tina - Rosa|M|249.90|1
Calça Tina - Verde|P|249.90|1
Calça Zayra|36|160.00|1
Calça Zayra|40|160.00|1
Short Maya|42|110.00|1
Blusa Tainá|P|105.00|1
Short Tainá|36|110.00|1
Calça Intense|36|175.00|1
Calça Iolanda|44|160.00|1
Bermuda Paloma Fio|40|139.90|0
Bermuda Paloma Fio|44|139.90|0
Wide Leg Paloma|36|189.90|0
Wide Leg Paloma|38|189.90|0
Wide Leg Paloma|40|189.90|0
Wide Leg Paloma|42|189.90|0
Barrel estonada|40|184.90|0
Barrel estonada|44|184.90|0
Colete Nicole|P|154.90|0
Colete Nicole|M|154.90|0
T-Shirt Nina - Marrom|G|70.90|0
T-Shirt Nai - Marrom|G|70.90|0
T-Shirt Nai - Marrom|G|70.90|0
Blusa Poá|P|99.90|0
Blusa estampa ombro a ombro|PP|105.90|0
Blusa estampa ombro a ombro|P|105.90|0
Blusa estampa torção|M|105.90|0
Blusa estampa torção|G|105.90|0
Regata Suellen|G|119.90|0
Blusa Tabata - Amarela|P|119.90|0
Blusa Tabata - Amarela|G|119.90|0
Blusa Tabata - Marfim|M|119.90|0
Blusa Tabata - Marrom|M|119.90|0
Blusa Yuri|P|125.90|0
Blusa Yuri|G|125.90|0
Blusa Francesca|P|145.90|0
Blusa Francesca|M|145.90|0
Blusa Francesca|G|145.90|0
Blusa Cassandra - Marrom|G|164.90|0
Blusa Cassandra - Amarelo|M|164.90|0
`.trim().split("\n").map((l) => { const [n, t, p, e] = l.split("|"); return { n, t, p: +p, e: e === "1" }; });

// Nome da planilha -> [nome no site, cor, id da peça no catálogo antigo (opcional)]
const PECAS = {
  "Body com bluse": ["Body com Bluse", "un"],
  "Conjunto xadrez": ["Conjunto Xadrez", "xa", 11],
  "Vestido recorte na cintura": ["Vestido Recorte na Cintura", "vm", 14],
  "Vestido recorte no busto - vestido poá": ["Vestido Poá", "vi", 9],
  "Blusa degage": ["Blusa Degagê", "br", 8],
  "Camisa listrada": ["Camisa Listrada", "ro", 10],
  "Conjunto poá": ["Conjunto Poá", "un"],
  "Conjunto com renda no busto e calça básica": ["Conjunto Renda no Busto", "ma", 15],
  "Blusa Mármore Preta": ["Blusa Mármore", "pr"],
  "Blusa Mármore Marrom": ["Blusa Mármore", "ma"],
  "Camisa Over Amarela": ["Camisa Over", "am", 25],
  "Blusa Tule Manga Marrom": ["Blusa Tule Manga", "ma", 13],
  "Blusa Alça Liocel": ["Blusa Alça Liocel", "ma", 37],
  "Saia Mid Cinto Faixa Marrom": ["Saia Mid Cinto Faixa", "ma", 36],
  "Calça Ingrid Amarelo": ["Calça Ingrid", "am", 26],
  "Conjunto Luma Marrom": ["Conjunto Luma", "ma"],
  "Conjunto Pietra Marrom": ["Conjunto Pietra", "ma"],
  "Conjunto Margot Marsala": ["Conjunto Margot", "mr"],
  "Macacão Adele Caramelo": ["Macacão Adele", "cr", 33],
  "Conjunto Clarissa Beringela": ["Conjunto Clarissa", "be", 29],
  "Conjunto Dandara Azul M": ["Conjunto Dandara", "az"],
  "Blusa Amarelo Manteiga": ["Blusa Amarelo Manteiga", "am", 38],
  "Colete Mayumi": ["Colete Mayumi", "un"],
  "Calça Mayumi": ["Calça Mayumi", "un"],
  "Calça Leila": ["Calça Leila", "un"],
  "Blusa Paola": ["Blusa Paola", "un"],
  "Blusa Juliemy": ["Blusa Juliemy", "un"],
  "Caça Juliemy": ["Calça Juliemy", "un"],
  "Blusa Paris": ["Blusa Paris", "un"],
  "Blusa Geovana": ["Blusa Geovana", "un"],
  "Blusa Isabel": ["Blusa Isabel", "un"],
  "Regata Isabel": ["Regata Isabel", "un"],
  "Blusa Hannah": ["Blusa Hannah", "un"],
  "Blusa Mavie": ["Blusa Mavie", "un"],
  "Calça Luara (Hannah)": ["Calça Luara", "un"],
  "Calça Tina - Rosa": ["Calça Tina", "ro", 2],
  "Calça Tina - Verde": ["Calça Tina", "ve", 2],
  "Calça Zayra": ["Calça Zayra", "je", 22],
  "Short Maya": ["Short Maya", "jm", 16],
  "Blusa Tainá": ["Blusa Tainá", "ma", 17],
  "Short Tainá": ["Short Tainá", "ma", 18],
  "Calça Intense": ["Calça Intense", "je", 19],
  "Calça Iolanda": ["Calça Iolanda", "jc", 21],
  "Bermuda Paloma Fio": ["Bermuda Paloma Fio", "un"],
  "Wide Leg Paloma": ["Wide Leg Paloma", "un"],
  "Barrel estonada": ["Calça Barrel Estonada", "un"],
  "Colete Nicole": ["Colete Nicole", "un"],
  "T-Shirt Nina - Marrom": ["T-Shirt Nina", "ma"],
  "T-Shirt Nai - Marrom": ["T-Shirt Nai", "ma"],
  "Blusa Poá": ["Blusa Poá", "un"],
  "Blusa estampa ombro a ombro": ["Blusa Estampa Ombro a Ombro", "un"],
  "Blusa estampa torção": ["Blusa Estampa Torção", "un"],
  "Regata Suellen": ["Regata Suellen", "un"],
  "Blusa Tabata - Amarela": ["Blusa Tabata", "am"],
  "Blusa Tabata - Marfim": ["Blusa Tabata", "mf"],
  "Blusa Tabata - Marrom": ["Blusa Tabata", "ma"],
  "Blusa Yuri": ["Blusa Yuri", "un"],
  "Blusa Francesca": ["Blusa Francesca", "un"],
  "Blusa Cassandra - Marrom": ["Blusa Cassandra", "ma"],
  "Blusa Cassandra - Amarelo": ["Blusa Cassandra", "am"],
};

const SUB = [
  [/^(Blusa|Body)/, "Blusas"], [/^Camisa/, "Camisas"], [/^Regata/, "Regatas"], [/^T-Shirt/, "T-shirts"],
  [/^Colete/, "Coletes"], [/^(Calça|Wide Leg)/, "Calças"], [/^(Short|Bermuda)/, "Shorts"], [/^Saia/, "Saias"],
  [/^Vestido/, "Vestidos"], [/^Conjunto/, "Conjuntos"], [/^Macacão/, "Macacões"],
];
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const antigo = JSON.parse(fs.readFileSync("data/products.json", "utf8"));
// Já executado em 30/09/2026. Rodar de novo apagaria edições feitas no catálogo.
if (antigo.produtos.some((p) => "emBreve" in p)) throw new Error("Catálogo já importado: edite data/products.json direto.");
const porIdAntigo = Object.fromEntries(antigo.produtos.map((p) => [p.id, p]));
const cores = {
  ...antigo.cores,
  mf: { nome: "Marfim", hex: "#EFE6D2" },
  cr: { nome: "Caramelo", hex: "#A8703E" },
  az: { nome: "Azul", hex: "#3E5580" },
  un: { nome: "Cor única", hex: "#CFC6B8" },
};

const produtos = [];
const movimentos = []; // [origem, destino] das fotos reaproveitadas
let proximoId = 101;
for (const l of LINHAS) {
  const m = PECAS[l.n];
  if (!m) throw new Error("Peça sem mapeamento: " + l.n);
  const [nome, cor, idAntigo] = m;
  let p = produtos.find((x) => x.nome === nome);
  if (!p) {
    const a = idAntigo ? porIdAntigo[idAntigo] : null;
    const s = slug(nome);
    const imagens = (a?.imagens ?? []).map((src, i) => {
      const novo = `/assets/products/${s}-${i + 1}.jpg`;
      if (src !== novo) movimentos.push([src, novo]);
      return novo;
    });
    p = {
      id: a ? a.id : proximoId++,
      slug: s,
      nome,
      descricao: a?.descricao || "",
      tecido: a?.tecido || "",
      preco: l.p,
      precoDe: 0,
      categoria: "roupas",
      subcategoria: SUB.find(([r]) => r.test(nome))[1],
      estilo: a?.estilo || "",
      colecao: l.e ? "Coleção atual" : "Coming soon",
      flags: {
        novo: l.e,
        curadoria: Boolean(l.e && a?.flags.curadoria),
        maisVendida: Boolean(l.e && a?.flags.maisVendida),
      },
      emBreve: !l.e,
      variantes: [],
      imagens,
    };
    produtos.push(p);
  }
  if (p.preco !== l.p) throw new Error(`Preços diferentes para ${nome}`);
  const v = p.variantes.find((x) => x.cor === cor && x.tamanho === l.t);
  if (!l.e) { if (!v) p.variantes.push({ cor, tamanho: l.t, estoque: 0 }); continue; }
  if (v) v.estoque += 1; else p.variantes.push({ cor, tamanho: l.t, estoque: 1 });
}

// Fotos: renomeia as reaproveitadas; as de peças que saíram do estoque vão para fotos-fora-do-estoque/.
const usadas = new Set(movimentos.map(([o]) => o));
for (const p of produtos) for (const src of p.imagens) usadas.add(src);
const fora = antigo.produtos.flatMap((p) => p.imagens).filter((src) => !usadas.has(src));

fs.writeFileSync("data/products.json", JSON.stringify({ categorias: antigo.categorias, cores, produtos }, null, 2) + "\n");
fs.writeFileSync(".import-fotos.json", JSON.stringify({ movimentos, fora }, null, 2));
console.log(produtos.length, "peças:", produtos.filter((p) => !p.emBreve).length, "em estoque,", produtos.filter((p) => p.emBreve).length, "coming soon");
console.log("peças em estoque:", produtos.filter((p) => !p.emBreve).reduce((a, p) => a + p.variantes.reduce((b, v) => b + v.estoque, 0), 0));
console.log("com foto:", produtos.filter((p) => p.imagens.length).map((p) => p.nome).join(", "));
console.log("fotos a renomear:", movimentos.length, "| fotos fora do estoque:", fora.length);
