# Arquitetura técnica

## Visão geral

A aplicação é um frontend React/TypeScript servido por Vinext e empacotado para Cloudflare Workers/Sites. Não há banco, autenticação, API de negócio, analytics ou armazenamento local. O estado da medição vive apenas na sessão da página.

```text
interação (ponteiro / toque / teclado)
            │
            ▼
modelo exato do instrumento ─────► formatação da leitura
            │                              │
            ▼                              ▼
geometria específica no canvas       mostrador HTML acessível
            │                              │
            └──────── mesma fonte ─────────┘
```

## Módulos

### `lib/caliper.ts`

Modelo de domínio puro e sem dependência de navegador. A unidade interna é 1/80.000 mm, suficiente para representar exatamente todas as resoluções atuais. O módulo controla:

- perfis de escala;
- conversões mm/polegada;
- quantização e limites;
- formatação decimal e fracionária;
- faixa física de 0 a 150 mm.

Não usar pixels ou ponto flutuante acumulado como estado do instrumento.

### `app/components/CaliperWorkbench.tsx`

Orquestra estado, controles e desenho. O canvas é uma projeção descartável do valor em ticks. `ResizeObserver` redesenha em mudança de viewport, e o `devicePixelRatio` mantém linhas nítidas. O canvas expõe semântica de slider; controles críticos permanecem como HTML real.

### `lib/internal-micrometer.ts`

Modelo puro do micrômetro interno centesimal. Um tick equivale exatamente a `0,01 mm`; a faixa estrita é `5,00–15,00 mm`, o passo do fuso é `0,50 mm` e o tambor possui 50 divisões. O módulo controla snap, limites, decomposição bainha/tambor e formatação, sem pixels ou ângulos como estado.

### `lib/internal-micrometer-geometry.ts`

Projeta os landmarks do imicro a partir do tick inteiro: contatos, bainha, costura, tambor, catraca, área de gesto e fase angular. A representação ensina leitura e abertura nominal; não simula força, alinhamento nem a cinemática interna não validada do cone.

### `app/components/InternalMicrometerWorkbench.tsx`

Implementa o canvas, o arraste axial, toque, teclado, ajuste fino, lupa, resposta ocultável e tela cheia do micrômetro. O gesto é calculado desde a origem do ponteiro e cancelado também em perda de foco ou visibilidade.

### `lib/external-micrometer.ts`

Modelo inteiro do micrômetro externo. Um tick equivale a `0,001 mm`; os perfis quantizam esse estado em passos exatos de 10 ticks (`0,01 mm`) ou 1 tick (`0,001 mm`). A faixa é `0–25 mm`, o passo do fuso é `0,50 mm`, o tambor possui 50 divisões centesimais e o nônio resolve o resto no perfil milesimal.

### `lib/external-micrometer-geometry.ts`

Projeta arco em C, contatos coaxiais, fuso, bucha, trava, bainha, costura, tambor, recartilha e catraca. A mesma translação governa o vão, a face móvel e a costura.

### `app/components/ExternalMicrometerWorkbench.tsx`

Orquestra o terceiro instrumento, incluindo seleção centesimal/milesimal, arraste determinístico de uma resolução por pixel, teclado, ajuste fino, sorteio, ocultação da resposta e tela cheia.

### `lib/semicircular-protractor.ts`

Modelo inteiro do transferidor semicircular. O estado canônico é a leitura em minutos de arco no intervalo fechado `300–10.800`, quantizada a `5′`. A projeção física usa a própria leitura e o complementar deriva `10.800′ − leitura`, sem estados paralelos.

### `lib/semicircular-protractor-geometry.ts`

Projeta corpo semicircular, base, pivô, régua e escala. A lupa usa uma janela localizada com pelo menos `7 CSS px` por divisão de `5′` e não altera o modelo.

### `lib/semicircular-protractor-interaction.ts`

Converte a posição física do ponteiro no semicírculo para a leitura quantizada a `5′`, limitada a `300–10.800′`, e traduz o arraste horizontal da lupa para o mesmo estado.

### `app/components/SemicircularProtractorWorkbench.tsx`

Orquestra o quarto instrumento, incluindo arraste direto, ajuste fino de `5′`, teclado, leitura complementar, lupa localizada, sorteio, resposta ocultável e tela cheia.

### `app/components/MetrologyLab.tsx`

Seleciona o instrumento ativo e preserva, separadamente durante a sessão, a medida e os estados pedagógicos das quatro ferramentas. Apenas a ferramenta ativa é renderizada, mantendo um único `h1` e um único landmark principal no HTML.

### `worker/index.ts`

Entrada de execução. Além de servir a aplicação, acrescenta CSP e cabeçalhos defensivos. O produto não aceita uploads nem fontes de imagem remotas; isso reduz a exposição do parser de imagens transitivo registrado no relatório de segurança.

### `tests/`

O harness separa matemática, contratos, SSR, headers e artefatos. Fixtures de leitura não dependem do desenho para que uma imagem convincente não possa mascarar um erro metrológico.

## Estado e eventos

O estado mínimo contém:

- `ticks`: abertura física canônica;
- `scaleId`: unidade, resolução e construção do nônio;
- `answerVisible`: resposta pedagógica visível/oculta;
- `detailMode`: visão geral/ampliação;
- `isFullscreen` e `dragging`: estados transitórios de interface.

Trocar perfil preserva a abertura física e faz snap para a leitura representável mais próxima. Arrastar converte deslocamento horizontal em milímetros; a quantização acontece no modelo antes de renderizar.

## Segurança e privacidade

- sem HTML arbitrário, `eval`, scripts remotos ou links de download;
- sem cookies, dados pessoais, local storage ou telemetria;
- CSP restrita à própria origem, com `unsafe-inline` temporário documentado para compatibilidade RSC;
- dependências e risco residual documentados em `security_best_practices_report.md`;
- artefatos rejeitam executáveis legados e referências ao domínio pesquisado.

## Evolução para micrômetros

O micrômetro interno compartilha a linguagem visual, a leitura ocultável, a tela cheia, a acessibilidade e a estratégia de testes, mas mantém modelo, geometria e gesto próprios. Antes de adicionar perfis em polegadas ou o micrômetro externo, a unidade canônica deve ser escolhida por perfil; os `100 ticks/mm` desta primeira entrega não representam `0,001″` exatamente.
