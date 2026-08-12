---
name: Cabalero_Automações — Laboratório de Metrologia
description: Uma bancada de precisão digital para aprender instrumentos analógicos.
colors:
  brand-wine: "oklch(0.36 0.147 340)"
  brand-wine-deep: "oklch(0.29 0.125 340)"
  brand-blush: "oklch(0.92 0.042 340)"
  drafting-paper: "oklch(0.975 0.006 340)"
  panel-white: "oklch(1 0 0)"
  bench-soft: "oklch(0.945 0.011 340)"
  graphite: "oklch(0.205 0.018 340)"
  graphite-muted: "oklch(0.47 0.025 340)"
  precision-line: "oklch(0.84 0.02 340)"
  focus-amber: "oklch(0.67 0.17 70)"
typography:
  display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(1.32rem, 2.35vw, 2.15rem)"
    fontWeight: 690
    lineHeight: 1.1
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.66rem"
    fontWeight: 760
    lineHeight: 1.2
    letterSpacing: "0.09em"
rounded:
  sm: "0.6rem"
  md: "0.9rem"
  lg: "1.35rem"
spacing:
  compact: "0.45rem"
  control: "0.75rem"
  panel: "1rem"
  section: "2.1rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-wine}"
    textColor: "{colors.panel-white}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 0.9rem"
    height: "52px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.brand-wine-deep}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 0.9rem"
    height: "52px"
  readout:
    backgroundColor: "{colors.brand-wine-deep}"
    textColor: "{colors.panel-white}"
    rounded: "{rounded.md}"
    padding: "0.88rem 1rem 0.82rem"
  workbench:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.lg}"
---

# Design System: Cabalero_Automações — Laboratório de Metrologia

## Overview

**Creative North Star: "A Bancada de Precisão"**

A interface traduz uma bancada industrial bem iluminada para o navegador: papel de desenho ao fundo, metal técnico no instrumento e vinho profundo apenas onde uma decisão ou leitura exige atenção. A composição é densa o suficiente para ensinar, mas não se comporta como dashboard; o paquímetro é sempre o maior elemento.

A voz é precisa, industrial e didática. O sistema rejeita a aparência de Flash, anúncios, pop-ups, cartões genéricos, marketing de ferramenta de IA e ornamentação que prejudique a fidelidade da escala. Em sala ou no telefone, o mesmo estado físico deve parecer inequívoco.

**Key Characteristics:**

- instrumento analógico dominante sobre bancada clara;
- contraste estrutural de grafite, aço e vinho;
- controles compactos, táteis e semanticamente explícitos;
- números tabulares e rótulos técnicos em mono;
- resposta e escala derivadas da mesma medida exata;
- responsividade sem miniaturizar alvos essenciais.

## Colors

A paleta usa vinho industrial como uma única voz de ação sobre neutros de desenho técnico.

### Primary

- **Vinho de Calibração:** usado em ações primárias, seleção e medida atual.
- **Vinho de Oficina:** usado no painel de leitura e nos estados de maior contraste.
- **Papel Rosado:** indica seleção sem transformar toda a interface em superfície saturada.

### Neutral

- **Papel de Projeto:** fundo geral, com grade quase imperceptível.
- **Branco de Bancada:** superfícies onde a escala precisa de máxima legibilidade.
- **Bancada Suave:** faixa dos controles e separação tonal.
- **Grafite de Traçado:** texto principal e contornos mecânicos.
- **Grafite de Nota:** instruções e metadados.
- **Linha de Precisão:** bordas e divisores de um pixel.
- **Âmbar de Segurança:** foco visível; nunca comunica apenas por cor.

**The One Gauge Rule.** O vinho é reservado a leitura, seleção e ação. Se mais de cerca de um décimo da tela competir em vinho, a hierarquia foi perdida.

## Typography

**Display Font:** Geist (com Arial)
**Body Font:** Geist (com Arial)
**Label/Mono Font:** Geist Mono (com monospace)

**Character:** A família sans mantém linguagem contemporânea e técnica; o mono marca resolução, leitura e rótulos de bancada sem transformar todo o produto em terminal.

### Hierarchy

- **Display** (690, fluido, compacto): título do instrumento, uma vez por tela.
- **Headline** (680, 1rem–1.3rem): títulos de grupos e futuros diálogos didáticos.
- **Title** (700, 0.88rem–1rem): marca e valores de opção.
- **Body** (400, 1rem, 1.5): explicações, com linhas curtas quando houver conteúdo pedagógico.
- **Label** (760, mono, caixa alta espaçada): contexto de laboratório, campos e resolução.

