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

## Publicar
Vercel (recomendado) ou qualquer hospedagem Node. Defina `NEXT_PUBLIC_SITE_URL` com o domínio final (usado no sitemap).

## Status da migração
- [x] Etapa 1: base Next.js, rotas reais, dados em `data/`, camada de pagamento e área `/admin`.
- [x] Etapa 2: CSS original, produtos/config convertidos para `data/`, fotos organizadas, logo provisório.
- [x] Etapa 3: telas migradas (home, categoria com filtros, produto, sacola, checkout, conta, favoritos, busca, páginas).
- [ ] Etapa 4: backend (banco, pedidos, estoque), pagamento online e painel com login.

## Pendências de conteúdo
- **Logo:** `public/assets/brand/logo.png` é provisório, recortado de `referencias/marca-header-mockup.jpeg`. Enviar o arquivo original (PNG com fundo transparente, SVG ou PDF).
- **Fotos da marca** (fundo e capa, usadas em Sobre e no bloco Acessórios da home): enviar as fotos para `public/assets/brand/` e preencher `imagensMarca` no `data/config.json` (ex.: `"brand": "/assets/brand/fundo.jpg"`).
- **Fotos das peças:** 20 peças ainda sem foto. 31 fotos recebidas não correspondem a nenhuma peça do catálogo (`fotos-nao-identificadas/`, com miniaturas numeradas em `indice.jpg`).
