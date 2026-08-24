# Brief de design — micrômetro interno centesimal

> Status: implementado localmente em 24/08/2026 para validação técnica, visual, didática e metrológica antes da publicação.

## 1. Resumo da funcionalidade

Adicionar ao laboratório um micrômetro interno analógico tipo paquímetro, com duas pontas finas, faixa nominal proposta de `5,00–15,00 mm` e resolução de `0,01 mm`. Professores e estudantes devem manipular o instrumento, ler bainha e tambor, ocultar/revelar a resposta e ampliar a escala usando o mesmo shell aprovado do paquímetro.

O simulador ensinará leitura e relação entre movimento e escala. Ele não certificará força de medição, alinhamento, temperatura, erro zero ou calibração real.

## 2. Ação principal

O estudante ajusta o tambor até uma medida válida e recompõe:

```text
leitura = parcela visível na bainha + divisão do tambor × 0,01 mm
```

O professor pode preparar ou sortear uma posição, ocultar a resposta e revelá-la sem mudar a geometria.

## 3. Direção de design

- Estratégia de cor: **Restrained**, preservando vinho apenas para leitura, seleção, cota e foco de ação.
- Cena: uma bancada industrial bem iluminada, usada por uma turma concentrada, em que traços, datums e números precisam sobreviver a um projetor de contraste limitado.
- Âncoras: layout atual do paquímetro no marco v2; leitura tradicional de bainha/tambor; silhueta da família analógica tipo paquímetro de duas pontas.
- Anti-referência: não reproduzir o palco branco, o texto vermelho, a dupla composição fixa ou a malha da referência Flash.
- Fidelidade: a implementação original em canvas segue este brief e o shell aprovado v2; ativos e código do Flash não foram incorporados.

Como o pedido é de esboço, e não de protótipo visual de média/alta fidelidade, não foram geradas sondas raster. O desenho final deve nascer do sistema visual existente e de geometria original em código.

## 4. Decisões de produto propostas

1. **Família:** micrômetro interno tipo paquímetro de duas pontas; para a capacidade iniciada em 5 mm, usar pontas cilíndricas finas, e não as bigornas curvas destinadas às faixas maiores.
2. **Perfil inicial:** somente milímetro, `5–15 mm`, resolução `0,01 mm`.
3. **Sem seletores falsos:** unidade e resolução únicas aparecem como especificação, não como botões desabilitados.
4. **Uma superfície, duas projeções:** a tela normal mostra o instrumento completo; a lupa usa o modo de detalhe já aprovado, sem manter duas cópias simultâneas.
5. **Faixa nominal como contrato:** `5,00–15,00 mm`; o intervalo `4,5–15,5` do Flash não será migrado.
6. **Ação de limite:** substituir o significado de “Fechar” por “Ir ao mínimo · 5,00 mm”. O micrômetro interno não fecha até zero.
7. **Gesto único:** arraste axial horizontal do conjunto de tambor/recartilha em todas as projeções. O tambor gira e se translada a partir do mesmo estado; nenhuma troca de gesto por hover.
8. **Alternativa sem arraste:** botões de decremento/incremento e teclado permanecem disponíveis.

## 5. Integração com o shell existente

### Cabeçalho

- preservar marca Cabalero, samurai local e tela cheia;
- transformar o chip atual de instrumento em seletor semântico quando houver dois instrumentos;
- opções iniciais: `Paquímetro universal` e `Micrômetro interno`;
- troca de instrumento não transporta silenciosamente uma medida incompatível: cada instrumento mantém seu estado de sessão próprio.

### Cabeçalho da bancada

- título: `Micrômetro interno centesimal`;
- instrução curta: `Arraste o tambor ou use as setas do teclado`;
- readout HTML compartilhado, com olho para ocultar/revelar;
- decomposição visível: `7,00 mm + 0,36 mm` ou `7,50 mm + 0,36 mm`.

### Palco do instrumento

- canvas de alta densidade e papel de slider;
- botão `123` para ocultar somente os números didáticos, sem apagar traços/datum;
- lupa localizada na costura bainha/tambor;
- X e `Escape` fecham a ampliação;
- leitura na linha de cota sem caixa opaca;
- controles HTML ficam fora do canvas.

