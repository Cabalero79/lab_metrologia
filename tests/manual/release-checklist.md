# Checklist manual de liberação

## Metrologia

- [ ] Conferir zero, primeiro passo, transições da escala principal, meia faixa e fim da faixa em cada perfil.
- [ ] Confirmar visualmente pelo menos cinco leituras não triviais com responsável por metrologia.
- [ ] Verificar o alinhamento correto do nônio em milímetro, polegada fracionária e polegada milesimal.
- [ ] Em milímetros, comparar desktop e celular horizontal com `entrega-satisfatoria-layout-v1` e confirmar que a projeção aprovada não mudou.
- [ ] Em ambas as resoluções de polegada, confirmar escala principal abaixo, nônio acima e traços voltados para a mesma costura, conforme `Polegadas.png`.
- [ ] Trocar unidade/resolução e confirmar que a medida física permanece dentro da faixa e é quantizada ao passo correto.

## Interação e aula

- [ ] Arrastar com mouse e toque da posição fechada ao limite sem perder captura do ponteiro.
- [ ] Ligar a lupa e repetir arraste com mouse e toque; a leitura deve permanecer monotônica, quantizada e sem salto.
- [ ] Com a lupa ligada, confirmar que a escala principal permanece fixa enquanto cursor e nônio se deslocam horizontalmente, como na visão geral.
- [ ] Com a lupa ligada, operar Setas, Shift+Setas, Page Up/Down, Home e End.
- [ ] Fechar a ampliação pelo botão X e por `Esc`; confirmar visão geral, anúncio e foco restaurados no botão da lupa.
- [ ] Confirmar que a lupa enquadra a marca principal anterior, o zero e o nônio completo no zero, meia faixa e fim de curso.
- [ ] Operar com setas, Page Up, Page Down, Home e End, incluindo foco visível.
- [ ] Sortear medida, confirmar resposta oculta e revelar com o controle do olho.
- [ ] Entrar e sair de tela cheia, inclusive por `Esc`, sem recorte do instrumento.
- [ ] Projetar em 1024×768 e validar leitura à distância de sala.

## Acessibilidade e responsividade

- [ ] Abrir em 1920×1080, 1366×768 e 1024×768 e confirmar que cabeçalho, instrumento e todos os controles aparecem sem rolagem da página.
- [ ] Em celular horizontal e 320 CSS px, confirmar que unidade, resolução, Fechar e Sortear permanecem acessíveis por rolagem vertical natural, com alvos de pelo menos 44 px e sem rolagem horizontal.
- [ ] Girar um celular de retrato para paisagem e voltar; confirmar que o canvas mantém altura legível, todos os controles continuam acessíveis e a medida não muda.
- [ ] Em celular horizontal que exponha viewport largo (até 1280×650 CSS px), confirmar que o modo compacto é ativado mesmo acima de 1000 px de largura.
- [ ] Testar reflow em 320 CSS px e zoom de 200% sem perda de controles.
- [ ] Conferir áreas de toque e contraste em celular real.
- [ ] Confirmar alvos de pelo menos 44×44 px para lupa e X em desktop, celular horizontal e zoom de 200%.
- [ ] Navegar somente por teclado e confirmar ordem lógica.
- [ ] Validar slider, botões, estados pressionados e anúncios com NVDA + Firefox/Chrome.
- [ ] Validar VoiceOver no Safari móvel.
- [ ] Confirmar comportamento com `prefers-reduced-motion: reduce`.

## Segurança e operação

- [ ] Confirmar ausência de chamadas externas, pop-ups e downloads durante o fluxo normal.
- [ ] Confirmar que `cavaleiro-samurai.png` é servido localmente e aparece no cabeçalho e na marca do instrumento.
- [ ] Conferir CSP, Permissions-Policy, Referrer-Policy, COOP e `nosniff` na URL publicada.
- [ ] Verificar console sem erros e aba de rede sem recursos bloqueados inesperadamente.
- [ ] Registrar navegador, versão, dispositivo, viewport, resultado e responsável pela revisão.
