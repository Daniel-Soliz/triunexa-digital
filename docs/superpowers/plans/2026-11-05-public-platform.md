# Public Platform Implementation Plan

Goal: catálogo aberto, crédito, feedback opcional e ADM privado com métricas reais do banco.
Architecture: React/Vite e Supabase existente; projeção pública sincronizada sem expor CRM.
Spec: ../specs/2026-11-05-public-platform-design.md

- [ ] Testar acesso sem login, busca, links, feedback dispensável e restrição do painel.
- [ ] Criar migração com projeção dos leads verificados, owner exclusivo, RLS, heartbeat idempotente e feedback limitado.
- [ ] Implementar PublicPlatform.tsx, publicApi.ts, AdminPanel.tsx e estilos responsivos. Trocar ponto de entrada público; manter código do CRM preservado.
- [ ] Corrigir base case-sensitive do Pages, atualizar cache e metadados.
- [ ] Verificar TypeScript/build, testes de navegação e RLS como anon/não titular/titular. Confirmar sincronização e heartbeat sem inflar visitas.
- [ ] Salvar alterações no GitHub, publicar e verificar workflow e versão servida.

Review focus: storage bloqueado não quebra página; falhas de rede têm mensagem e repetição; feedback não duplica por sessão; auth recovery permite definir senha; URLs inseguras não se tornam links; métricas não acessíveis por anon/outro admin.