### Deck inferior

- especificação: `Milímetro · 0,01 mm · faixa 5–15 mm`;
- conversão automática para polegada pode permanecer informativa, sem transformar a escala física em polegada;
- ações: `Ir ao mínimo` e `Sortear e ocultar`;
- decremento/incremento de `0,01 mm` como alternativa de toque sem arraste.

## 6. Esboços responsivos

### 6.1 Desktop — 1440 × 900

```text
┌ Cabeçalho Cabalero ───────────────── [Instrumento ▾] [Tela cheia] ┐
└───────────────────────────────────────────────────────────────────┘

┌ Bancada ──────────────────────────────────────────────────────────┐
│ Micrômetro interno centesimal      instrução   ┌ Medida atual ┐  │
│                                                │   7,36 mm  ◉ │  │
│                                                │ 7,00 + 0,36 │  │
│                                                └──────────────┘  │
├───────────────────────────────────────────────────────────────────┤
│                                      [123] [lupa]                 │
│                                                                   │
│  duas pontas ─ corpo ─ bainha 15 10 5 ─ cone/escala ─ recartilha │
│       ←──────────── cota do diâmetro interno ────────────→        │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│ mm · 0,01 · 5–15   conversão    [−] [+] [mínimo] [sortear/ocultar]│
└───────────────────────────────────────────────────────────────────┘
```

Regras:

- instrumento ocupa `80–88%` da largura útil;
- envelope contém todas as posições de `5,00` a `15,00 mm` sem recorte;
- cabeça de contato e costura bainha/tambor permanecem simultaneamente visíveis;
- readout não cobre a escala;
- cota se ancora nas faces técnicas, não nas bordas decorativas.

### 6.2 Celular horizontal — 844 × 390

```text
┌ título compacto                         [7,36 mm / olho] ┐
├──────────────────────────────────────────────────────────┤
│                                             [123] [lupa] │
│ contatos ─ bainha ─ tambor ─ recartilha                  │
│ ←────────────── cota ──────────────→                     │
├──────────────────────────────────────────────────────────┤
│ especificação   [−] [+] [mínimo] [sortear]               │
└──────────────────────────────────────────────────────────┘
```

- o cabeçalho de marca pode recolher por baixa altura, como no paquímetro;
- título e leitura usam a primeira faixa útil;
- instrumento completo permanece horizontal;
- deck pode seguir abaixo da primeira viewport por rolagem vertical natural, mas nenhuma ação fica em rolagem horizontal;
- números técnicos não podem ficar menores que aproximadamente `11 CSS px`.

### 6.3 Largura de 320 px

```text
┌ Cabalero                          [tela cheia] ┐
├────────────────────────────────────────────────┤
│ Micrômetro interno     ┌ Medida atual ───────┐│
│ centesimal             │ 7,36 mm / olho      ││
│                        └──────────────────────┘│
├────────────────────────────────────────────────┤
│                                    [123] [lupa]│
│ contatos ─ bainha ─ tambor ─ recartilha       │
│ ←────────── cota ──────────→                   │
│                                                │
├────────────────────────────────────────────────┤
│ Milímetro · 0,01 mm · 5–15 mm                 │
│ conversão automática                           │
│ [− 0,01] [+ 0,01]                              │
│ [Ir ao mínimo] [Sortear e ocultar]             │
└────────────────────────────────────────────────┘
```

- manter uma única projeção completa por padrão;
- a lupa substitui o palco por detalhe da costura quando necessário;
- o instrumento é mais curto que o paquímetro e deve permanecer legível sem rotação de layout;
- `scrollWidth === innerWidth` é requisito;
- todos os alvos têm pelo menos `44 × 44 CSS px`.

## 7. Objetos do desenho original

### Cabeçote de medição

