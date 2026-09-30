# Dados da loja

Arquivos lidos pelo site por meio de `src/lib/catalog.ts` e `src/lib/config.ts`.
Quando existir backend/painel administrativo, basta trocar a leitura nesses dois
arquivos por chamadas ao banco/API; as telas não mudam.

- `config.json`: barra superior, pagamento, entrega, trocas, atendentes (WhatsApp), cupons, redes, vídeos.
- `products.json`: árvore de categorias, cores e produtos.

Formato de um produto (`produtos[]`):

```json
{
  "slug": "vestido-exemplo",
  "nome": "Vestido Exemplo",
  "categoria": "vestidos",
  "preco": 389.9,
  "precoPromocional": null,
  "estilo": "",
  "descricao": "",
  "tecido": "",
  "flags": { "novo": true, "curadoria": false, "maisVendida": false },
  "variantes": [
    { "cor": "preto", "tamanhos": { "P": 2, "M": 2, "G": 2 } }
  ],
  "imagens": ["/assets/products/vestido-exemplo.jpg"]
}
```

`tamanhos` guarda o estoque por tamanho (hoje provisório: 2 por variante).
