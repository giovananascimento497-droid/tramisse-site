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
Variante = cor + tamanho + **estoque real** (quantas peças existem; o site não vende acima disso). `preco` = preço sugerido da planilha (a vitrine cobre a taxa do cartão, 14,59%, e arredonda para ,90). Flags: `novo` (New In), `curadoria`, `maisVendida`.
**Coming soon:** `"emBreve": true` (fica só na vitrine Coming Soon, com "Avise-me"). Quando a peça chegar: `"emBreve": false`, `flags.novo: true` e o estoque de cada variante.

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
- **Vitrine:** `preco` em `data/products.json` é o valor base (o que a loja quer receber). Cada peça cobre a taxa do Mercado Pago das parcelas que o preço dela permite (parcela mínima R$ 70; taxas totais: à vista 4,98%, 2x 7,51%, 3x 9,60%): vitrine = base ÷ (1 − taxa), **arredondada para cima até ,90**. Ex.: 109,90 → **R$ 115,90** (só à vista); 149,90 → **R$ 162,90** (2x de R$ 81,45); 219,90 → **R$ 243,90** (3x de R$ 81,30); 389,90 → **R$ 431,90** (3x de R$ 143,97). Pix com 10% de desconto. Ajustes em `pagamento` no `data/config.json` (`taxasCartao`, `parcelaMinima`, `maxParcelas`, `centavosVitrine`, `descontoPix`).
- **Cartão (crédito até 3x sem juros ou débito):** pago no **Mercado Pago** (Checkout Pro). Cada peça vai com o seu valor exato (com cupom, se houver); a soma é o total do site. Só a forma escolhida é liberada no Mercado Pago.
- **Pix: 10% de desconto** sobre a vitrine (R$ 175,90 → R$ 158,31), pago direto na **chave Pix da loja**. O site gera o QR Code e o Pix copia e cola com o valor e o nº do pedido; a cliente envia o comprovante pelo WhatsApp.
- **Frete:** pelos Correios (PAC/SEDEX), calculado pelo CEP e pago junto (veja "Frete" abaixo). A entrega por aplicativo (Belém) não entra no valor pago online: é combinada no atendimento.
- Sem token do Mercado Pago ou sem chave Pix, a opção correspondente vira "enviar pelo WhatsApp".

**Pix:** chave em `pagamento.pix` no `data/config.json` (hoje a chave aleatória da Victoria no Mercado Pago, provisória). Para trocar pelo CNPJ: `chave` (só números), `nome` (até 25 letras, sem acento), `cidade`, e `titular`/`banco` (só exibição).

**Para ativar o Mercado Pago:** crie uma aplicação em mercadopago.com.br/developers (Suas integrações → Credenciais) e cadastre o *Access Token* na variável `MERCADOPAGO_ACCESS_TOKEN` (Netlify → Project configuration → Environment variables; localmente, em `.env.local`, veja `.env.example`). Comece pelo token de teste (`TEST-...`) e depois troque pelo de produção (`APP_USR-...`). **Nunca** coloque o token no código.
No painel do Mercado Pago, deixe o parcelamento em até 3x **sem juros para a compradora** (a taxa já está embutida na vitrine).

