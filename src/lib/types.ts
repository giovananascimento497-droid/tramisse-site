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
export type Cupom = { codigo: string; tipo: "percentual" | "fixo"; valor: number };

export type Config = {
  marca: string;
  tagline: string;
  assinatura: string;
  barraSuperior: string[];
  pagamento: {
    pix: { acrescimo: number };
    debito: { acrescimo: number };
    credito: { acrescimo: number; maxParcelas: number };
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
  itens: { nome: string; cor: string; tam: string; q: number; precoUnitario: number }[];
  cupom?: string;
  pagamento: FormaPagamento;
  entrega: FormaEntrega;
  cliente: DadosCliente;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
};
