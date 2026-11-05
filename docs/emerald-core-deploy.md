# TRIUNEXA — Núcleo esmeralda por scroll

## O que foi lido na referência
Repositório: https://github.com/devinilabs/iron-man . Foram lidos AGENTS.md, CLAUDE.md, src/components/sections/Hero.tsx, CinematicReveal.tsx, SmoothScrollProvider.tsx, src/lib/hero.ts, cinematic.ts, app/page.tsx e globals.css; a árvore de src e public também foi inspecionada. public/frames e public/frames2 contêm 169 JPGs cada. Nenhuma imagem da referência foi copiada.

O efeito principal usa canvas 2D e sequências de imagens: seção longa, viewport sticky, progresso normalizado do scroll, índice inteiro do frame e redesenho apenas quando ele muda. Os textos usam o mesmo progresso. Lenis suaviza a rolagem. O mecanismo do objeto observado não depende de um modelo Three.js ou de Framer Motion.

Esta implementação reproduz a técnica de progresso/frame/canvas com geometria original e um carregador opcional de WebP. Não copia código de conteúdo, textos, imagens, personagens ou marcas da referência.

## Arquitetura entregue
Mantém React + Vite e todo o catálogo existente. Nenhuma migração de banco ou mudança de autenticação é necessária.

- core/config.ts: cores, 720 amostras procedurais e configuração opcional de frames, qualidade, duração, cálculo de capítulos/progresso.
- core/renderer.ts: núcleo esmeralda original, faces desmontáveis, nós, linhas, órbita, grade, travessia e remontagem.
- core/CoreCanvas.tsx: canvas fixo, atualização por requestAnimationFrame, Lenis opcional, redimensionamento, texto/canvas sincronizados, limpeza ao entrar no ADM.
- core/Scenes.tsx: cinco capítulos e textos originais.
- core/core.css: cenas sticky longas, serifada/sans, máscaras de texto e responsividade.
- core/frames.ts: janela de frames sob demanda, até 3 downloads simultâneos, cache de 8 no celular e 12 no desktop.
- public/core-frames/manifest.json: frames desligados enquanto os arquivos originais não existirem.
- PublicPlatform.tsx: integra a sequência sem alterar a lógica de busca, contatos, filtros, feedback ou ADM.

Hero e demais capítulos: 260 alturas de viewport no desktop, 230 no celular; catálogo pelo menos 240/220, crescendo com os cards. Movimento reduzido elimina o movimento da câmera e encurta as cenas. Canvas não intercepta cliques. A aba oculta não desenha. DPR limitado a 2 no desktop e 1,35 no celular. 60fps é uma meta dependente do dispositivo, não uma medição garantida.

## Publicar no GitHub Pages
1. O projeto já usa o workflow .github/workflows/deploy-pages-vite.yml. Em Settings → Pages, use GitHub Actions como origem.
2. Preserve vite.config.ts: base '/triunexa-digital/' quando GITHUB_ACTIONS=true.
3. No computador: git clone https://github.com/Daniel-Soliz/triunexa-digital.git ; entre na pasta e rode npm ci.
4. Rode npm run lint, npm run build e npx playwright test tests/public-platform.spec.ts tests/cinematic-enhancement.spec.ts.
5. Faça commit/push em main. O workflow executa npm install, npm run build e publica dist.
6. Acompanhe Actions → Deploy Vite to GitHub Pages. Abra https://daniel-soliz.github.io/triunexa-digital/ depois do sucesso. PWA e service worker foram preservados com uma nova versão do cache.

Não é necessário Next.js. Migrar para Next apenas para este efeito adicionaria uma mudança de arquitetura sem benefício para o catálogo estático atual.

## Gerar frames originais com IA
Os frames reais não foram gerados. A versão entregue desenha o núcleo por código. A geometria usa 720 amostras virtuais para suavizar a sequência longa. O manifest de imagens sugere 180 WebPs provisórios; ambos os números são ajustáveis.

1. Gere cinco keyframes com o mesmo núcleo, fundo, seed/referência e enquadramento. Use um modelo de imagem/vídeo que aceite referências e quadros inicial/final. Não use personagens, armaduras, logotipos ou elementos da referência.
2. Use este prompt base, alterando somente o estágio:

"Objeto abstrato original: núcleo geométrico esmeralda feito de pequenos nós luminosos e conexões delicadas, faces translúcidas verdes e detalhes dourados suaves. Fundo uniforme #0d1c15. Sem texto, letras, marcas, personagens, armaduras ou interface. Câmera e iluminação consistentes, objeto central com margem de segurança ampla para recorte vertical. Estágio: [compacto pequeno / crescimento monumental / faces em órbita / nós em grade / aproximação atravessando o centro / remontagem compacta]. Acabamento de vidro esmeralda e metal dourado discreto, luz suave, contraste cinematográfico."

3. Interpole esses estágios num vídeo de aproximadamente 12 segundos, mantendo identidade e trajetória contínuas. Modelos de vídeo podem introduzir deformações; revise antes de usar.
4. Extraia até 180 frames WebP, por exemplo com FFmpeg:

ffmpeg -i nucleo-original.mp4 -t 12 -vf "fps=15,scale=1440:-2" -frames:v 180 -c:v libwebp -quality 80 public/core-frames/frame_%04d.webp

5. Confira o número efetivo de arquivos gerados. Ajuste count no manifest para esse número (mínimo 2, máximo 600).
6. Em public/core-frames/manifest.json, mude enabled para true. pattern deve continuar frame_{index}.webp, padding 4, start 1. fit aceita cover ou contain.
7. Publique. O mesmo progresso passa a escolher WebPs, sem alterar textos ou contatos. Arquivo ausente ou inválido usa o núcleo por código naquele frame.

O carregamento é lazy pela janela de proximidade: não baixa os 180 de uma vez. Imagens programáticas usam carregamento imediato apenas depois de entrarem nessa janela. Não ative o manifest antes de subir os arquivos.

## Ajustes
Cores: core/config.ts → colors e core/core.css → variáveis --core-*.
Velocidade narrativa: altura .core-chapter no CSS; mais altura = mais rolagem por cena.
Intensidade/quantidade: motionScale, nodes, mobileNodes, dpr e mobileDpr em config.ts.
Textos: core/Scenes.tsx. Links e funções comerciais: PublicPlatform.tsx.
Frames: manifest.json e public/core-frames/*.webp.
Trajetória/desmontagem: corePose em renderer.ts.

## Validação
Testes de progressão e limites de frames, continuidade das poses, movimento reduzido, largura no celular, frames ausentes, desenho do canvas e navegação de contatos/ADM, além dos testes existentes do catálogo. Os dados de empresas e a tarefa diária existentes não foram alterados por este redesign.
