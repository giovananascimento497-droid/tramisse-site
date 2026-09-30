# Tramisse — site

Loja em **Next.js** (App Router, TypeScript), migrada do site estático original
(que continua guardado em `legacy/` como referência).

## Rodar localmente
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção
npm run typecheck
```

## Onde editar
| O que | Arquivo |
|---|---|
| Barra superior, pagamento, WhatsApp, cupons, vídeos, redes, fotos da home | `data/config.json` |
| Produtos, cores, categorias | `data/products.json` |
| Títulos e textos das coleções (New In, Curadoria…) | `data/colecoes.json` |
| Páginas institucionais (como comprar, trocas, contato, privacidade, termos) | `data/paginas.json` |
| Fotos das peças | `public/assets/products/<slug>-1.jpg`, `-2.jpg`… (1ª é a capa) |
| Logo e fotos da marca | `public/assets/brand/` |
| Cores, tipografia, espaçamentos | `src/styles/tramisse.css` (tokens no início) |
| Telas | `src/app/**/page.tsx` e `src/components/` |
| Regras de preço e finalização do pedido | `src/lib/payment/` |

**Produto novo:** adicione um item em `produtos` no `data/products.json` (copie um existente e troque `id`, `slug`, nome, preço, variantes…) e coloque as fotos com o nome do slug.
Variante = cor + tamanho + estoque. Flags: `novo` (New In), `curadoria`, `maisVendida`.

**Vídeos:** coloque os arquivos em `public/assets/videos/` e preencha `src` em `videos` no `data/config.json` (ex.: `"src": "/assets/videos/look-01.mp4"`). Use MP4 (H.264) vertical, curto e leve.

## Rotas
| Rota | Tela |
|---|---|
| `/` | Home |
| `/categoria/roupas`, `/categoria/roupas/blusas`, `/categoria/new-in`, `/categoria/estilo/office`… | Categorias e coleções, com filtros |
| `/produto/<slug>` | Produto |
| `/favoritos`, `/conta`, `/checkout`, `/busca?q=` | Favoritos, conta, checkout, busca |
| `/sobre`, `/pagina/<slug>` | Institucionais |
| `/admin` | Painel administrativo (a construir, precisa de login) |

Links antigos com `#/...` (ex.: `/#/p/vestido-poa`) são redirecionados para a rota nova.

## Pagamento pelo Mercado Pago
Na última etapa do checkout, a cliente pode **pagar com Mercado Pago** (Checkout Pro) ou enviar o pedido pelo WhatsApp.
- O site gera o link com o valor calculado no servidor (preços do catálogo, cupom e acréscimo de 5% no cartão) e só libera no Mercado Pago a forma escolhida: Pix, débito ou crédito em até 2x.
- A cliente paga na página do Mercado Pago e volta para `/checkout/retorno`. O site confirma o pagamento na API do Mercado Pago e ela envia o resumo, com o nº do pagamento, para a atendente pelo WhatsApp.
- A entrega por aplicativo não entra no link: continua sendo combinada no atendimento.

**Para ativar:** crie uma aplicação em mercadopago.com.br/developers (Suas integrações → Credenciais) e cadastre o *Access Token* na variável `MERCADOPAGO_ACCESS_TOKEN` (Vercel → Settings → Environment Variables; localmente, em `.env.local`, veja `.env.example`). Comece pelo token de teste (`TEST-...`) e depois troque pelo de produção (`APP_USR-...`). Sem token, o botão não aparece. **Nunca** coloque o token no código.

Em Mercado Pago → Seu negócio → Custos, defina se o parcelamento em 2x é sem juros para a cliente (o site já soma os 5% da loja).

## Publicar
Vercel (recomendado) ou qualquer hospedagem Node. Defina `NEXT_PUBLIC_SITE_URL` com o domínio final (usado no sitemap).

## Status da migração
- [x] Etapa 1: base Next.js, rotas reais, dados em `data/`, camada de pagamento e área `/admin`.
- [x] Etapa 2: CSS original, produtos/config convertidos para `data/`, fotos organizadas, logo provisório.
- [x] Etapa 3: telas migradas (home, categoria com filtros, produto, sacola, checkout, conta, favoritos, busca, páginas).
- [x] Pagamento online pelo Mercado Pago (Checkout Pro), opcional ao WhatsApp.
- [ ] Etapa 4: backend (banco, pedidos, estoque, confirmação automática de pagamento por webhook) e painel com login.

## Pendências de conteúdo
- **Logo:** `public/assets/brand/logo.png` é provisório, recortado de `referencias/marca-header-mockup.jpeg`. Enviar o arquivo original (PNG com fundo transparente, SVG ou PDF).
- **Fotos da marca** (fundo e capa, usadas em Sobre e no bloco Acessórios da home): enviar as fotos para `public/assets/brand/` e preencher `imagensMarca` no `data/config.json` (ex.: `"brand": "/assets/brand/fundo.jpg"`).
- **Fotos das peças:** 20 peças ainda sem foto. 31 fotos recebidas não correspondem a nenhuma peça do catálogo (`fotos-nao-identificadas/`, com miniaturas numeradas em `indice.jpg`).
