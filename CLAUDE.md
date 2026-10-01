# Tramisse — contexto do projeto

Site/e-commerce da **Tramisse**, marca brasileira de moda feminina contemporânea ("Established in Belém").
Tagline: *Threads of Identity*. Assinatura: *Essencial. Atemporal. Tramisse.*
Idioma da interface e dos textos: português do Brasil.

## Tom e estética
Sofisticação, feminilidade, elegância, exclusividade, atemporalidade. Editorial, minimalista, com muito espaço negativo.
Premium sem parecer inacessível. Não parecer marketplace nem home cheia de cards.

## Regras visuais definidas pela cliente (não quebrar)
- **Paleta da interface:** greige (com bastante presença), marfim, off-white, carbono, preto suave. Nada de rosa, lilás, azul, burgundy, neon ou cores vibrantes na UI. (As cores dos *produtos* são as reais das peças.)
- **Tipografia:** no visual atual ("loja"), títulos em sans (Jost) maiúsculo e espaçado; Bodoni Moda fica no nome da peça do banner do visual editorial. Jost em textos e menus.
- **Logo:** vetor definitivo em `public/assets/brand/logo.svg` (letras espaçadas "T R A M I S S E", "MISS" em itálico, exportado do Canva; original em `referencias/logo-canva.svg`), usado como máscara CSS (`--logo`) na cor da interface. `logo.png` é a mesma arte em 3000 px. Tamanhos em `src/styles/logo.css`. NUNCA pôr linhas ou elementos decorativos acima do "T"; não adicionar gráficos ao logo nem mudar o espaçamento das letras.
- **Header (visual loja, atual):** sempre sólido; no computador, logo à esquerda, categorias no meio (Roupas abre menu grande) e ícones finos à direita; no celular, menu à esquerda, logo ao centro, ícones à direita. Tudo na **mesma cor** (variável `--hc`). (No visual editorial: transparente sobre o banner e sólido ao rolar, `body.sol`.)
- **Hero (primeira imagem da home):** 1ª tela = **imagem de início** (parede com luz `public/assets/brand/inicio.jpg`, sem as manchinhas do original; logo no centro; frase manuscrita `inicio-frase.svg`, vetores do Canva, original em `referencias/imagem-inicio-canva.svg`). Depois, as peças se revezando **uma por vez** (computador: foto inteira à direita e painel greige com NEW IN, nome, preço e botão SHOP NOW à esquerda; celular: foto na tela toda com SHOP NOW), com link para a peça. Troca a cada 5 s. Configuração em `hero` no `data/config.json`; código em `src/components/HeroShop.tsx` e `src/styles/hero.css`. **Pendente:** a frase do Canva está com erros ("atemperal", "auténtica"); trocar o SVG quando corrigirem.
- **Qualidade:** imagens nítidas (ultra HD). Hoje as fotos vêm de um PDF comprimido (~1400 px); pedir as fotos originais.

