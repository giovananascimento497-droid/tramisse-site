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
| Barra superior (mensagens que trocam sozinhas; tempo em `src/components/shell/TopBar.tsx`), pagamento, WhatsApp, cupons, vídeos, redes, fotos da home | `data/config.json` |
| Produtos, cores, categorias | `data/products.json` |
| Títulos e textos das coleções (New In, Curadoria…) | `data/colecoes.json` |
| Páginas institucionais (como comprar, trocas, contato, privacidade, termos) | `data/paginas.json` |
| Fotos das peças | `public/assets/products/<slug>-1.jpg`, `-2.jpg`… (1ª é a capa) |
| Logo e fotos da marca | `public/assets/brand/` (logo em `logo.svg`; tamanhos em `src/styles/logo.css`) |
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

## Preços e pagamento
- **Vitrine:** `preco` em `data/products.json` é o valor base; o site mostra base + 5% (taxa do Mercado Pago embutida). Ex.: R$ 100,00 → **R$ 105,00**, ou 2x de R$ 52,50 sem juros. Percentuais em `pagamento` no `data/config.json` (`taxaCartao`, `descontoPix`, `maxParcelas`).
- **Cartão (crédito até 2x sem juros ou débito):** pago no **Mercado Pago** (Checkout Pro). Cada peça vai com o seu valor exato (com cupom, se houver); a soma é o total do site. Só a forma escolhida é liberada no Mercado Pago.
- **Pix: 5% de desconto** sobre a vitrine (R$ 105,00 → R$ 99,75), pago direto na **chave CNPJ da loja**. O site gera o QR Code e o Pix copia e cola com o valor e o nº do pedido; a cliente envia o comprovante pelo WhatsApp.
- A entrega por aplicativo não entra no valor pago online: é combinada no atendimento.
- Sem token do Mercado Pago ou sem chave Pix, a opção correspondente vira "enviar pelo WhatsApp".

**Para ativar o Pix:** preencha `pagamento.pix.chave` no `data/config.json` com o CNPJ (só números) e confira `nome` (até 25 letras, sem acento) e `cidade`.

**Para ativar o Mercado Pago:** crie uma aplicação em mercadopago.com.br/developers (Suas integrações → Credenciais) e cadastre o *Access Token* na variável `MERCADOPAGO_ACCESS_TOKEN` (Netlify → Project configuration → Environment variables; localmente, em `.env.local`, veja `.env.example`). Comece pelo token de teste (`TEST-...`) e depois troque pelo de produção (`APP_USR-...`). **Nunca** coloque o token no código.
No painel do Mercado Pago, deixe o parcelamento em 2x **sem juros para a compradora** (a taxa já está embutida na vitrine).

## Publicar (Netlify)
O projeto já tem o `netlify.toml`. A Netlify detecta o Next.js e instala o adaptador sozinha (páginas + função de servidor para o checkout e o Mercado Pago).
1. **app.netlify.com** → entrar com o GitHub → **Add new project → Import an existing project → GitHub** → escolher `tramisse-site`.
2. Em **Branch to deploy**, escolher o branch com o site novo (hoje `claude/determined-lovelace-33qqkg`; depois do merge, `main`). Não mexer no resto (build `npm run build`, publish `.next`, já vêm do `netlify.toml`) → **Deploy**.
3. **Variáveis** (Project configuration → Environment variables): `NEXT_PUBLIC_SITE_URL` = `https://tramisse.com.br` e, quando tiver, `MERCADOPAGO_ACCESS_TOKEN`. Depois de criar/alterar: **Deploys → Trigger deploy**.
4. **Domínio** (Domain management → Add a domain): `tramisse.com.br`. A Netlify mostra os registros DNS (em geral um **A** para o domínio e um **CNAME** `www` para `<projeto>.netlify.app`); criar em registro.br → domínio → DNS → Editar zona. O https é criado sozinho.

## Status da migração
- [x] Etapa 1: base Next.js, rotas reais, dados em `data/`, camada de pagamento e área `/admin`.
- [x] Etapa 2: CSS original, produtos/config convertidos para `data/`, fotos organizadas, logo provisório.
- [x] Etapa 3: telas migradas (home, categoria com filtros, produto, sacola, checkout, conta, favoritos, busca, páginas).
- [x] Pagamento online: cartão pelo Mercado Pago (itens com valor exato) e Pix com 5% de desconto na chave da loja.
- [ ] Etapa 4: backend (banco, pedidos, estoque, confirmação automática de pagamento por webhook) e painel com login.

## Pendências de conteúdo
- **Fotos da marca** (fundo e capa, usadas em Sobre e no bloco Acessórios da home): enviar as fotos para `public/assets/brand/` e preencher `imagensMarca` no `data/config.json` (ex.: `"brand": "/assets/brand/fundo.jpg"`).
- **Fotos das peças:** 20 peças ainda sem foto. 31 fotos recebidas não correspondem a nenhuma peça do catálogo (`fotos-nao-identificadas/`, com miniaturas numeradas em `indice.jpg`).
