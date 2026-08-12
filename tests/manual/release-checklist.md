# Checklist manual de liberação

## Metrologia

- [ ] Conferir zero, primeiro passo, transições da escala principal, meia faixa e fim da faixa em cada perfil.
- [ ] Confirmar visualmente pelo menos cinco leituras não triviais com responsável por metrologia.
- [ ] Verificar o alinhamento correto do nônio em milímetro, polegada fracionária e polegada milesimal.
- [ ] Trocar unidade/resolução e confirmar que a medida física permanece dentro da faixa e é quantizada ao passo correto.

## Interação e aula

- [ ] Arrastar com mouse e toque da posição fechada ao limite sem perder captura do ponteiro.
- [ ] Operar com setas, Page Up, Page Down, Home e End, incluindo foco visível.
- [ ] Sortear medida, confirmar resposta oculta e revelar com o controle do olho.
- [ ] Entrar e sair de tela cheia, inclusive por `Esc`, sem recorte do instrumento.
- [ ] Projetar em 1024×768 e validar leitura à distância de sala.

## Acessibilidade e responsividade

- [ ] Testar reflow em 320 CSS px e zoom de 200% sem perda de controles.
- [ ] Conferir áreas de toque e contraste em celular real.
- [ ] Navegar somente por teclado e confirmar ordem lógica.
- [ ] Validar slider, botões, estados pressionados e anúncios com NVDA + Firefox/Chrome.
- [ ] Validar VoiceOver no Safari móvel.
- [ ] Confirmar comportamento com `prefers-reduced-motion: reduce`.

## Segurança e operação

- [ ] Confirmar ausência de chamadas externas, pop-ups e downloads durante o fluxo normal.
- [ ] Conferir CSP, Permissions-Policy, Referrer-Policy, COOP e `nosniff` na URL publicada.
- [ ] Verificar console sem erros e aba de rede sem recursos bloqueados inesperadamente.
- [ ] Registrar navegador, versão, dispositivo, viewport, resultado e responsável pela revisão.
