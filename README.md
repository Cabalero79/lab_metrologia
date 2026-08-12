# Paquímetro para Estudos

Laboratório web de metrologia da **Cabalero_Automações**, com a direção de marca **Engenharia de Software aplicada à Indústria**.

A primeira entrega é um paquímetro universal analógico, manipulável por mouse, toque e teclado. A mesma tela serve para projeção em sala e estudo individual, sem anúncios, rastreadores, pop-ups ou downloads automáticos.

## Funcionalidades

- abertura de 0 a 150 mm com arraste horizontal e quantização exata;
- milímetros em 0,1 mm, 0,05 mm e 0,02 mm;
- polegada fracionária em 1/128″ e milesimal em 0,001″;
- nônio e escala principal desenhados em canvas nítido;
- leitura decomposta, botão de olho para ocultar/revelar e sorteio de desafios;
- ampliação da escala e tela cheia;
- teclado: setas, `Shift` + setas, `Page Up/Down`, `Home` e `End`;
- layout responsivo e requisitos WCAG 2.2 AA considerados desde o início;
- cabeçalhos defensivos e política de conteúdo aplicados pelo Worker.

## Executar

Requer Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Verificação

```bash
npm run test:ci
npm audit --omit=dev
```

O harness executa lint, build, contratos matemáticos, renderização SSR, cabeçalhos de segurança, resposta 404 e inspeção dos artefatos publicados.

## Documentação

- [Visão e escopo](docs/PROJECT_VISION.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Análise segura da referência](docs/REFERENCE_ANALYSIS.md)
- [Especificação de interface](docs/UI_SPEC.md)
- [Guia de aprendizagem](docs/LEARNING_GUIDE.md)
- [Plano e harness de testes](docs/TEST_PLAN.md)
- [Roadmap dos micrômetros](docs/ROADMAP_INSTRUMENTS.md)
- [Revisão de segurança](security_best_practices_report.md)

O micrômetro externo e o interno estão estudados e planejados, mas ainda não fazem parte da interface publicada.
