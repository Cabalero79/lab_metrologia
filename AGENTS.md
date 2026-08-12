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
