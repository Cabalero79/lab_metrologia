# Contrato de reconstrução — goniômetro universal com nônio

Este documento governa o quarto instrumento do laboratório. Ele registra a
reconstrução mecânica da família INSIZE `2372-360` e separa a evidência física
da explicação didática de Eduardo Stefanelli. `PRODUCT.md` continua governando
o produto e `lib/vernier-goniometer.ts` governa a leitura inteira.

## 1. Identidade e especificação

| Campo | Contrato |
| --- | --- |
| Família | Goniômetro/transferidor universal analógico com nônio |
| Referência mecânica | INSIZE `2372-360` |
| Classificação interna | Type A; a expressão não é inscrição do fabricante |
| Faixa nominal | `0–360°` |
| Resolução | `5′` |
| Exatidão declarada | `±5′`, distinta da resolução |
| Material declarado | Aço inoxidável |
| Lâmina canônica | `300 × 16 mm`, com lâmina alternativa de `150 × 16 mm` |
| Diâmetro do cabeçote | `70 mm` |

Fontes primárias: [página oficial do INSIZE 2372-360](https://insize.com/protractors/2372.html),
[manual oficial MN-2372-ES V1](https://m.insize.com/upfiles/sms/MN-2372-ES%20V1.pdf)
e [ficha dimensional INSIZE](https://www.insize-eu.com/other%20products/2372.pdf).
O [simulador de 5′ de Stefanelli](https://www.stefanelli.eng.br/goniometro-virtual-grau-cinco-minutos-simulador/)
é referência apenas para ensino de graus, minutos e sentido de leitura.

## 2. Inventário e topologia

Ordem visual e propriedade mecânica:

1. base/estoque e faces de medição, fixos;
2. corpo circular e escala principal de graus, fixos à base;
3. placa do mostrador, giratória em torno do pivô;
4. lâmina de 300 mm, giratória e tangencialmente deslocada do pivô;
5. bloco de fixação da lâmina e freio, peças distintas;
6. nônio bilateral, solidário à placa giratória;
7. lupa, solidária ao nônio;
8. ajuste fino, ponte entre corpo e placa;
9. acessório vertical para ângulos pequenos, fixo no extremo da base.

A lâmina de 150 mm é alternativa e não aparece montada ao mesmo tempo. O clamp
opcional para traçador de altura também fica fora da montagem padrão. Espaços
negativos obrigatórios incluem a abertura triangular entre lâmina e base, o
anel da escala principal ao redor da placa e as separações entre lupa, freio e
ajuste fino.

## 3. Razões dimensionais

Usando o diâmetro oficial `D = 70 mm` como unidade:

| Elemento | Dimensão | Razão por `D` |
| --- | ---: | ---: |
| Cabeçote | `Ø70 mm` | `1,0000` |
| Lâmina longa | `300 × 16 mm` | `4,2857 × 0,2286` |
| Lâmina curta | `150 × 16 mm` | `2,1429 × 0,2286` |
| Base indicada | `85 × 16 mm` | `1,2143 × 0,2286` |
| Acessório angular | `18 mm` | `0,2571` |

As extremidades das lâminas usam chanfros de `45°` e `60°`. A fotografia tem
perspectiva e reflexos; as cotas impressas prevalecem sobre pixels.

## 4. Anchor map da pose canônica

A imagem de catálogo `800 × 800 px` usa fundo branco. Crop mecânico aproximado:
`x=129..670`, `y=89..710`. Coordenadas normalizadas no crop, com tolerância
visual `±0,03`:

| Parte | Caixa/âncora normalizada |
| --- | --- |
| Lâmina longa | `(0,00; 0,00; 0,85; 1,00)` |
| Cabeçote | `(0,36; 0,39; 0,30; 0,34)` |
| Placa giratória | `(0,39; 0,43; 0,25; 0,28)` |
| Lupa | `(0,54; 0,49; 0,13; 0,20)` |
| Base horizontal | `(0,54; 0,61; 0,46; 0,12)` |
| Acessório angular | `(0,87; 0,34; 0,08; 0,29)` |
| Pivô | `(0,49; 0,50)` |
| Eixo da lâmina | aproximadamente `(0,02; 0,98) → (0,85; 0,01)` |

A pose fotográfica é estimada em `52°30′` somente para comparação visual; a
imagem não fornece leitura certificável.

## 5. Modelo e nônio físico

O estado canônico usa um minuto de arco por tick e resolução de cinco ticks:

```text
ticks ∈ {0, 5, 10, …, 21.595}
volta = 21.600 ticks
posições distintas = 4.320
360°00′ é alias físico de 0°00′
```

O nônio universal físico possui 12 divisões por lado e 12 divisões ocupam
`23°`: cada passo vale `115′`, comparado a duas divisões principais (`120′`),
resultando em `5′`. O nônio compacto do Stefanelli ocupa `13°` e não deve ser
usado na geometria física, embora produza a mesma resolução numérica.

O manual INSIZE governa os lados: quando a escala cresce no sentido horário,
ler o lado direito; no sentido anti-horário, o esquerdo. As fixtures oficiais
incluem `15°25′` e `71°45′`.

### Contrato de projeção visual

A revisão de 27/08/2026 está registrada em
`docs/VERNIER_GONIOMETER_VISUAL_REVIEW.md`. Ela governa densidade, pistas
radiais, ampliação e ancoragem das peças auxiliares. Não reintroduzir linhas-guia
entre traços e números, zoom do instrumento inteiro nem um arco externo do
nônio sobre os números da escala principal.

## 6. Ownership cinemático

| Parte | Alteração da leitura | Datum preservado |
| --- | --- | --- |
| Base, acessório e escala principal | imóveis | eixo horizontal e pivô |
| Placa, lâmina, nônio e lupa | giram juntos | centro do cabeçote |
| Ajuste fino | incrementa/decrementa o mesmo inteiro | não cria estado paralelo |
| Lâmina deslizante | posição axial fixa na primeira entrega | não altera o ângulo |
| Lupa e tela cheia | mudam somente a projeção | nunca mudam ticks |

## 7. Matriz de aceite

- [x] Variante `2372-360`, sem híbrido com goniômetro de mostrador.
- [x] Faixa, resolução e exatidão são apresentadas separadamente.
- [x] Modelo inteiro representa exatamente 4.320 posições.
- [x] Nônio físico usa a razão `23°/12`, não `13°/12`.
- [x] Base e escala principal ficam fixas; placa, lâmina, nônio e lupa giram.
- [x] Passagem `359°55′ ↔ 0°00′` é cíclica e sem deriva.
- [x] Mouse, toque, teclado, sorteio e botões dirigem o mesmo inteiro.
- [x] Resposta, cota, escala e texto acessível derivam do mesmo estado.
- [x] Números da escala principal e borda do nônio ocupam pistas separadas.
- [x] Ampliação isola as escalas sem alterar o estado metrológico.
- [x] Bloco, ajuste fino, lupa e parafuso inferior possuem âncoras mecânicas.
- [ ] Comparação final da pose canônica revisada pelo responsável do produto.
- [ ] Fixtures validadas por especialista humano em metrologia.

Esta simulação é didática. Não afirma calibração, força de contato, folga,
exatidão certificada nem mecanismo interno invisível.
