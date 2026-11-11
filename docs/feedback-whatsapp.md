# Feedback e contato WhatsApp — TRIUNEXA DIGITAL

## Fluxo no site
- O convite de feedback aparece depois de 60 segundos em que a página está visível, uma única vez por sessão da aba.
- Se o visitante recusar, continua navegando. Se enviar, o feedback é salvo na tabela privada `truinexa_public_feedback` e continua disponível no painel ADM.
- O site solicita ao Supabase Edge Function `truinexa-feedback-notify` o envio de uma notificação, sem incluir o texto do usuário na requisição. A função consulta o feedback recém-salvo, limita a uma notificação por registro e não permite escolher o destinatário pela API.
- O estado de entrega aparece no painel: **E-mail pendente**, **Encaminhando e-mail**, **E-mail enviado** ou **Falha no e-mail**.
- O contato flutuante no canto inferior direito abre o WhatsApp em `https://wa.me/5511932240546`, com mensagem opcional pré-preenchida.

## Ativar e-mails automáticos
O endereço de destino está fixado no código da função: `danielsoliz1973@gmail.com`. Para realmente encaminhar mensagens, o administrador precisa configurar **as duas variáveis privadas abaixo** no projeto Supabase `wsyxykfhxguhyojitpbl`, em Edge Functions > Secrets:

- `RESEND_API_KEY` — chave de API do serviço Resend, criada na conta do proprietário.
- `TRIUNEXA_FEEDBACK_FROM` — remetente permitido pelo Resend, em um domínio verificado (exemplo de formato: `TRIUNEXA Digital <notificacoes@dominio-verificado.com.br>`). O exemplo não deve ser copiado sem verificar a posse do domínio.

Não escreva essas chaves no GitHub, no Vite ou no navegador. A função já está implantada; após configurar os secrets, novos feedbacks passam a tentar o encaminhamento. O resultado só será **E-mail enviado** quando a API do provedor aceitar o envio, o que não prova entrega na caixa de entrada.

Sem esses dois secrets, o feedback **continua salvo e visível no ADM**, mas não é encaminhado por e-mail; o estado permanece **E-mail pendente**.

## Teste de verificação
1. Abra a versão publicada, aguarde um minuto ou acione manualmente **Deixar feedback**.
2. Envie uma mensagem de avaliação de teste.
3. Confira no painel ADM se a mensagem apareceu. Depois de ativar o provedor, verifique o estado de envio e a caixa de entrada.
4. Se a função indicar falha, examine os logs de `truinexa-feedback-notify` e a validação do domínio no Resend.

Não envie e-mails promocionais a quem fornece feedback: o envio aqui é somente uma notificação ao administrador.
