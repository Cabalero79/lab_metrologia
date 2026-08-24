# Agentes do projeto

Este arquivo registra as frentes usadas na primeira entrega e serve como contrato para futuras rodadas. Todo agente deve preservar `PRODUCT.md`, o modelo inteiro em `lib/caliper.ts`, a ausência de anúncios/downloads/telemetria e a meta WCAG 2.2 AA.

## Contexto obrigatório de retomada

Ao iniciar uma nova sessão neste repositório, leia antes de propor alterações:

1. `docs/CODEX_HANDOFF.md`, que registra o estado funcional aprovado e as pendências reais;
2. `PRODUCT.md` e `DESIGN.md`, que governam produto e interface;
3. o contrato específico do instrumento que será alterado.

Não trate documentos históricos como estado atual quando divergirem do handoff. Preserve os anexos do usuário em `.codex-remote-attachments/` fora dos commits, salvo pedido explícito em contrário.

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

## Estado aprovado do micrômetro interno

Em 24/08/2026, o responsável do produto aprovou visualmente o micrômetro interno analógico tipo paquímetro, Série 145, de duas pontas, após os refinamentos registrados até `a28c547`. O estado vigente inclui:

- faixa estrita `5,00–15,00 mm`, resolução `0,01 mm` e passo de fuso `0,50 mm`;
- pontas cilíndricas paralelas, uma fixa e outra móvel;
- escala longitudinal única na bainha, centralizada e legível, com afastamento fixo junto à orelha;
- costura da bainha e limite do tambor compartilhando o mesmo datum;
- graduações circulares recortadas pelo envelope físico do tambor;
- aumento da leitura movendo a ponta e o conjunto do tambor para a esquerda, sem escala duplicada;
- arraste, toque, teclado, ajuste fino, sorteio, ocultação da resposta, lupa e tela cheia funcionais;
- validação em `320 px`, celular horizontal e desktop, inclusive nos limites `5,00` e `15,00 mm`;
- gate `npm run test:ci` com lint, TypeScript, build, 38 testes unitários/geométricos e 10 testes de smoke.

Alterações futuras devem ser incrementais e usar `docs/MICROMETER_TWO_POINT_REFERENCE_CONTRACT.md` como contrato mecânico. Não redesenhar a topologia completa para corrigir um detalhe localizado. A aprovação do produto não equivale a calibração nem substitui validação de um especialista em metrologia.

## Publicação

A versão atual com o micrômetro não está autorizada para publicação definitiva. Túneis provisórios não são endereços persistentes e não devem ser registrados como implantação. Só publicar mediante novo pedido explícito do responsável do produto.
