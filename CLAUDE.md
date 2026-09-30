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
- **Logo:** `assets/brand/logo.png` é usado como máscara CSS (`--logo`). NUNCA pôr linhas ou elementos decorativos acima do "T"; não adicionar gráficos ao logo. Se a cliente enviar o logo em SVG/PDF vetorial, trocar (qualidade ultra HD).
- **Header:** transparente sobre o banner e sólido ao rolar (classe `body.sol`); uma linha só: ícone de menu à esquerda, logo ao centro, ícones finos à direita (busca, conta, favoritos, sacola). Tudo na **mesma cor** (variável `--hc`).
- **Hero:** fundo liso greige (`#D6CDBF`), sem imagem. A cliente não gostou da foto de fundo anterior.
- **Qualidade:** imagens nítidas (ultra HD). Hoje as fotos vêm de um PDF comprimido (~1400 px); pedir as fotos originais.

## Regras de negócio (vieram do catálogo da cliente)
- **Pagamento:** Pix sem acréscimo; débito com acréscimo de 5%; crédito em até 2x com acréscimo de 5%.
- **Entrega:** exclusivamente por aplicativo, mediante consulta; valor por conta da cliente, informado na compra. **Retirada** possível (endereço enviado após confirmar a compra).
- **Trocas:** até 7 dias, com etiqueta fixada na peça, conforme estoque, solicitadas pelo atendimento.
- **Atendimento (WhatsApp):** Giovana (91) 99965-4699 · Victoria (91) 99963-1582. Instagram: @tramissebrasil.
- O checkout atual **não cobra**: monta o resumo e abre o WhatsApp da atendente. Não coletar dados de cartão no site.

## Referência de navegação
Arquitetura inspirada em leblogstore.com.br (menu, categorias, filtros, produto, sacola, checkout). **Não copiar** design, textos, imagens, logo nem código.

## Estrutura do código (Next.js, App Router, TypeScript)
- `legacy/index.html`: marcação do site estático original (referência da migração).
- `src/app/`: rotas reais (`/`, `/categoria/[...slug]`, `/produto/[slug]`, `/favoritos`, `/conta`, `/checkout`, `/institucional/[slug]`, `/admin`), sitemap e robots.
- `src/components/`: header/footer (mesmas classes do CSS original), `body.sol` ao rolar, redirecionamento de links `#/`.
- `src/styles/tramisse.css`: design system; deve receber o `css/style.css` original **sem alterações**.
- `data/`: `config.json` (CFG), `products.json` (categorias, cores, produtos), `paginas.json`. Lidos só por `src/lib/config.ts`, `src/lib/catalog.ts` e `src/lib/paginas.ts` (trocar por banco/API ali).
- `src/lib/payment/`: regras de preço (`pricing.ts`), contrato de provedor (`provider.ts`) e provedor atual via WhatsApp (`whatsapp.ts`).
- Imagens em `public/assets/` (servidas em `/assets/...`); fotos das peças em `public/assets/products/<slug>.jpg`.
- Variante de produto = cor + estoque por tamanho; estoque provisório de 2 por variante.

## Estado atual e pendências
- Feito: home editorial, seção de vídeos em carrossel, categorias com filtros, produto com galeria/zoom, sacola com cupom (`TRAMISSE10`), checkout por etapas, conta/favoritos (localStorage), páginas institucionais.
- Vídeos: preencher `src` em `CFG.videos` (ainda não há vídeos reais).
- Acessórios e Sale estão vazios (catálogo só tem roupas, sem preço promocional).
- Estoque real, fotos individuais por peça, textos de privacidade/termos, TikTok/Pinterest pendentes.
- Próximo passo de arquitetura: migrar para framework com rotas reais (SEO) e backend/plataforma de e-commerce (produtos, estoque, pedidos, clientes, cupons, pagamento Pix/cartão) e painel administrativo.
