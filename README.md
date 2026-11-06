# TRIUNEXA DIGITAL — Comunidade aberta

Catálogo público gratuito de empresas e contatos comerciais com fonte pública e data de validação. Sem cadastro e sem carteira. Desenvolvido por **Daniel Soliz**.

- Instagram profissional: https://www.instagram.com/dsdigital.tech/
- Instagram do desenvolvedor: https://www.instagram.com/danielsoliz.ds/
- Plataforma: https://daniel-soliz.github.io/triunexa-digital/
- ADM: https://daniel-soliz.github.io/triunexa-digital/#adm

## Acesso administrativo

Exclusivo da conta já existente do titular Daniel Soliz. Não há cadastro público de administradores. Use o e-mail administrativo e sua senha do Supabase Auth; para definir ou recuperar a senha, informe o e-mail e clique em **Definir ou recuperar minha senha**. O link chega ao e-mail do titular. Nenhuma senha administrativa está no código. A autorização é validada no banco, inclusive para outros administradores do CRM legado.

## Dados e métricas

`truinexa_public_leads` contém apenas os campos comerciais explicitamente selecionados dos registros com `source_url` HTTP(S) e `source_verified_at`. Trigger sincroniza inclusões, alterações e remoção da validação; exclusão do lead remove a projeção. Conversas, anotações, usuários, valores e históricos continuam privados. Novos registros validados da prospecção existente entram automaticamente, mas esta alteração não agenda novas pesquisas nem inventa contatos.

Feedback opcional após 20 segundos, uma solicitação por sessão. Botão permanente na área do desenvolvedor. Mensagens privadas ao titular, até 2.000 caracteres, uma por sessão. Não há envio automático a redes sociais.

Visitas começam na nova versão. Recarregar a mesma aba não duplica a sessão. Visitantes únicos são estimados por identificador aleatório no navegador. Online = identificadores ativos nos últimos 2 minutos; heartbeat a cada 30 segundos apenas com página visível. Dia usa America/Sao_Paulo. A medição não identifica pessoas, não coleta IP no banco da aplicação e pode variar com armazenamento bloqueado, abas duplicadas e bots. Limite de 20 novas sessões por identificador/hora; não substitui proteção contra bots distribuídos.

## Desenvolvimento e verificação

Node.js 22+.

```bash
npm ci
npm run dev
npm run lint
npm run build
npx playwright install chromium
npx playwright test tests/public-platform.spec.ts
```

Configuração pública em `env.example`. A chave publishable/anon é própria para o navegador e depende de RLS. Nunca colocar chave service_role no frontend. A migração `supabase/migrations/20261105160000_public_platform.sql` foi aplicada ao projeto existente; não reaplicar manualmente. O projeto studioblack7 não é utilizado.

O código do CRM anterior permanece preservado para referência e reversão; a entrada publicada usa `PublicPlatform.tsx`. Os testes anteriores de Site Studio/WhatsApp são do CRM legado, não da nova interface pública.

## Identidade visual pública

A página pública usa a composição editorial do [Onda / 8B](https://github.com/8bsite/design-studio-website-template) como referência de design: tipografia Gabarito/Onest, fundo escuro, destaque violeta, imagem circular e movimento opcional. A implementação React foi adaptada ao catálogo real da TRIUNEXA; nenhuma empresa, projeto, equipe ou resultado comercial fictício foi adicionado.

- Código de referência Onda: MIT License. Licença e créditos originais no repositório acima.
- Imagem do círculo `public/onda-orbit.jpg`: fotografia abstrata de [Creatvise / Unsplash](https://unsplash.com/photos/Fx7E3RXCSUM), usada sob a [Unsplash License](https://unsplash.com/license), não coberta pela MIT.
- Fontes Gabarito e Onest: SIL Open Font License, via Google Fonts.
- Catálogo, filtros, painel administrativo, autenticação, métricas e feedback mantêm sua integração existente com Supabase. A mudança é visual e da organização da página pública.