1. duas pontas cilíndricas verticais, estreitas e paralelas;
2. uma mandíbula fixa ligada à bainha e uma mandíbula móvel ligada ao carro esquerdo;
3. ombros simétricos alargados abaixo das pontas, conforme a família para 5 mm;
4. corpo cilíndrico esquerdo, haste aparente entre as mandíbulas e parafuso de trava inferior;
5. faces externas das pontas usadas como landmarks da cota horizontal;
6. identificação Cabalero gravada no corpo e no tambor, sem sobrepor uma plaqueta à silhueta.

### Bainha

1. linha de referência central contínua;
2. marcas absolutas em passos de `0,5 mm`;
3. marcas de milímetro com hierarquia maior;
4. números `5`, `10`, `15` em leitura inversa coerente com o movimento do imicro;
5. zona neutra para marca, sem invadir a primeira divisão.

### Tambor

1. transição cônica;
2. 50 divisões procedurais;
3. rótulos a cada cinco divisões (`0`, `5`, …, `45`);
4. costura exata com a linha de referência;
5. recartilha procedural simplificada, limitada por desempenho;
6. catraca/fricção apenas como affordance visual na primeira entrega, sem simular força não validada.

### Cota e leitura

1. setas ancoradas às faces de contato;
2. linha em vinho de calibração;
3. valor visível junto à cota quando houver espaço;
4. reposicionamento externo em valores próximos ao mínimo;
5. no modo oculto, manter linha e setas, substituindo o número por `?` sem expor o valor na árvore acessível.

## 8. Modelo e geometria

Arquivos previstos, sem tocar em `lib/caliper.ts`:

```text
lib/micrometer.ts
lib/micrometer-geometry.ts
app/components/InternalMicrometerWorkbench.tsx
tests/micrometer-math.test.mjs
tests/micrometer-contract.test.mjs
tests/micrometer-geometry.test.mjs
```

Contrato de domínio:

```text
1 tick = 0,01 mm
min = 500 ticks
max = 1500 ticks
passo do fuso = 50 ticks = 0,50 mm
tambor = 50 divisões
```

Todo desenho deriva de `ticks`:

- distância entre faces técnicas;
- abertura dos contatos;
- translação do tambor;
- volta e divisão angular;
- parcelas da bainha e do tambor;
- leitura HTML, cota e `aria-valuetext`.

Geometria visual estilizada não pode redefinir o datum físico. O envelope pode usar escala responsiva, mas `scaleX` e `scaleY` devem permanecer iguais.

## 9. Interação

### Ponteiro e toque

- hit-zone: tambor, recartilha e catraca, com padding sem alterar o contorno;
- `pointerdown` captura o ponteiro;
- movimento horizontal relativo ao início do gesto, nunca acumulado evento a evento;
- esquerda aumenta; direita diminui, acompanhado por pista visual curta;
- snap em `0,01 mm` antes do desenho;
- `pointerup`, `pointercancel`, perda de foco e mudança de aba encerram o gesto;
- a página não rola horizontalmente durante a manipulação.

### Teclado

| Tecla | Resultado |
| --- | --- |
| `ArrowRight` / `ArrowUp` | `+0,01 mm` |
| `ArrowLeft` / `ArrowDown` | `−0,01 mm` |
| `Shift` + seta | `±0,10 mm` |
| `PageUp` / `PageDown` | `±0,50 mm` |
| `Home` | `5,00 mm` |
| `End` | `15,00 mm` |
| `Escape` | fecha a ampliação |

Os botões `−` e `+` oferecem a mesma unidade mínima para toque e tecnologia assistiva.

## 10. Estados obrigatórios

- padrão em `5,00 mm`;
- primeiro passo `5,01 mm`;
- transições `5,49 → 5,50` e `5,99 → 6,00`;
- leitura intermediária com e sem meia marca;
- máximo `15,00 mm`;
- arrastando;
- foco visível;
- resposta oculta;
- números da escala ocultos;
- ampliação aberta;
- fullscreen;
- API de fullscreen indisponível;
- movimento reduzido;
- forced colors/alto contraste;
- limite mínimo ou máximo alcançado.

Não há loading, erro de rede ou estado offline específico: o instrumento é local e determinístico.

## 11. Conteúdo didático

Sequência mínima:

