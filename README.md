# Tramisse — site

Loja em **Next.js** (App Router, TypeScript), em migração a partir do site estático
(a marcação original está em `legacy/index.html`).

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
| Barra superior, pagamento, WhatsApp, cupons, vídeos, redes | `data/config.json` |
| Produtos, cores, categorias | `data/products.json` (formato em `data/README.md`) |
| Páginas institucionais (pagamento, entrega, trocas, atendimento) | `data/paginas.json` |
| Fotos das peças, logo e imagens da marca | `public/assets/...` (servidas em `/assets/...`) |
| Cores, tipografia, espaçamentos | `src/styles/tramisse.css` |
| Telas | `src/app/**/page.tsx` e `src/components/` |
| Regras de preço e finalização do pedido | `src/lib/payment/` |

## Rotas
| Rota | Tela |
|---|---|
| `/` | Home |
| `/categoria/<categoria>/<subcategoria>` | Categoria com filtros |
| `/produto/<slug>` | Produto |
| `/favoritos`, `/conta`, `/checkout` | Favoritos, conta, checkout |
| `/institucional/<slug>` | Páginas institucionais |
| `/admin` | Painel administrativo (a construir, precisa de login) |

Links antigos com `#/...` são redirecionados para a rota real.

## Publicar
Vercel (recomendado) ou qualquer hospedagem Node. Defina `NEXT_PUBLIC_SITE_URL` com o domínio final (usado no sitemap).

## Status da migração
- [x] Etapa 1: base Next.js, rotas reais, dados em `data/`, camada de pagamento e área `/admin`.
- [ ] Etapa 2: trazer `css/style.css`, `js/products.js`, `js/config.js`, `js/images.js` e `assets/` (não estão no repositório).
- [ ] Etapa 3: migrar as telas do `app.js` (home, categoria, produto, sacola, checkout, conta, favoritos).
- [ ] Etapa 4: backend (banco, pedidos, estoque), pagamento online e painel com login.

## Continuar no Claude Code
1. Suba este repositório no GitHub.
2. Em claude.ai/code, autorize o app do Claude no GitHub e escolha o repositório.
3. O arquivo `CLAUDE.md` já traz o contexto e as regras da marca. Primeira mensagem sugerida:
   > Leia o CLAUDE.md e o README.md. Quero migrar este site estático para Next.js mantendo a identidade visual, com rotas reais e dados de produtos vindos de um arquivo/API, preparado para pagamento e painel administrativo.
