# Dados da loja

Lidos só por `src/lib/catalog.ts`, `src/lib/config.ts` e `src/lib/paginas.ts`.
Quando existir backend/painel administrativo, basta trocar a leitura nesses arquivos por banco/API; as telas não mudam.

- `config.json`: barra superior, pagamento (taxa do cartão embutida, desconto Pix, parcelas, chave Pix), atendentes (WhatsApp), cupons, redes, vídeos, fotos da home.
- `products.json`: categorias, cores e produtos.
- `colecoes.json`: título e texto de cada coleção (New In, Curadoria…).
- `paginas.json`: páginas institucionais (HTML simples).

Formato de um produto (`produtos[]`):

```json
{
  "id": 9,
  "slug": "vestido-poa",
  "nome": "Vestido Poá",
  "descricao": "Vestido estampado poá.",
  "tecido": "",
  "preco": 214.9,
  "precoDe": 0,
  "categoria": "roupas",
  "subcategoria": "Vestidos",
  "estilo": "Night",
  "colecao": "Coleção atual",
  "flags": { "novo": true, "curadoria": false, "maisVendida": true },
  "variantes": [{ "cor": "vi", "tamanho": "M", "estoque": 2 }],
  "imagens": ["/assets/products/vestido-poa-1.jpg"]
}
```

- `preco` / `precoDe` são o **valor base**. O site mostra base + `pagamento.taxaCartao` (5%): 214,90 → 225,65 na vitrine; no Pix, 5% de desconto sobre a vitrine.
- `precoDe` > 0 marca a peça como Sale (preço "de").
- `cor` é a chave em `cores` (ex.: `"vi"` = Vinho; `"un"` = Cor única). `estoque` é o estoque real da variante.
- `"emBreve": true` = Coming soon (sem compra, com "Avise-me").
