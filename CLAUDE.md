# Tramisse — contexto do projeto

Site/e-commerce da **Tramisse**, marca brasileira de moda feminina contemporânea ("Established in Belém").
Tagline: *Threads of Identity*. Assinatura: *Essencial. Atemporal. Tramisse.*
Idioma da interface e dos textos: português do Brasil.

## Tom e estética
Sofisticação, feminilidade, elegância, exclusividade, atemporalidade. Editorial, minimalista, com muito espaço negativo.
Premium sem parecer inacessível. Não parecer marketplace nem home cheia de cards.

## Regras visuais definidas pela cliente (não quebrar)
- **Paleta da interface:** greige (com bastante presença), marfim, off-white, carbono, preto suave. Nada de rosa, lilás, azul, burgundy, neon ou cores vibrantes na UI. (As cores dos *produtos* são as reais das peças.)
- **Tipografia:** serifada sofisticada (Bodoni Moda) em títulos; sans limpa (Jost) em textos e menus.
- **Logo:** vetor definitivo em `public/assets/brand/logo.svg` (letras espaçadas "T R A M I S S E", "MISS" em itálico, exportado do Canva; original em `referencias/logo-canva.svg`), usado como máscara CSS (`--logo`) na cor da interface. `logo.png` é a mesma arte em 3000 px. Tamanhos em `src/styles/logo.css`. NUNCA pôr linhas ou elementos decorativos acima do "T"; não adicionar gráficos ao logo nem mudar o espaçamento das letras.
- **Header:** transparente sobre o banner e sólido ao rolar (classe `body.sol`); uma linha só: ícone de menu à esquerda, logo ao centro, ícones finos à direita (busca, conta, favoritos, sacola). Tudo na **mesma cor** (variável `--hc`).
- **Hero (primeira imagem da home):** fotos das peças se revezando, cada uma com "SHOP NOW" e link para a peça (3 lado a lado no computador, 1 no celular; troca a cada 5 s). Usa a 1ª foto de cada peça que tem foto. Fundo greige `#D6CDBF` por trás e véu greige no topo para o cabeçalho ficar legível. (Antes era greige liso sem imagem; mudou a pedido em 30/09/2026.) Código: `src/components/HeroShop.tsx` e `src/styles/hero.css`.
- **Qualidade:** imagens nítidas (ultra HD). Hoje as fotos vêm de um PDF comprimido (~1400 px); pedir as fotos originais.

## Regras de negócio (vieram do catálogo da cliente)
- **Pagamento (regra atual):** o preço de vitrine já embute 5% (taxa do Mercado Pago): vitrine = preço base do catálogo × 1,05. Cartão de crédito em até **2x sem juros** ou débito, pelo Mercado Pago, pagam a vitrine. **Pix: 5% de desconto** sobre a vitrine, pago na chave CNPJ da loja (`pagamento.pix.chave` em `data/config.json`; ainda pendente). Cupom vale sobre a vitrine; cálculo por peça (cada peça vai ao Mercado Pago com seu valor exato).
- **Entrega:** exclusivamente por aplicativo, mediante consulta; valor por conta da cliente, informado na compra. **Retirada** possível (endereço enviado após confirmar a compra).
- **Trocas:** até 7 dias, com etiqueta fixada na peça, conforme estoque, solicitadas pelo atendimento.
- **Atendimento (WhatsApp):** Giovana (91) 99965-4699 · Victoria (91) 99963-1582. Instagram: @tramissebrasil.
- Checkout: cartão → **Mercado Pago** (Checkout Pro, redireciona); Pix → **QR Code/copia e cola** gerado no site com a chave da loja; sempre dá para **enviar pelo WhatsApp**. Em todos os casos o resumo vai para a atendente pelo WhatsApp. Não coletar dados de cartão no site. A entrega por aplicativo não entra no valor pago online.