## Regras de negócio (vieram do catálogo da cliente)
- **Pagamento (regra atual):** o preço de vitrine já embute 5% (taxa do Mercado Pago): vitrine = preço base (preço sugerido da planilha) × 1,05, **arredondado para cima até terminar em ,90** (`pagamento.centavosVitrine`). Cartão de crédito em até **2x sem juros** ou débito, pelo Mercado Pago, pagam a vitrine. **Pix: 5% de desconto** sobre a vitrine, pago na chave Pix em `pagamento.pix` do `data/config.json` (hoje, provisoriamente, a chave aleatória da Victoria Nascimento da Silva no Mercado Pago; trocar pelo CNPJ da loja quando houver). Cupom vale sobre a vitrine; cálculo por peça (cada peça vai ao Mercado Pago com seu valor exato).
- **Entrega:** **Correios (PAC/SEDEX)** com frete calculado pelo CEP pelo **Melhor Envio** (token em `MELHORENVIO_TOKEN`, só servidor; código em `src/lib/frete/` e `src/app/api/frete/`; regras em `entrega.correios` do `data/config.json`: origem CEP 66640-001, envelope de segurança, peso por tipo de peça). **Frete grátis acima de R$ 799** em peças (vitrine com cupom): o serviço mais barato sai grátis. O **desconto Pix vale só sobre as peças**, nunca sobre o frete. O frete entra no total (item a mais no Mercado Pago, recotado no servidor; soma no Pix). Em Belém também: entrega por aplicativo, mediante consulta (valor por conta da cliente, informado na compra, fora do pagamento online). **Retirada** possível (endereço enviado após confirmar a compra).
- **Trocas:** até 7 dias, com etiqueta fixada na peça, conforme estoque, solicitadas pelo atendimento.
- **Atendimento (WhatsApp):** Giovana (91) 99965-4699 · Victoria (91) 99963-1582. Instagram: @tramissebrasil.
- Checkout: cartão → **Mercado Pago** (Checkout Pro, redireciona); Pix → **QR Code/copia e cola** gerado no site com a chave da loja; sempre dá para **enviar pelo WhatsApp**. Em todos os casos o resumo vai para a atendente pelo WhatsApp. Não coletar dados de cartão no site. O frete dos Correios entra no valor pago online; a entrega por aplicativo não.

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
- **Dois visuais:** `aparencia` no `data/config.json` = `"loja"` (**em uso**, aprovado pela cliente: estética de loja: cabeçalho com categorias e menu grande, faixa de vantagens, títulos em sans maiúsculo, vitrine comercial). O visual loja fica todo em `src/styles/loja.css`, só com `body.loja`; blocos exclusivos usam `.lj-only` / `.ed-only`. ou `"editorial"` (visual anterior). Prévia sem publicar: `?visual=editorial` / `?visual=loja`.
- `src/styles/logo.css`: carregado depois; troca o logo pelo vetor definitivo e ajusta as larguras (o logo novo é ~12,6:1).
- `data/`: `config.json`, `products.json`, `colecoes.json`, `paginas.json`. Lidos só por `src/lib/config.ts`, `src/lib/catalog.ts` e `src/lib/paginas.ts` (trocar por banco/API ali).
- `src/lib/payment/`: regras de preço (`pricing.ts`: vitrine, desconto Pix, parcelas), Pix copia e cola/QR (`pix.ts`, padrão BR Code), montagem do pedido a partir do catálogo (`pedido.ts`), contrato de provedor (`provider.ts`), WhatsApp (`whatsapp.ts`, mesma mensagem do site original) e Mercado Pago (`mercadopago.ts`, só servidor; token em `MERCADOPAGO_ACCESS_TOKEN`).
- **Pedidos por e-mail:** `src/lib/avisoPedido.ts` registra cada pedido finalizado no Netlify Forms (formulário `pedidos` em `public/__forms.html`); a Netlify envia e-mail pelas notificações configuradas no painel. Nunca colocar e-mails de destino no código.
- `src/app/api/pagamento/mercadopago/`: cria o link (POST, recalcula o preço no servidor) e consulta o pagamento (GET `[id]`). Retorno em `/checkout/retorno`.
- Imagens em `public/assets/` (servidas em `/assets/...`); fotos das peças em `public/assets/products/<slug>-<n>.jpg`. Peça sem foto mostra o degradê na cor da peça.
- `fotos-nao-identificadas/`: fotos recebidas que não correspondem a peças do catálogo.
- **Catálogo = estoque real** (planilha de 30/09/2026, importada por `scripts/importar-estoque-2026-09.mjs`, que não roda de novo). Cada variante (cor + tamanho) tem o estoque real; o site não deixa comprar acima dele (página, sacola e servidor). Custo, lucro e fornecedora **nunca** vão para o site (o catálogo é público).
- **Coming soon:** `emBreve: true` no produto. Aparece só em `/categoria/coming-soon` (e na seção da home), com etiqueta COMING SOON e botão "Avise-me quando chegar" (WhatsApp) no lugar da compra.
- **Esgotada:** todas as variantes com `estoque: 0` (e sem `emBreve`). Continua no site com etiqueta ESGOTADO, no fim das listas, com "Esgotado · Avise-me" (WhatsApp) no lugar da compra; sai do banner da home (`esgotado()` em `src/lib/catalog.ts`). Conjuntos vendidos juntos viram um produto só (ex.: Conjunto Mayumi, Juliemy, Hannah).
- `fotos-fora-do-estoque/`: fotos de peças do catálogo antigo que não estão no estoque atual.

## Estado atual e pendências
- Feito: home editorial, seção de vídeos em carrossel, categorias com filtros, produto com galeria/zoom, sacola com cupom (`TRAMISSE10`), checkout por etapas, conta/favoritos (localStorage), páginas institucionais.
- Vídeos: preencher `src` em `CFG.videos` (ainda não há vídeos reais).
- Acessórios e Sale estão vazios (catálogo só tem roupas, sem preço promocional).
- 42 das 55 peças sem foto e sem descrição (as novas da planilha). Cor "Cor única" (`un`) onde a planilha não informa a cor.
- Estoque real, fotos individuais por peça, textos de privacidade/termos, TikTok/Pinterest pendentes.
- Migração para Next.js feita (rotas reais). Próximo passo: backend/plataforma de e-commerce (produtos, estoque, pedidos, clientes, cupons, pagamento Pix/cartão) e painel administrativo em `/admin`.