**The Numeric Truth Rule.** Medidas usam Geist Mono com numerais tabulares; nunca use fonte decorativa ou largura variável para a leitura.

## Elevation

O sistema é plano por padrão. Bordas e mudanças tonais separam áreas; sombra ampla aparece somente no invólucro da bancada e no mostrador elevado, como luz ambiente, nunca como pilha de cartões.

### Shadow Vocabulary

- **Bancada ambiente** (`0 24px 64px oklch(0.24 0.04 340 / 0.12)`): apenas no contêiner principal em desktop.
- **Leitura elevada** (`0 15px 34px oklch(0.25 0.11 340 / 0.23)`): fixa a resposta acima do instrumento.
- **Ação curta** (`0 9px 20px oklch(0.36 0.147 340 / 0.2)`): somente no botão primário.

**The Structural Depth Rule.** Se a sombra for necessária para entender a borda, falta contraste tonal. Corrija a superfície antes de aumentar o blur.

## Components

### Buttons

- **Shape:** cantos técnicos suavemente curvos, nunca pílulas para ações comuns.
- **Primary:** vinho de calibração, texto branco, altura mínima de 52 px.
- **Hover / Focus:** vinho de oficina no hover; anel âmbar de 3 px no foco visível.
- **Secondary / Ghost:** fundo transparente e borda de linha de precisão; ganha branco de bancada no hover.

### Chips

- **Style:** somente o status do instrumento usa cápsula, com ponto verde, borda fina e fundo translúcido.
- **State:** chips não substituem botões de unidade ou resolução.

### Cards / Containers

- **Corner Style:** bancada ampla usa raio grande; leitura usa raio médio; opções usam raio pequeno.
- **Background:** branco de bancada para conteúdo e bancada suave para controles.
- **Shadow Strategy:** segue a elevação estrutural, sem cartões flutuando em grade.
- **Border:** linha de precisão de 1 px.
- **Internal Padding:** 1rem em controles, até 2.1rem em faixas desktop.

### Inputs / Fields

- **Style:** os seletores são botões reais agrupados, com borda, texto e estado pressionado.
- **Focus:** anel âmbar externo que não desloca o layout.
- **Error / Disabled:** não ocultar a razão; combinar texto e estado nativo.

### Navigation

Uma faixa única contém marca, estado, detalhe e tela cheia. No telefone, o texto secundário e o chip cedem espaço, mas os dois comandos continuam como alvos reais de 42 px.

### Paquímetro e mostrador

O instrumento é desenhado em canvas de alta densidade com três tons de metal e contornos de grafite. O mostrador é HTML, permanece legível em projeção, inclui decomposição e usa um botão de olho nativo. A ampliação transforma apenas a projeção visual; a medida interna não muda.

A construção mecânica separa as faces de contato dos zeros das escalas por um deslocamento constante: a face externa fixa antecede o zero da escala principal, e a face externa móvel antecede o zero do nônio pela mesma distância. Garras inferiores estreitas e afuniladas, garras internas altas e uma ponte do cursor mais longa mantêm a silhueta de um paquímetro universal real sem reproduzir ativos da referência.

### Estado visual aprovado

O marco `entrega-satisfatoria-layout-v1` registra a primeira saída considerada satisfatória pelo responsável do produto. A composição, a estrutura do desenho, a simetria espelhada das mandíbulas inferiores, a leitura integrada à linha de cota e o funcionamento dos comandos formam a base visual que deve permanecer estável. Ajustes posteriores devem ser localizados e comparados em navegador real com esse marco antes de substituir a versão publicada.

## Do's and Don'ts

### Do:

- **Do** manter o instrumento como maior elemento da tela e reservar a maior área útil para a escala.
- **Do** usar o vinho apenas em leitura, seleção, cotas e ação primária.
- **Do** usar bordas de 1 px, numerais tabulares e alvos de pelo menos 42–44 px.
- **Do** manter mouse, toque, teclado, foco visível, daltonismo e movimento reduzido como o mesmo produto WCAG 2.2 AA.
- **Do** derivar desenho, texto e cota da mesma medida inteira e determinística.

### Don't:

- **Don't** recriar o estilo de Flash, texturas antigas, bitmaps, controles embutidos sem semântica ou canvas inacessível.
- **Don't** introduzir anúncios, pop-ups, downloads, redirecionamentos ou telemetria no fluxo de estudo.
- **Don't** organizar a experiência como dashboard de cartões genéricos ou landing page de ferramenta de IA.
- **Don't** sacrificar fidelidade da escala por decoração, gradientes chamativos, glassmorphism ou sombras em toda superfície.
- **Don't** copiar ativos, código, textos extensos ou geometria proprietária da referência.
