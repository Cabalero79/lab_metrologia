# Handoff do Codex — estado atual do laboratório

> Atualizado em 27/08/2026. Este documento é o resumo operacional para novas sessões do Codex no VS Code. Em caso de divergência com documentos históricos, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md` e este handoff governam o trabalho atual.

## 1. Situação do produto

O laboratório contém quatro instrumentos funcionais e independentes:

- paquímetro universal, preservado pelos marcos `entrega-satisfatoria-layout-v1` e `entrega-satisfatoria-layout-v2`;
- micrômetro interno analógico tipo paquímetro, Série 145, de duas pontas, aprovado visualmente pelo responsável do produto em 24/08/2026;
- micrômetro externo analógico, `0–25 mm`, com perfis exatos de `0,01 mm` e `0,001 mm`; por decisão explícita do responsável do produto em 25/08/2026, sua ferradura vigente é um U quadrado com cantos arredondados e letreiro retangular centralizado. O perfil circular de `Exemplos/ferradura.png` é apenas histórico. O conjunto continua pendente de aceite visual final.
- transferidor semicircular simples, faixa `5–180°`, divisão física de `1°` e lupa didática em `5′`, implementado em 27/08/2026 após o responsável do produto reprovar a legibilidade do goniômetro universal. O extremo esquerdo é `5`, o topo permanece `90°` e o extremo direito `180°`. O instrumento ativo não possui nônio; usa régua móvel, leitura direta e ângulo complementar. A solução aguarda aceite visual final e validação metrológica humana.

A versão atual permanece local. Não há autorização para publicação definitiva. Um túnel temporário pode ser recriado quando solicitado, mas seu endereço não deve ser registrado como implantação permanente.

## 2. Rodada histórica de legibilidade dos nônios — 26/08/2026

As subseções 2 e 2.1 registram a tentativa anterior do goniômetro universal e
não descrevem mais o quarto instrumento ativo. Não reativar essa variante sem
novo pedido explícito do responsável do produto.

Uma auditoria conjunta de Interface, Código, Testes e Harness encontrou defeitos de densidade, colisão e clipping nas projeções dos nônios. Contraste não era a causa dominante. A correção foi aplicada somente à projeção; `lib/caliper.ts`, `lib/external-micrometer.ts` e `lib/vernier-goniometer.ts` permaneceram intactos.

Estado vigente:

- paquímetro: a lupa usa zoom responsivo e busca pitch mínimo de `3 CSS px` entre divisões do nônio; em `320 px`, a visão geral pode reduzir rótulos antes de permitir colisão, sem remover divisões físicas;
- micrômetro externo: as dez marcas do nônio milesimal permanecem dentro da bainha, inclusive as divisões `8` e `9`; a lupa móvel mostra uma numeração adaptativa sem recorte;
- goniômetro: números da escala principal ficam no anel externo; as 12 marcas físicas por lado permanecem, mas os rótulos são mostrados no lado de leitura ativo e distribuídos em pistas radiais separadas; a lupa garante pelo menos `2 CSS px` por grau da escala principal;
- métricas e responsabilidades estão registradas em `docs/VERNIER_LEGIBILITY_METRICS.md`;
- Playwright verificou desktop, `844 × 390` e `320 px`, visão geral e lupa; `ArrowRight` alterou `52°30′` para `52°35′`, `Escape` fechou a ampliação e o console permaneceu sem erros.

### 2.1 Revisão visual corretiva do goniômetro — 27/08/2026

O responsável do produto reprovou a composição anterior por números
desorganizados e quase ilegíveis no nônio, borda móvel sobre números da escala
principal, um bloco cinza solto abaixo da base e um conjunto desconectado à
esquerda. A análise completa, inclusive tentativas que não devem ser repetidas,
está em `docs/VERNIER_GONIOMETER_VISUAL_REVIEW.md`.

Estado da correção local:

- a visão geral rotula apenas `30′` e `60′` no lado ativo, sem linhas-guia;
- escala principal e nônio ocupam pistas radiais distintas;
- a ampliação isola as duas escalas e a coincidência, sem ampliar lâmina,
  base, botões ou outras peças;
- o bloco de fixação cruza a lâmina e fica ancorado no pivô;
- ajuste fino e lupa possuem pontes visuais até o cabeçote;
- o bloco cinza inferior foi substituído pelo parafuso estreito sob a parte
  direita da base;
- `lib/vernier-goniometer.ts` permaneceu intacto;
- a rodada ainda depende do aceite visual do responsável do produto.

### 2.2 Substituição pelo transferidor semicircular — 27/08/2026

Após abrir a versão por túnel, o responsável do produto informou que o
goniômetro universal estava mais quebrado que na rodada anterior e escolheu um
dispositivo mais simples, baseado na captura do simulador de Eduardo J.
Stefanelli. Estado local vigente:

- o catálogo ativo mostra `Transferidor semicircular` no lugar do goniômetro universal;
- faixa fechada `5–180°`, estado inteiro quantizado a `5′` e leitura complementar `10.800′ − leitura`;
- corpo semicircular fixo, base diametral, pivô e régua móvel; nenhum nônio ou acessório do modelo INSIZE;
- lupa localizada com ponteiro central, 12 subdivisões de `5′` por grau, destaques em `15′`, `30′` e `45′` e arraste horizontal;
- visão geral reduz rótulos de `10°` para `20°` em 320 px antes de permitir colisões;
- rótulos `5°/180°` usam âncoras terminais próprias; o `180` não se sobrepõe ao
  `170`, e o pino visual do pivô tem raio máximo de `5,5 CSS px` sem reduzir a
  área de toque;
- mouse, toque, teclado, botões, sorteio, ocultação da resposta, lupa e tela cheia usam o mesmo inteiro em minutos de arco;
- navegador real verificou desktop, `844 × 390`, 320 px, `0°`, `30°`, `180°`, `ArrowRight` e `Escape`, sem erro de console;
- contrato vigente: `docs/SEMICIRCULAR_PROTRACTOR_REFERENCE_CONTRACT.md`;
- comparação: `output/playwright/protractor-reference-comparison.png`;
- a solução ainda depende do aceite visual do responsável do produto e de validação metrológica humana.

## 3. Estado aprovado do micrômetro interno

Contrato metrológico e visual vigente:

- família: micrômetro interno tipo paquímetro, duas pontas, variante de referência `145-185`;
- faixa: `5,00–15,00 mm`;
- resolução: `0,01 mm`;
- passo do fuso: `0,50 mm`, com 50 divisões no tambor;
- uma ponta permanece fixa e a outra acompanha o cabeçote móvel;
- as pontas cilíndricas se encontram paralelamente e mantêm a mesma escala física da abertura nominal;
- a bainha possui uma única escala longitudinal descendente, sem cópia sobre o tambor;
- os números ficam centralizados no corpo e próximos aos traços, mas permanecem legíveis;
- o extremo `15` mantém afastamento constante de `0,18 × B` junto à orelha;
- a borda esquerda do tambor é a mesma costura que limita a escala visível da bainha;
- traços e números circulares são recortados pelo contorno cônico do tambor;
- ao aumentar a leitura, o conjunto móvel e o tambor avançam para a esquerda;
- o modo ampliado altera somente a projeção, nunca a medida.

Estados `5,00`, `7,36` e `15,00 mm` foram verificados em navegador real. Mouse, toque, teclado (`Home`, `End`, setas e `Page Up/Down`), botões de passo, ocultar resposta, sorteio, lupa e tela cheia usam o mesmo estado inteiro.

## 4. Linha de implementação relevante

- `9c01484` — reconstrução do micrômetro a partir da referência `145-185`;
- `2eb325e` a `397d4f2` — refinamentos das pontas, visibilidade e integração da escala ao corpo;
- `fea6c7b` — correção da propriedade cinemática da escala e do conjunto móvel;
- `10c63e5` — recorte da graduação do tambor pelo envelope físico e ajuste vertical dos números da bainha;
- `a28c547` — revisão de código, limpeza de resíduos e fortalecimento do harness.

O commit de integração `745a2d6` reúne o micrômetro externo, o histórico do goniômetro universal, o transferidor semicircular ativo e a rodada de legibilidade. Ele registra a estrutura integrada do laboratório, mas não substitui os marcos visuais aprovados nem cria aceite metrológico para os instrumentos que ainda dependem dessa validação.

Os arquivos e testes do goniômetro universal permanecem versionados somente como histórico e estão fora da suíte ativa executada por `test:unit`, pois essa variante deixou o catálogo. Não reativar nem remover esse material sem uma decisão explícita do produto.

## 5. Harness vigente

O único gate obrigatório antes de concluir alterações é:

```text
npm run test:ci
```

Ele executa:

1. ESLint com regras React e jsx-a11y;
2. `tsc --noEmit` em modo estrito;
3. build Vinext/Cloudflare;
4. a suíte ativa de testes unitários, geométricos, de interação e legibilidade;
5. 10 testes de smoke, SSR, artefatos e cabeçalhos do Worker.

Em 26/08/2026, `npm run test:ci` passou integralmente após a rodada de legibilidade: lint, TypeScript, build, `76/76` testes técnicos e `10/10` smoke. O smoke obsoleto que ainda esperava o título “Paquímetro Universal Virtual” foi sincronizado com o título atual do laboratório.

Em 27/08/2026, após a revisão visual corretiva do goniômetro,
`npm run test:ci` passou integralmente: lint, TypeScript, build, `77/77`
testes técnicos e `10/10` smoke. O teste adicional impede que a visão geral
volte a exibir mais que `30′/60′` ou que a borda do nônio invada a pista dos
números principais.

Em 27/08/2026, após a substituição pelo transferidor semicircular,
`npm run test:ci` passou integralmente: lint, TypeScript, build, `69/69` testes
técnicos e `10/10` smoke. Após o pedido de subdivisão angular na lupa, o mesmo
gate voltou a passar com a escala física de `1°`, estado exato quantizado a
`5′`, complementar, topologia responsiva, arraste normal e da lupa, limites e
catálogo. Playwright verificou `30°25′ → 30°30′` por teclado, fechamento por
`Escape`, desktop, `844 × 390` e `320 px`, com zero erros de console. Os testes
do goniômetro universal foram retirados do gate junto com a variante que deixou
o catálogo; seus arquivos permanecem como histórico local.

Na revisão `a28c547`, o detector do Impeccable retornou zero achados. Na rodada local do micrômetro externo, Playwright validou `5,50 mm` por arraste centesimal, incremento milesimal de um pixel, 320 px, celular horizontal, ampliação, limite máximo e console sem erros. Em 25/08/2026, a tentativa de usar o contorno circular de `Exemplos/ferradura.png` foi rejeitada pelo responsável do produto porque invadia o batente esquerdo e interferia na circunferência da trava. A geometria vigente é o U quadrado com cantos inferiores arredondados registrado em `EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS`; o contorno circular permanece apenas como histórico. A inspeção em `25,000 mm` ainda deve preservar a haste exposta no fim do curso. Playwright multi-engine versionado, axe automatizado e baselines visuais continuam pendentes no roadmap do harness; não alegar que já existem.

Em 28/08/2026, a pose canônica `10,000 mm` do micrômetro externo recebeu
uma correção localizada na graduação da bainha: o centro do traço gravado
precede a borda finita do tambor por `0,025 × B`, mantendo o mesmo curso axial
e deixando a marca `10` visível em vez de escondida sob o contorno. A fase zero
do tambor e o zero do nônio não mudaram. Playwright conferiu `0,000`, `10,000`
e `25,000 mm` em 320 px, desktop e `844 × 390`, sem erros de console; o gate
`npm run test:ci` passou com `69/69` testes técnicos e `10/10` smoke.

## 6. Skills e ordem de trabalho

Para mudanças mecânicas ou visuais do instrumento:

1. aplicar `mechanical-reference-reconstruction` e ler o contrato do instrumento: `docs/MICROMETER_TWO_POINT_REFERENCE_CONTRACT.md`, `docs/MICROMETER_EXTERNAL_REFERENCE_CONTRACT.md` ou `docs/SEMICIRCULAR_PROTRACTOR_REFERENCE_CONTRACT.md`;
2. preservar modelo inteiro e projeção separada nos pares `lib/internal-micrometer*.ts`, `lib/external-micrometer*.ts` e `lib/semicircular-protractor*.ts`;
3. usar `impeccable` somente depois de confirmar topologia, datums e movimento;
4. validar a interação em navegador real com `playwright`;
5. comparar desktop, `844 × 390` e 320 px, incluindo visão geral e lupa;
6. executar `npm run test:ci` por último.

O projeto contém `.openai/hosting.json`, portanto mudanças de site devem respeitar o fluxo de Sites. Isso não concede autorização de publicação. O pedido atual é manter a versão local.

## 7. Arquivos que governam a retomada

- `AGENTS.md` — contrato de trabalho e marcos aprovados;
- `PRODUCT.md` — estratégia e limites do produto;
- `DESIGN.md` — sistema visual;
- `docs/MICROMETER_TWO_POINT_REFERENCE_CONTRACT.md` — topologia e aceite mecânico;
- `docs/MICROMETER_EXTERNAL_REFERENCE_CONTRACT.md` — topologia, leitura e aceite pendente do micrômetro externo;
- `docs/SEMICIRCULAR_PROTRACTOR_REFERENCE_CONTRACT.md` — contrato ativo do quarto instrumento, leitura direta e lupa;
- `docs/VERNIER_GONIOMETER_REFERENCE_CONTRACT.md` — contrato histórico da variante universal removida do catálogo;
- `docs/VERNIER_GONIOMETER_VISUAL_REVIEW.md` — reprovações históricas da variante universal e soluções que não devem ser reativadas;
- `docs/VERNIER_LEGIBILITY_METRICS.md` — métricas e matriz responsiva das escalas;
- `docs/ARCHITECTURE.md` — separação entre modelo, geometria e interface;
- `docs/HARNESS_PLAN.md` — gate atual e evolução de testes;
- `tests/manual/release-checklist.md` — verificações manuais antes de publicar.

## 8. Pendências reais

- validação das fixtures e da representação por especialista humano em metrologia;
- automação E2E multi-engine, axe e regressão visual no harness;
- aceite visual do micrômetro externo e validação de suas fixtures por especialista humano em metrologia;
- aceite visual do transferidor semicircular e validação de suas fixtures por especialista humano em metrologia;
- publicação definitiva, somente após nova autorização explícita.

Não estão pendentes: família do micrômetro interno, faixa `5–15 mm`, resolução `0,01 mm`, topologia das duas pontas, direção do movimento, integração da escala ao corpo ou aprovação visual do responsável do produto.

## 9. Estado do repositório esperado

A integração do micrômetro externo, do goniômetro universal histórico, do transferidor semicircular ativo, dos contratos, dos testes e da rodada de legibilidade está registrada em `745a2d6`. Consultar `git status --short --branch` para o estado corrente em vez de presumir que essas implementações ainda estejam apenas na árvore de trabalho.

`.codex-remote-attachments/` e anexos de referência do usuário permanecem fora dos commits, salvo pedido explícito. Antes de editar, conferir `git status --short` e distinguir as mudanças do produto dos anexos.
