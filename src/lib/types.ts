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
  emBreve?: boolean; // Coming soon: aparece só na vitrine Coming Soon, sem compra ("Avise-me")
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
  empresa: { razaoSocial: string; cnpj: string; cidade: string }; // identificação exigida em loja online (Decreto 7.962/2013)
  aparencia: "editorial" | "loja"; // visual do site (src/styles/loja.css vale só com "loja")
  barraSuperior: string[];
  pagamento: {
    taxaCartao: number; // taxa do Mercado Pago coberta pela vitrine (vitrine = base ÷ (1 − taxa))
    centavosVitrine: number | null; // vitrine arredondada para cima até terminar nesses centavos (ex.: 0.9 -> ,90)
    descontoPix: number; // desconto sobre a vitrine no Pix
    maxParcelas: number; // crédito sem juros
    // Chave Pix da loja. Vazia = Pix combinado pelo WhatsApp. titular/banco: só para exibir à cliente.
    pix: { chave: string; nome: string; cidade: string; titular?: string; banco?: string };
  };
  entrega: {
    aplicativo: boolean;
    retirada: boolean;
    // Envio pelos Correios com frete calculado pelo Melhor Envio (src/lib/frete/).
    correios: {
      cepOrigem: string;
      servicos: number[]; // ids do Melhor Envio (1 = PAC, 2 = SEDEX)
      freteGratisAcima: number; // valor das peças (vitrine com cupom); 0 = sem frete grátis
      diasPreparo: number; // somados ao prazo da transportadora
      embalagem: { nome: string; largura: number; comprimento: number; alturaPorPeca: number; alturaMinima: number; peso: number };
      pesoPorPeca: Record<string, number>; // kg por subcategoria; "padrao" para as demais
    };
  };
  trocas: { prazoDias: number };
  atendentes: Atendente[];
  cupons: Cupom[];
  redes: { nome: string; url: string }[];
  // Primeira tela da home (imagem de início). imagem vazia = só as fotos das peças.
  hero: { imagem: string; frase: string; textoFrase: string };
  videos: { produtoId: number; src: string }[];
  imagensMarca: { brand: string; cover: string };
  fotosHome: Record<string, number | "brand" | "cover">;
};

export type ItemSacola = { id: number; cor: string; tam: string; q: number };

export type FormaPagamento = "pix" | "debito" | "credito";
export type FormaEntrega = "aplicativo" | "retirada" | "correios";

// Opção de frete (Correios) já com a regra de frete grátis aplicada.
export type OpcaoFrete = { servico: number; nome: string; valor: number; valorOriginal: number; prazo: number; gratis: boolean };

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
  frete?: OpcaoFrete; // só na entrega pelos Correios (somado ao total; o desconto Pix não vale sobre o frete)
  total: number;
  // Preenchido quando a cliente pagou pelo site (ex.: Mercado Pago).
  pagamentoOnline?: { provedor: string; id: string; status: string };
};
