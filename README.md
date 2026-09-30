[style.css](https://github.com/user-attachments/files/32875853/style.css)
[images.js](https://github.com/user-attachments/files/32875848/images.js)
[products.js](https://github.com/user-attachments/files/32875847/products.js)
[config.js](https://github.com/user-attachments/files/32875846/config.js)
[app.js](https://github.com/user-attachments/files/32875844/app.js)


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
   > Leia o CLAUDE.md e o README.md. Quero migrar este site estático para Next.js mantendo a identidade visual, com rotas reais e dados de produtos vindos de um arquivo/API assets: products, <img width="1179" height="1339" alt="WhatsApp Image 2026-09-30 at 4 27 00 PM" src="https://github.com/user-attachments/assets/89b26f38-262e-4d57-907d-2763e3dccbcc" />
<img width="1179" height="1320" alt="WhatsApp Image 2026-09-30 at 4 27 00 PM (2)" src="https://github.com/user-attachments/assets/ef6761f3-160d-4b38-8418-28a2440fdbc5" />
<img width="1132" height="1378" alt="WhatsApp Image 2026-09-30 at 4 27 00 PM (1)" src="https://github.com/user-attachments/assets/c26b6e0e-ff45-4d79-ae92-7dde83c7a3e1" />
<img width="1066" height="1600" alt="WhatsApp Image 2026-09-30 at 4 26 59 PM" src="https://github.com/user-attachments/assets/29bb3b83-d91f-4b46-96b6-d84c0c3b4e4d" />
<img width="1086" height="1600" alt="WhatsApp Image 2026-09-30 at 4 26 59 PM (4)" src="https://github.com/user-attachments/assets/7e547692-44d2-4dd6-a7bc-83de719733be" />
<img width="1100" height="1600" alt="WhatsApp Image 2026-09-30 at 4 26 59 PM (3)" src="https://github.com/user-attachments/assets/6a0cbfe5-d730-4ccc-9ddc-40bc7a3b5437" />
<img width="1179" height="1536" alt="WhatsApp Image 2026-09-30 at 4 26 59 PM (2)" src="https://github.com/user-attachments/assets/8a58694e-b6ff-49e1-a585-aac30419c371" />
<img width="933" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 59 PM (1)" src="https://github.com/user-attachments/assets/dbd2dc36-eb32-4936-bb2a-3b0dc05d91cf" />
<img width="1066" height="1600" alt="WhatsApp Image 2026-09-30 at 4 26 58 PM (4)" src="https://github.com/user-attachments/assets/f4d64d3e-2d55-4d6f-8d18-a6c30eb77150" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 27 01 PM" src="https://github.com/user-attachments/assets/a1c34606-0f3a-4949-aa4d-405ab423e73d" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 27 00 PM (4)" src="https://github.com/user-attachments/assets/2343b9ac-7441-4432-9588-0870e1664c98" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 27 00 PM (3)" src="https://github.com/user-attachments/assets/1a3bc830-a791-4fe4-a62f-46e59f05ddc0" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 58 PM" src="https://github.com/user-attachments/assets/5819bae3-bf3d-49be-9f3a-e86c1fe7c2f9" />
<img width="1023" height="1537" alt="WhatsApp Image 2026-09-30 at 4 26 58 PM (3)" src="https://github.com/user-attachments/assets/7594cca2-99a2-444d-bef9-35b9c30eb6c4" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 58 PM (2)" src="https://github.com/user-attachments/assets/9d0d24cb-29b1-4385-b896-98ba902e43b9" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 58 PM (1)" src="https://github.com/user-attachments/assets/5e53e640-0db4-47a7-9f36-cda93524498e" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 57 PM" src="https://github.com/user-attachments/assets/40a04466-5ade-4f2e-bfc3-077e9bf54d10" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 57 PM (1)" src="https://github.com/user-attachments/assets/4868f2b9-1059-4494-b2de-51cd9a9b9fc1" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 28 PM" src="https://github.com/user-attachments/assets/8de89640-8841-495b-8637-da6268ab17bf" />
<img width="1023" height="1537" alt="WhatsApp Image 2026-09-30 at 4 26 28 PM (2)" src="https://github.com/user-attachments/assets/f6255142-642e-45a6-975b-0725e5ccb687" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 28 PM (1)" src="https://github.com/user-attachments/assets/882ac135-09c1-45b3-b772-1731170d7748" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 27 PM" src="https://github.com/user-attachments/assets/868c3375-a5dc-4cd2-817d-6a32762bd64a" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 27 PM (4)" src="https://github.com/user-attachments/assets/07fa6c14-c478-407b-810d-549c28641879" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 27 PM (3)" src="https://github.com/user-attachments/assets/1817da69-a884-44cd-8718-6e20c506292e" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 27 PM (2)" src="https://github.com/user-attachments/assets/c5eb53d5-41b5-4092-9f43-936adf69352f" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 27 PM (1)" src="https://github.com/user-attachments/assets/d5c0b96d-510c-4d02-9711-0c1e5500ad7b" />
<img width="853" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 26 PM" src="https://github.com/user-attachments/assets/cfe88e0b-593d-4925-bb62-f345d4495167" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 26 PM (4)" src="https://github.com/user-attachments/assets/5b9c8fac-77de-4f53-9da0-b08c60d74a48" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 26 PM (3)" src="https://github.com/user-attachments/assets/20864a94-9698-44ec-9ecc-d76a230a9934" />
<img width="852" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 26 PM (2)" src="https://github.com/user-attachments/assets/82b7bb5b-725e-4b37-b55f-671cbb96510d" />
<img width="853" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 26 PM (1)" src="https://github.com/user-attachments/assets/09820ad5-1ecb-4946-a99b-f2da5004f49d" />
<img width="852" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 25 PM" src="https://github.com/user-attachments/assets/f78cdcd5-ddec-4453-b476-b6064d6e98ec" />
<img width="852" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 25 PM (4)" src="https://github.com/user-attachments/assets/c7581afc-f4fb-41dc-91ce-054d7849974d" />
<img width="852" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 25 PM (3)" src="https://github.com/user-attachments/assets/70724751-1e02-4bb8-994e-71c12199b60f" />
<img width="852" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 25 PM (2)" src="https://github.com/user-attachments/assets/a4c95751-9498-4a84-af8b-04635d4fe84c" />
<img width="852" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 25 PM (1)" src="https://github.com/user-attachments/assets/b9a581d8-8cf4-4afa-a33d-dd09ce684145" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 24 PM" src="https://github.com/user-attachments/assets/30963e07-e5f2-46a4-a6f2-e5df974af668" />
<img width="853" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 24 PM (4)" src="https://github.com/user-attachments/assets/8a9ac513-6995-462f-8758-0e5a1d0cbe95" />
<img width="853" height="1280" alt="WhatsApp Image 2026-09-30 at 4 26 24 PM (3)" src="https://github.com/user-attachments/assets/5bdbd628-061e-42c3-b4b9-2e7eedd64c40" />
<img width="1024" height="1536" alt="WhatsApp Image 2026-09-30 at 4 26 24 PM (2)" src="https://github.com/user-attachments/assets/bfd5636c-e47a-47d4-97f9-8714c45fee73" />
<img width="1024" height="1537" alt="WhatsApp Image 2026-09-30 at 4 26 24 PM (1)" src="https://github.com/user-attachments/assets/fa5f369c-c2e8-4784-8271-6205062fd1cf" />
<img width="1120" height="1388" alt="WhatsApp Image 2026-09-30 at 4 26 23 PM" src="https://github.com/user-attachments/assets/d3d89beb-1eba-4362-85f9-cc728be6e07a" />
<img width="1120" height="1400" alt="WhatsApp Image 2026-09-30 at 4 26 23 PM (4)" src="https://github.com/user-attachments/assets/547371a3-e71e-47d9-8a6c-925e8092b6d6" />
<img width="640" height="800" alt="WhatsApp Image 2026-09-30 at 4 26 23 PM (3)" src="https://github.com/user-attachments/assets/a57215a2-31f4-4eeb-a622-b9f463dba9b7" />
<img width="1130" height="1600" alt="WhatsApp Image 2026-09-30 at 4 26 23 PM (2)" src="https://github.com/user-attachments/assets/792cbf9d-53f9-4ff7-b4d9-0a54f218017c" />
<img width="1130" height="1600" alt="WhatsApp Image 2026-09-30 at 4 26 23 PM (1)" src="https://github.com/user-attachments/assets/ec3697e9-46e3-44d3-9842-25e9b56e0142" />
<img width="1120" height="1388" alt="WhatsApp Image 2026-09-30 at 4 26 22 PM" src="https://github.com/user-attachments/assets/3e46540a-e41f-416e-a67b-25e2d2fb454b" />
<img width="1290" height="1600" alt="WhatsApp Image 2026-09-30 at 4 26 22 PM (1)" src="https://github.com/user-attachments/assets/f6a9daf9-ab52-491e-a8f4-6198694efedb" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 41 PM" src="https://github.com/user-attachments/assets/fc13753f-6550-4965-aac2-aaf05111dd9b" />
<img width="1130" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 41 PM (1)" src="https://github.com/user-attachments/assets/0814134a-53bc-4fd7-a506-c4f43fd754a0" />
<img width="640" height="800" alt="WhatsApp Image 2026-09-30 at 4 25 40 PM" src="https://github.com/user-attachments/assets/32c07f60-8427-4644-8963-c6d8c516312d" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 40 PM (5)" src="https://github.com/user-attachments/assets/8afc37a6-2c29-45fa-9795-ac7aa6f8201d" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 40 PM (4)" src="https://github.com/user-attachments/assets/40d5d473-af0a-4d18-9338-2573c97c87f5" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 40 PM (3)" src="https://github.com/user-attachments/assets/a30a0238-15d9-4b35-868c-6596ce0c1f44" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 40 PM (2)" src="https://github.com/user-attachments/assets/a665b16e-7373-416a-afc1-55c468b4747e" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 40 PM (1)" src="https://github.com/user-attachments/assets/79de3c63-af6e-4def-ab55-77064aa6fffd" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 39 PM" src="https://github.com/user-attachments/assets/82d15f6f-49cf-40ea-8f8b-e534d1ada4b0" />
<img width="640" height="800" alt="WhatsApp Image 2026-09-30 at 4 25 39 PM (4)" src="https://github.com/user-attachments/assets/0210c64c-5ed9-4fd1-8f90-4a20844efedb" />
<img width="640" height="800" alt="WhatsApp Image 2026-09-30 at 4 25 39 PM (3)" src="https://github.com/user-attachments/assets/b8283fa4-0ea8-41bd-bbec-a78a32727a58" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 39 PM (2)" src="https://github.com/user-attachments/assets/f2d9070a-c2ae-4be9-8136-7169b0c0967b" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 39 PM (1)" src="https://github.com/user-attachments/assets/c79a8430-96d9-4b21-b40d-34015549befb" />
<img width="738" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 38 PM (4)" src="https://github.com/user-attachments/assets/403707e6-888a-4e50-b99f-38b9612b00f0" />
<img width="738" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 38 PM (3)" src="https://github.com/user-attachments/assets/2a13551c-42e9-402f-9d18-5017d09006de" />
<img width="1132" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 38 PM (2)" src="https://github.com/user-attachments/assets/0dc3daee-7364-464e-bfe0-99b2bc98845f" />
<img width="1122" height="1402" alt="WhatsApp Image 2026-09-30 at 4 25 42 PM" src="https://github.com/user-attachments/assets/494c84b9-97ee-4017-b482-dd697a2c5d6e" />
<img width="1122" height="1402" alt="WhatsApp Image 2026-09-30 at 4 25 41 PM (4)" src="https://github.com/user-attachments/assets/c2296590-2d69-4616-ba78-6ef696684977" />
<img width="1122" height="1402" alt="WhatsApp Image 2026-09-30 at 4 25 41 PM (3)" src="https://github.com/user-attachments/assets/1b50e451-d8f5-437f-bdab-1823a22c2cfd" />
<img width="1130" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 41 PM (2)" src="https://github.com/user-attachments/assets/4f4e167a-7e46-4982-93ea-864ec431e884" />
<img width="1072" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 38 PM" src="https://github.com/user-attachments/assets/07bc6d4b-5046-4948-9a4a-81b085ac1474" />
<img width="738" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 38 PM (1)" src="https://github.com/user-attachments/assets/d8082c99-c986-4b05-a720-1313d6be824d" />
<img width="738" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 37 PM" src="https://github.com/user-attachments/assets/ca32b999-d8b8-4e91-b29c-eb25d3c54a4e" />
<img width="738" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 37 PM (4)" src="https://github.com/user-attachments/assets/344de9d3-ec20-48f9-aeae-197d6d1c6dac" />
<img width="738" height="1600" alt="WhatsApp Image 2026-09-30 at 4 25 37 PM (3)" src="https://github.com/user-attachments/assets/b21808b1-505a-4f09-b479-784cc865dd54" />
   < assets> logo.<img width="1600" height="600" alt="WhatsApp Image 2026-09-30 at 5 15 20 PM" src="https://github.com/user-attachments/assets/27d2e6e1-47cc-4bb8-bf60-177b7d7db76f" />
preparado para pagamento e painel administrativo
