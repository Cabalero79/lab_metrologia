# Laboratório de Metrologia para Estudos

Laboratório web de metrologia da **Cabalero_Automações**, com a direção de marca **Engenharia de Software aplicada à Indústria**.

Publicação privada histórica do paquímetro: <https://cabalero-paquimetro.cabalero.chatgpt.site>. A versão atual com o micrômetro permanece local e não deve ser publicada sem nova autorização explícita.

A plataforma reúne um paquímetro universal, um micrômetro interno analógico de duas pontas e um micrômetro externo centesimal/milesimal, todos manipuláveis por mouse, toque e teclado. A mesma tela serve para projeção em sala e estudo individual, sem anúncios, rastreadores, pop-ups ou downloads automáticos.

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
- seletor de instrumento com estado de sessão independente;
- micrômetro interno tipo paquímetro, com duas pontas finas, faixa de 5,00 a 15,00 mm, resolução de 0,01 mm e passo de fuso de 0,50 mm;
- leitura de bainha e tambor, ajuste fino, limites, lupa e prática com resposta oculta.
- micrômetro externo de arco em C, faixa de 0 a 25 mm, com perfis de 0,01 mm e 0,001 mm, tambor centesimal e nônio no perfil milesimal;
- arraste direto de um passo selecionado por pixel, preservando bigorna, fuso, costura e leitura no mesmo estado inteiro.
- transferidor semicircular de leitura direta, faixa de 5 a 180°, divisão física de 1°, lupa didática com resolução de 5′ e ângulo complementar;
- lupa localizada com ponteiro central e escala ampliada, sem nônio ou peças auxiliares.

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

O harness executa lint, TypeScript estrito, build, 54 testes unitários/geométricos e 10 testes de smoke, incluindo SSR, cabeçalhos de segurança, resposta 404 e inspeção dos artefatos publicados.

## Documentação

- [Visão e escopo](docs/PROJECT_VISION.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Análise segura da referência](docs/REFERENCE_ANALYSIS.md)
- [Especificação de interface](docs/UI_SPEC.md)
- [Guia de aprendizagem](docs/LEARNING_GUIDE.md)
- [Plano e harness de testes](docs/TEST_PLAN.md)
- [Roadmap dos micrômetros](docs/ROADMAP_INSTRUMENTS.md)
- [Análise clean-room do micrômetro interno](docs/MICROMETER_INTERNAL_REFERENCE_ANALYSIS.md)
- [Brief e estado da implementação do micrômetro interno](docs/MICROMETER_INTERNAL_DESIGN_BRIEF.md)
- [Contrato mecânico do micrômetro externo](docs/MICROMETER_EXTERNAL_REFERENCE_CONTRACT.md)
- [Handoff para novas sessões do Codex](docs/CODEX_HANDOFF.md)
- [Revisão de segurança](security_best_practices_report.md)

Os dois micrômetros fazem parte da interface local. A publicação definitiva continua condicionada ao aceite humano das fixtures e da representação por um especialista em metrologia; o micrômetro externo também aguarda aceite visual do responsável do produto.