## Frete (Correios pelo Melhor Envio)
- No checkout, a opção **Correios (PAC ou SEDEX)** calcula o frete pelo CEP da cliente (`src/app/api/frete/`, `src/lib/frete/`). Também há "Calcular frete" na página do produto.
- **Frete grátis:** quando as peças (vitrine, já com cupom) somam `freteGratisAcima` (R$ 799), o serviço mais barato (PAC) sai grátis. O desconto do Pix vale **só sobre as peças**; o frete entra cheio.
- O frete vai como um item a mais no Mercado Pago (o servidor refaz a cotação; o valor do navegador é ignorado), soma no QR Code do Pix e aparece no WhatsApp e no e-mail do pedido.
- Ajustes em `entrega.correios` no `data/config.json`: CEP de origem, serviços (1 = PAC, 2 = SEDEX), frete grátis, dias de preparo, medidas do envelope de segurança e peso por tipo de peça (kg, já embalada).
- **Para ativar:** criar conta em melhorenvio.com.br → **Integrações → Permissões de acesso → Gerar novo token** (marcar ao menos "shipping-calculate") → cadastrar em `MELHORENVIO_TOKEN` na Netlify → novo deploy. Para testar antes, usar um token do sandbox (sandbox.melhorenvio.com.br) com `MELHORENVIO_AMBIENTE=sandbox`. **Nunca** colocar o token no código. Sem token, a opção Correios não aparece.
- Etiquetas: compradas no painel do Melhor Envio para cada pedido pago (o site ainda não gera a etiqueta sozinho).

## Painel /admin
Em **tramisse.com.br/admin** (login com senha): editar nome, preço base, descrição, tecido, categoria, New In/Curadoria/Coming soon, estoque por cor e tamanho e fotos (envio, ordem, remoção), e cadastrar peças novas. As mudanças ficam pendentes até **PUBLICAR ALTERAÇÕES**; aí viram um commit em `data/products.json` (e fotos em `public/assets/products/`) e a Netlify publica o site em ~3 minutos. Cada publicação gasta minutos de build da Netlify: junte várias alterações antes de publicar.
- **Estoque automático:** pagamento aprovado no Mercado Pago baixa o estoque sozinho (webhook `/api/pagamento/mercadopago/webhook`, uma vez por pagamento, registrado em `data/vendas-processadas.json`). Pix e vendas fora do site: diminuir no painel.
- Estoque é salvo como diferença: se uma venda acontecer com o painel aberto, ela não é desfeita.
- **Configurar (Netlify → Environment variables):** `ADMIN_SENHA` e `GITHUB_TOKEN` (GitHub → Settings → Developer settings → Fine-grained tokens → só o repositório `tramisse-site`, permissão **Contents: Read and write**). Depois, Trigger deploy.
- Código: `src/components/admin/AdminView.tsx`, `src/lib/admin/` (login, GitHub, regras do catálogo) e `src/app/api/admin/`.

## Pedidos por e-mail (Netlify Forms)
Cada pedido finalizado no site (WhatsApp, Pix ou Mercado Pago aprovado/em processamento) é registrado no formulário **"pedidos"** da Netlify (`public/__forms.html`, enviado por `src/lib/avisoPedido.ts`). A Netlify guarda a lista em **Forms** e manda um e-mail por pedido.
- Ativar (uma vez): Netlify → projeto → **Forms** → **Enable form detection** → novo deploy.
- E-mail: **Forms → pedidos → Form notifications → Add notification → Email notification** → e-mail que recebe os pedidos. O e-mail fica só no painel da Netlify (não vai para o código).
- O plano gratuito da Netlify tem limite de envios de formulário por mês; se passar, dá para trocar por um serviço de e-mail (ex.: Resend).

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
- [x] Pagamento online: cartão pelo Mercado Pago (itens com valor exato) e Pix com 10% de desconto na chave da loja.
- [ ] Etapa 4: backend (banco, pedidos, estoque, confirmação automática de pagamento por webhook) e painel com login.

## Pendências de conteúdo
- **Fotos da marca** (fundo e capa, usadas em Sobre e no bloco Acessórios da home): enviar as fotos para `public/assets/brand/` e preencher `imagensMarca` no `data/config.json` (ex.: `"brand": "/assets/brand/fundo.jpg"`).
- **Catálogo novo (estoque real):** 55 peças (41 em estoque, 14 Coming Soon). 42 sem foto e sem descrição. 31 fotos recebidas ainda sem peça (`fotos-nao-identificadas/`, miniaturas em `indice.jpg`); fotos de peças que saíram do estoque em `fotos-fora-do-estoque/`.
