# Plataforma pública TRIUNEXA

Catálogo gratuito e sem login ou carteira para compartilhar contatos comerciais com fonte pública validada. Manter os dados originais do CRM privados. Interface responsiva com busca, filtros, links comerciais seguros, crédito a Daniel Soliz e links @dsdigital.tech e @danielsoliz.ds. Feedback opcional solicitado após 20 segundos, dispensável e acessível também por botão permanente.

ADM exclusivo da conta existente de Daniel Soliz, com senha gerenciada pelo Supabase Auth e definição/recuperação pelo e-mail do titular. Sem cadastro público de administradores. Métricas desde o lançamento: sessões totais, navegadores únicos estimados, sessões de hoje em São Paulo e visitantes ativos em dois minutos. Feedbacks privados.

Abordagem: nova interface pública independente do CRM, tabela com projeção explícita de campos comerciais sincronizada por trigger, tabelas de métricas e feedback protegidas por RLS e RPCs limitadas de escrita pública. Evitar abrir a tabela original inteira e evitar contadores locais que não somam acessos de pessoas diferentes. Nenhuma chave privilegiada no navegador. Sessões e feedbacks têm limites por identificador; não equivalem a pessoas verificadas e não impedem bots distribuídos.

Nenhuma coleta nova fictícia: catálogo usa os registros existentes verificáveis; entradas futuras validadas são sincronizadas. Prospecção existente preservada, sem prometer mineração contínua.
