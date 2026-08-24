# Handoff do Codex — estado atual do laboratório

> Atualizado em 24/08/2026. Este documento é o resumo operacional para novas sessões do Codex no VS Code. Em caso de divergência com documentos históricos, `PRODUCT.md`, `DESIGN.md`, `AGENTS.md` e este handoff governam o trabalho atual.

## 1. Situação do produto

O laboratório contém dois instrumentos funcionais e independentes:

- paquímetro universal, preservado pelos marcos `entrega-satisfatoria-layout-v1` e `entrega-satisfatoria-layout-v2`;
- micrômetro interno analógico tipo paquímetro, Série 145, de duas pontas, aprovado visualmente pelo responsável do produto em 24/08/2026.

A versão atual com micrômetro permanece local. Não há autorização para publicação definitiva. Um túnel temporário pode ser recriado quando solicitado, mas nunca deve ser tratado como implantação permanente.

## 2. Estado aprovado do micrômetro interno

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

## 3. Linha de implementação relevante

- `9c01484` — reconstrução do micrômetro a partir da referência `145-185`;
- `2eb325e` a `397d4f2` — refinamentos das pontas, visibilidade e integração da escala ao corpo;
- `fea6c7b` — correção da propriedade cinemática da escala e do conjunto móvel;
- `10c63e5` — recorte da graduação do tambor pelo envelope físico e ajuste vertical dos números da bainha;
- `a28c547` — revisão de código, limpeza de resíduos e fortalecimento do harness.

O commit que adiciona este handoff contém somente sincronização de contexto e documentação. Não cria um novo marco geométrico.

## 4. Harness vigente

O único gate obrigatório antes de concluir alterações é:

```text
npm run test:ci
```

Ele executa:

1. ESLint com regras React e jsx-a11y;
2. `tsc --noEmit` em modo estrito;
3. build Vinext/Cloudflare;
4. 38 testes unitários e geométricos;
5. 10 testes de smoke, SSR, artefatos e cabeçalhos do Worker.

Na revisão `a28c547`, o detector do Impeccable retornou zero achados. Playwright validou 320 px, ampliação, console sem erros e limites de teclado. Playwright multi-engine versionado, axe automatizado e baselines visuais continuam pendentes no roadmap do harness; não alegar que já existem.

## 5. Skills e ordem de trabalho

Para mudanças mecânicas ou visuais do instrumento:

1. aplicar `mechanical-reference-reconstruction` e ler `docs/MICROMETER_TWO_POINT_REFERENCE_CONTRACT.md` antes de alterar a geometria;
2. preservar modelo inteiro e projeção separada em `lib/internal-micrometer.ts` e `lib/internal-micrometer-geometry.ts`;
3. usar `impeccable` somente depois de confirmar topologia, datums e movimento;
4. validar a interação em navegador real com `playwright`;
5. comparar desktop, celular horizontal e 320 px;
6. executar `npm run test:ci` por último.

O projeto contém `.openai/hosting.json`, portanto mudanças de site devem respeitar o fluxo de Sites. Isso não concede autorização de publicação. O pedido atual é manter a versão local.

## 6. Arquivos que governam a retomada

- `AGENTS.md` — contrato de trabalho e marcos aprovados;
- `PRODUCT.md` — estratégia e limites do produto;
- `DESIGN.md` — sistema visual;
- `docs/MICROMETER_TWO_POINT_REFERENCE_CONTRACT.md` — topologia e aceite mecânico;
- `docs/ARCHITECTURE.md` — separação entre modelo, geometria e interface;
- `docs/HARNESS_PLAN.md` — gate atual e evolução de testes;
- `tests/manual/release-checklist.md` — verificações manuais antes de publicar.

## 7. Pendências reais

- validação das fixtures e da representação por especialista humano em metrologia;
- automação E2E multi-engine, axe e regressão visual no harness;
- decisão e implementação futura do micrômetro externo;
- publicação definitiva, somente após nova autorização explícita.

Não estão pendentes: família do micrômetro interno, faixa `5–15 mm`, resolução `0,01 mm`, topologia das duas pontas, direção do movimento, integração da escala ao corpo ou aprovação visual do responsável do produto.

## 8. Estado do repositório esperado

Antes de uma nova tarefa, `git status --short` pode listar `.codex-remote-attachments/` como não rastreada. Esses arquivos pertencem ao usuário e devem permanecer fora dos commits. Qualquer outra alteração deve ser investigada e preservada antes de editar.
