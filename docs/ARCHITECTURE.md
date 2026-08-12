# Arquitetura técnica

## Visão geral

A aplicação é um frontend React/TypeScript servido por Vinext e empacotado para Cloudflare Workers/Sites. Não há banco, autenticação, API de negócio, analytics ou armazenamento local. O estado da medição vive apenas na sessão da página.

```text
interação (ponteiro / toque / teclado)
            │
            ▼
estado exato em ticks inteiros ──► formatação da leitura
            │                              │
            ▼                              ▼
geometria do paquímetro no canvas    mostrador HTML acessível
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

Compartilhar shell, leitura ocultável, tela cheia, acessibilidade e estratégia de testes. Não compartilhar à força a geometria ou o gesto: o micrômetro requer modelo de bainha/tambor, rotação e contato. Antes do perfil de 0,0001″, a unidade canônica deve ser revista, pois 80.000 ticks/mm não o representa exatamente.