1. identificar faixa e resolução;
2. localizar a última marca inteira ou de meio milímetro visível na bainha;
3. localizar a divisão do tambor coincidente com a linha de referência;
4. multiplicar por `0,01 mm` e somar;
5. distinguir resolução de exatidão/incerteza;
6. lembrar que o simulador não valida alinhamento, força, temperatura ou calibração.

Erros a diagnosticar:

- esquecer `0,5 mm` da bainha;
- ler a linha vizinha do tambor;
- inverter o sentido da escala interna;
- reportar um terceiro decimal inexistente;
- confundir a faixa `5–15 mm` com a resolução `0,01 mm`;
- tratar a imagem estilizada como certificado dimensional.

## 12. Harness e critérios de aceite

### Gate mínimo antes de publicar

```text
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run test:contract
npm run test:component
npm run build
npm run test:smoke
npm run test:security
npm run test:e2e
npm run test:a11y
npm run test:visual
```

`npm run test:ci` deve agregar essas camadas. `test:visual:update` continua manual.

### Matriz essencial

| Área | Evidência de aceite |
| --- | --- |
| Matemática | percorrer todos os ticks `500…1500`; snap idempotente/monotônico; decomposição recompõe exatamente |
| Cinemática | volta de `0,50 mm`; wrap `49→0`; sentidos opostos retornam sem deriva |
| Geometria | contatos, cota, bainha, costura e tambor concordam em todos os landmarks |
| Interação | mouse, toque, caneta, cancelamento, saída da área e segundo toque não deixam estado preso |
| Teclado | todas as teclas acima respeitam limites e passo |
| Resposta | ocultar nunca vaza valor na cota, readout ou nome acessível |
| SSR/smoke | título, slider, faixa e controles aparecem no HTML inicial e no worker compilado |
| Segurança | nenhum `.exe`, `.swf`, `.as`, `.jar`, `.zip`, ativo extraído, domínio externo, popup ou download em `dist/` |
| Acessibilidade | zero violações axe críticas/sérias; fluxo manual por teclado e leitor de tela |
| Visual | mínimo, wrap, intermediário, máximo, oculto, foco e lupa |
| Privacidade | aba de rede somente na origem; sem storage pessoal, cookies ou telemetria |

### Viewports

- `1440×900` e `1920×1080` desktop;
- `1024×768` projetor;
- `844×390` e `827×380` celular horizontal;
- `390×844` retrato;
- `320×568` mínimo;
- zoom/reflow `200%`;
- DPR `1`, `1,5` e `2` para equivalência de entrada.

O paquímetro deve ser comparado com `entrega-satisfatoria-layout-v2` nessas três vistas prioritárias: desktop, celular horizontal e `320 px`. A geometria existente não pode mudar como efeito colateral do seletor de instrumento.

## 13. Sequência de implementação recomendada

1. Aprovar faixa, resolução e nomenclatura com especialista.
2. Criar o modelo inteiro e fixtures independentes.
3. Criar landmarks geométricos e testes sem React/canvas.
4. Integrar o seletor de instrumento ao shell sem alterar a geometria do paquímetro.
5. Desenhar cabeçote, bainha e tambor a partir dos landmarks.
6. Integrar ponteiro, toque, teclado e botões de passo.
7. Reaproveitar readout, ocultação, lupa e fullscreen.
8. Adicionar conteúdo didático e estados de limite.
9. Executar gate completo e comparação visual v2.
10. Submeter fixtures e screenshots a aceite humano de metrologia e produto.

## 14. Decisões aplicadas e porta de publicação

O pedido de implementação confirmou para a rodada:

- micrômetro interno tipo paquímetro de duas pontas;
- faixa nominal estrita `5,00–15,00 mm`;
- resolução única `0,01 mm`;
- gesto horizontal único, com botões e teclado como alternativas;
- uma vista geral com ampliação localizada, sem duas cópias permanentes;
- ação “Ir ao mínimo” em vez de “Fechar até zero”.

O código, as fixtures independentes e a revisão responsiva estão concluídos. A publicação ainda requer aceite humano da faixa, da escala descendente, da representação das duas pontas e das fixtures por um especialista em metrologia, além do gate `npm run test:ci`.
