# Landing Page — Rock Your Business

## Arquivos
- `index.html`: estrutura, conteúdo, metadados SEO e JSON-LD.
- `styles.css`: estilos complementares ao Tailwind.
- `app.js`: menu mobile, rolagem e ícones Lucide.
- `robots.txt`, `sitemap.xml`, `site.webmanifest`: base técnica de SEO.

## Antes de publicar
1. Troque as imagens placeholder nos pontos comentados no HTML.
2. Substitua a URL da Company Page do LinkedIn no JSON-LD.
3. Confirme preços, limites e benefícios dos planos.
4. Crie `/politica-de-privacidade` e `/termos-de-uso`.
5. Crie `favicon.ico`, imagem Open Graph e logo nos caminhos indicados.
6. Teste o JSON-LD no Rich Results Test e valide o sitemap no Search Console.
7. Para performance máxima, substitua Tailwind CDN por build local na versão final.


## Links de parceiros no domínio institucional

A landing page suporta links institucionais de parceiro sem páginas duplicadas:

- `https://www.rockyourbusiness.com.br/hub4seg`
- `https://www.rockyourbusiness.com.br/cqcs`
- `https://www.rockyourbusiness.com.br/<slug>`

A regra está dividida entre:

- `.htaccess`: preserva arquivos/rotas reais e entrega `index.html` para um slug limpo de primeiro nível.
- `app.js`: valida o slug em `https://app.rockyourbusiness.com.br/api/public/partners/validate`, aplica first-touch em `ryb_partner_slug` com `Domain=.rockyourbusiness.com.br`, TTL de 30 dias, e adiciona `?partner=` aos links de signup como fallback.
- `404.html`: destino de slugs inexistentes/inativos.
- O app continua sendo a fonte de verdade e resolve `slug -> partner_id` somente na criação da nova conta.

A home `/` não chama o endpoint de parceiros. Novos parceiros cadastrados no Admin não exigem novo arquivo ou deploy específico da landing page.
