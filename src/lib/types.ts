// Tipos do domínio da loja. Servem de contrato entre os dados (hoje JSON,
// amanhã banco/API do painel administrativo) e as telas.

export type Categoria = {
  slug: string;
  nome: string;
  filhas?: Categoria[];
};

export type Cor = { nome: string; hex: string };

export type Variante = {
  cor: string; // chave em `cores`
  tamanhos: Record<string, number>; // tamanho -> estoque
};

export type Produto = {
  slug: string;
  nome: string;
  categoria: string;
  preco: number;
  precoPromocional?: number | null;
  estilo?: string;
  descricao?: string;
  tecido?: string;
  flags?: { novo?: boolean; curadoria?: boolean; maisVendida?: boolean };
  variantes: Variante[];
  imagens: string[];
};

export type Catalogo = {
  categorias: Categoria[];
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
  redes: Record<string, string>;
  videos: { titulo?: string; src: string; poster?: string }[];
};

export type ItemSacola = {
  slug: string;
  cor: string;
  tamanho: string;
  quantidade: number;
};

export type FormaPagamento = "pix" | "debito" | "credito";
export type FormaEntrega = "aplicativo" | "retirada";

export type Pedido = {
  itens: (ItemSacola & { nome: string; precoUnitario: number })[];
  cupom?: string;
  pagamento: FormaPagamento;
  parcelas: number;
  entrega: FormaEntrega;
  cliente: { nome: string; telefone: string; endereco?: string };
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
};
