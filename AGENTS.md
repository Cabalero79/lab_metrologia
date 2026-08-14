# Agentes do projeto

Este arquivo registra as frentes usadas na primeira entrega e serve como contrato para futuras rodadas. Todo agente deve preservar `PRODUCT.md`, o modelo inteiro em `lib/caliper.ts`, a ausência de anúncios/downloads/telemetria e a meta WCAG 2.2 AA.

## Interface

Responsável por hierarquia, responsividade, projeção, toque, teclado, contraste e coerência visual. Valida a interface em navegador real e não altera fórmulas metrológicas sem revisão do agente de código.

## Código

Responsável pelo modelo físico, quantização, conversões e formatação. Toda nova resolução precisa de representação exata e fixtures independentes antes de chegar ao desenho.

## Testes

Responsável pela matriz de aceitação, casos de borda, navegadores e acessibilidade. Reproduz falhas antes de flexibilizar expectativas.

## Harness

Responsável por comandos reprodutíveis, build no Windows, testes SSR, headers, contratos, artefatos e política anti-flake. O gate local é `npm run test:ci`.

## Segurança e boas práticas

Responsável por revisão de dependências, CSP, sinks XSS, privacidade, dados, downloads e superfície do Worker. Atualiza `security_best_practices_report.md` com evidência e risco residual.

## Aprendizado

Responsável por sequência didática, exemplos, exercícios, erros frequentes e retorno de aula. Confere toda explicação com o modelo técnico e não substitui a aprovação humana de um especialista em metrologia.

## Integração

A raiz do projeto integra as frentes, resolve conflitos e só publica depois de lint, build, testes, revisão visual e segurança. Documentos de referência são informativos; `PRODUCT.md` governa estratégia e `DESIGN.md` governa decisões visuais quando existir.

## Marco satisfatório aprovado

O estado identificado pela tag Git `entrega-satisfatoria-layout-v1` é o ponto de retorno aprovado pelo responsável do produto. Nesta entrega:

- o layout de saída foi considerado satisfatório;
- a estrutura de desenho do paquímetro foi considerada correta;
- as mandíbulas inferiores usam o mesmo perfil geométrico espelhado;
- a leitura aparece junto à linha de cota e se reposiciona em aberturas pequenas;
- toque, arraste, teclado, tela cheia, resoluções e demais comandos foram considerados funcionais;
- o gate `npm run test:ci` passou integralmente.

Próximos agentes devem fazer alterações incrementais e preservar esses comportamentos. Antes de publicar, devem comparar visualmente desktop e celular horizontal com esse marco, executar `npm run test:ci` e evitar reescrever a geometria completa quando o pedido exigir apenas um ajuste localizado. Se uma rodada introduzir regressão, a tag deve ser usada como referência de comparação, não como autorização para apagar trabalhos posteriores do usuário.

## Marco satisfatório atual

O estado identificado pela tag Git `entrega-satisfatoria-layout-v2` passa a ser o ponto de retorno mais recente aprovado pelo responsável do produto. Além de preservar o marco anterior, esta entrega registra:

- projeções próprias para milímetros e polegadas, com escala principal e nônio encontrando a mesma costura;
- ampliação localizada da escala com fechamento por X ou `Escape`, mantendo arraste, toque e teclado ativos;
- leitura na linha de cota sem caixa opaca sobre a haste;
- identidade Cabalero ampliada na página e marca empilhada no instrumento, sem invadir o zero da escala;
- ativo local do Cavaleiro Samurai, sem dependência externa;
- gate `npm run test:ci` aprovado integralmente.

Para novas alterações visuais, comparar desktop, celular horizontal e 320 px com `entrega-satisfatoria-layout-v2`. A tag `entrega-satisfatoria-layout-v1` permanece como referência histórica da primeira composição aprovada.