## Hospedagem
- **Netlify** (`netlify.toml`; adaptador oficial de Next.js). Domínio `tramisse.com.br` (DNS no registro.br). Segredos só nas variáveis de ambiente da Netlify. GitHub Pages foi descartado (estático e proibido para loja).

## Referência de navegação
Arquitetura inspirada em leblogstore.com.br (menu, categorias, filtros, produto, sacola, checkout). **Não copiar** design, textos, imagens, logo nem código.

## Estrutura do código (Next.js, App Router, TypeScript)
- `legacy/`: site estático original (`index.html`, `css/style.css`, `js/*.js`), só como referência.
- `src/app/`: rotas reais: `/`, `/categoria/[...slug]` (ex.: `roupas/blusas`, `new-in`, `estilo/office`), `/produto/[slug]`, `/favoritos`, `/conta`, `/checkout`, `/busca`, `/sobre`, `/pagina/[slug]`, `/admin`, sitemap e robots.
- `src/components/shell/`: header, menu, sacola, rodapé, guia de tamanhos/toast e `Chrome` (classes `body.home`, `body.sol`, `body.m`/`body.g`, variável `--ty`).
- `src/components/telas/`: telas interativas (categoria com filtros, produto, checkout, conta, favoritos, busca).
- `src/store/Store.tsx`: estado no navegador (sacola, favoritos, usuário) com as chaves de localStorage do site original (`tb`, `tf`, `tu`).
- `src/styles/tramisse.css`: cópia fiel de `legacy/css/style.css`; única mudança é o caminho do logo. Manter as mesmas classes na marcação.
- `src/styles/topbar.css` + `src/components/shell/TopBar.tsx`: barra superior rotativa (uma mensagem por vez, a cada 4 s, pausa com o mouse; altura fixa pela mensagem mais longa). Textos em `barraSuperior` no `data/config.json`.
- `src/styles/logo.css`: carregado depois; troca o logo pelo vetor definitivo e ajusta as larguras (o logo novo é ~12,6:1).
- `data/`: `config.json`, `products.json`, `colecoes.json`, `paginas.json`. Lidos só por `src/lib/config.ts`, `src/lib/catalog.ts` e `src/lib/paginas.ts` (trocar por banco/API ali).
- `src/lib/payment/`: regras de preço (`pricing.ts`: vitrine, desconto Pix, parcelas), Pix copia e cola/QR (`pix.ts`, padrão BR Code), montagem do pedido a partir do catálogo (`pedido.ts`), contrato de provedor (`provider.ts`), WhatsApp (`whatsapp.ts`, mesma mensagem do site original) e Mercado Pago (`mercadopago.ts`, só servidor; token em `MERCADOPAGO_ACCESS_TOKEN`).
- `src/app/api/pagamento/mercadopago/`: cria o link (POST, recalcula o preço no servidor) e consulta o pagamento (GET `[id]`). Retorno em `/checkout/retorno`.
- Imagens em `public/assets/` (servidas em `/assets/...`); fotos das peças em `public/assets/products/<slug>-<n>.jpg`. Peça sem foto mostra o degradê na cor da peça.
- `fotos-nao-identificadas/`: fotos recebidas que não correspondem a peças do catálogo.
- `scripts/converter-legacy.mjs`: conversão única dos dados antigos (não rodar de novo depois de editar os JSON).

## Estado atual e pendências
- Feito: home editorial, seção de vídeos em carrossel, categorias com filtros, produto com galeria/zoom, sacola com cupom (`TRAMISSE10`), checkout por etapas, conta/favoritos (localStorage), páginas institucionais.
- Vídeos: preencher `src` em `CFG.videos` (ainda não há vídeos reais).
- Acessórios e Sale estão vazios (catálogo só tem roupas, sem preço promocional).
- Estoque real, fotos individuais por peça, textos de privacidade/termos, TikTok/Pinterest pendentes.
- Migração para Next.js feita (rotas reais). Próximo passo: backend/plataforma de e-commerce (produtos, estoque, pedidos, clientes, cupons, pagamento Pix/cartão) e painel administrativo em `/admin`.
