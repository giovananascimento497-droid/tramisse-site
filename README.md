# Tramisse — site

Loja front-end estática (HTML, CSS e JavaScript puro), sem etapa de build.

## Rodar localmente
Abra por um servidor local (o logo usa máscara CSS, que não carrega via `file://`):

```bash
python3 -m http.server 8080
# ou
npx serve .
```
Acesse http://localhost:8080

## Onde editar
| O que | Arquivo |
|---|---|
| Barra superior, parcelas, acréscimo, WhatsApp, cupons, vídeos, redes | `js/config.js` |
| Produtos, cores, categorias | `js/products.js` |
| Fotos das peças | `assets/products/<slug>.jpg` (slug = nome do produto sem acentos, com hífens) |
| Logo e imagens da marca | `assets/brand/` |
| Cores, tipografia, espaçamentos | `css/style.css` (tokens no início) |
| Telas e comportamento | `js/app.js` |

**Produto novo:** adicione uma linha em `RAW` (`nome, subcategoria, preço, estilo, cor:tamanhos, descrição, flags, tecido`) e a foto com o nome do slug.
Flags: `N` novo, `K` curadoria, `B` mais vendida.

**Vídeos:** coloque arquivos em `assets/videos/` e preencha `src` em `CFG.videos` (ex.: `src:"assets/videos/look-01.mp4"`). Use MP4 (H.264) vertical, curto e leve.

## Publicar
Por ser estático, funciona em GitHub Pages, Netlify ou Vercel. Basta apontar para a raiz do repositório.

## Limitações atuais
- Rotas por `#` (ruim para SEO), dados fixos no código e pedidos enviados pelo WhatsApp. Não há pagamento, estoque real nem painel administrativo.
- Próximo passo recomendado: framework com rotas reais (por exemplo Next.js) e plataforma/back-end de e-commerce.

## Continuar no Claude Code
1. Suba este repositório no GitHub.
2. Em claude.ai/code, autorize o app do Claude no GitHub e escolha o repositório.
3. O arquivo `CLAUDE.md` já traz o contexto e as regras da marca. Primeira mensagem sugerida:
   > Leia o CLAUDE.md e o README.md. Quero migrar este site estático para Next.js mantendo a identidade visual, com rotas reais e dados de produtos vindos de um arquivo/API, preparado para pagamento e painel administrativo.
