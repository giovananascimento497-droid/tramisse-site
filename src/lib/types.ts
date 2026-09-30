// Tipos do domínio da loja. Servem de contrato entre os dados (hoje JSON em data/,
// amanhã banco/API do painel administrativo) e as telas.

export type Cor = { nome: string; hex: string };

export type Variante = { cor: string; tamanho: string; estoque: number };

export type Produto = {
  id: number;
  slug: string;
  nome: string;
  descricao: string;
  tecido: string;
  preco: number;
  precoDe: number; // preço "de" (promoção); 0 = sem promoção
  // Em data/products.json, preco/precoDe são o valor base. Ao carregar o catálogo
  // (src/lib/catalog.ts) viram o preço de vitrine, já com a taxa do cartão embutida.
  categoria: string; // "roupas" | "acessorios"
  subcategoria: string;
  estilo: string;
  colecao: string;
  flags: { novo: boolean; curadoria: boolean; maisVendida: boolean };
  variantes: Variante[];
  imagens: string[];
};

// Grupos de subcategorias, ex.: { "Partes de cima": ["Blusas", "Camisas"] }
export type Categoria = { nome: string; grupos: Record<string, string[]> };

export type Catalogo = {
  categorias: Record<string, Categoria>;
  cores: Record<string, Cor>;
  produtos: Produto[];
};

export type Atendente = { nome: string; whatsapp: string; exibicao: string };
export type Cupom = { codigo: string; tipo: "percentual"; valor: number };

export type Config = {
  marca: string;
  tagline: string;
  assinatura: string;
  barraSuperior: string[];
  pagamento: {
    taxaCartao: number; // embutida no preço de vitrine (taxa do Mercado Pago)
    descontoPix: number; // desconto sobre a vitrine no Pix
    maxParcelas: number; // crédito sem juros
    // Chave Pix da loja (CNPJ, só números). Vazia = Pix combinado pelo WhatsApp.
    pix: { chave: string; nome: string; cidade: string };
  };
  entrega: { aplicativo: boolean; retirada: boolean };
  trocas: { prazoDias: number };
  atendentes: Atendente[];
  cupons: Cupom[];
  redes: { nome: string; url: string }[];
  hero: { desktop: string; mobile: string };
  videos: { produtoId: number; src: string }[];
  imagensMarca: { brand: string; cover: string };
  fotosHome: Record<string, number | "brand" | "cover">;
};

export type ItemSacola = { id: number; cor: string; tam: string; q: number };

export type FormaPagamento = "pix" | "debito" | "credito";
export type FormaEntrega = "aplicativo" | "retirada";

export type DadosCliente = {
  e?: string; n?: string; sn?: string; tel?: string; cpf?: string;
  cep?: string; end?: string; num?: string; cmp?: string; bai?: string; cid?: string; uf?: string; dest?: string;
};

export type Pedido = {
  // precoUnitario = vitrine; precoFinal = valor unitário cobrado (com cupom e desconto Pix).
  itens: { id: number; slug: string; nome: string; cor: string; tam: string; q: number; precoUnitario: number; precoFinal: number }[];
  cupom?: string;
  pagamento: FormaPagamento;
  entrega: FormaEntrega;
  cliente: DadosCliente;
  subtotal: number;
  desconto: number; // cupom
  descontoPix: number;
  total: number;
  // Preenchido quando a cliente pagou pelo site (ex.: Mercado Pago).
  pagamentoOnline?: { provedor: string; id: string; status: string };
};
