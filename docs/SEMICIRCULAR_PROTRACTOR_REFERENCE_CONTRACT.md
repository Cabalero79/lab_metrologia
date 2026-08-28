# Contrato de reconstrução — transferidor semicircular de leitura direta

Este documento substitui, para o quarto instrumento visível do laboratório, o
contrato do goniômetro universal com nônio. A implementação anterior permanece
como histórico local, mas não integra mais o catálogo ativo. `PRODUCT.md`
continua governando o produto e `lib/semicircular-protractor.ts` governa a
leitura inteira em minutos de arco.

## 1. Identidade da referência

| Campo | Contrato/evidência |
| --- | --- |
| Família | Transferidor/goniômetro semicircular simples |
| Escala indicada | Arco fixo de `5–180°`, uma divisão por grau |
| Curso interativo | `5–180°`; `90°` permanece no topo |
| Resolução da lupa/estado | `5′` (`12` subdivisões por grau) |
| Princípio | Ângulo entre a semirreta esquerda da base e a lateral indicadora da régua móvel |
| Leitura secundária | Ângulo complementar: `180° − leitura` |
| Pose canônica | `30°25′`; a captura não fornece leitura certificável |
| Nônio | Ausente por decisão explícita do responsável do produto |

Fonte visual primária: `Photo 1.jpg`, captura fornecida pelo usuário em
27/08/2026. O instrumento ocupa aproximadamente `x=4..571`, `y=108..451` na
imagem de `576 × 1280 px`. A captura é quase ortográfica, mas contém interface
do telefone, recorte inferior e um ícone de busca sobre o canto esquerdo.

Fonte didática: a página [Goniômetro virtual – simulador de transferidor de
ângulo ou grau](https://www.stefanelli.eng.br/goniometro-transferidor-angulo-grau/)
de Eduardo J. Stefanelli. Ela confirma que o modelo simples possui 180 divisões
de `1°`, não tem nônio, lê o valor apontado pela lâmina e obtém o complementar
por `180° − leitura`. O simulador histórico não está mais disponível em HTML5;
a implementação não copia código, ativo, marca ou artefato executável.

A subdivisão de `5′` na lupa é uma projeção didática solicitada pelo responsável
do produto em 27/08/2026. Ela interpola cada intervalo físico de `1°` em 12
partes iguais e não representa um nônio físico nem uma alegação de exatidão do
instrumento fotografado.

Em 27/08/2026, o responsável do produto corrigiu a origem da escala usando uma
captura da própria versão em túnel: o rótulo `0` do extremo esquerdo deve ser
substituído por `5`. A correção final explicitou que isso não desloca a escala
inteira: `90°` permanece no topo e `180°` no extremo direito. A sequência de
rótulos principais é, portanto, `5, 10, 20, …, 90, …, 180`, e o curso abaixo de
`5°` não é oferecido pela interação.

## 2. Inventário e topologia observável

Coordenadas normalizadas pelo crop mecânico `568 × 343 px`:

| Ordem | Parte | Caixa/âncora normalizada aproximada | Propriedade |
| ---: | --- | --- | --- |
| 1 | Corpo semicircular | `(0,00; 0,00; 1,00; 0,87)` | fixo; sustenta a escala |
| 2 | Arco graduado | raio externo `0,50 × largura` | fixo; `5` à esquerda, `90` no topo e `180` à direita |
| 3 | Base diametral | `(0,00; 0,86) → (1,00; 0,86)` | datum angular fixo |
| 4 | Régua/ponteiro | ponta `(0,11; 0,46)`, pivô `(0,50; 0,86)`, cauda `(0,70; 1,00)` | gira rigidamente |
| 5 | Articulação central | centro `(0,50; 0,86)` | pivô comum |

O espaço exterior acima do arco e abaixo da base não pertence ao corpo. A
régua cruza o pivô e continua abaixo da base; não deve terminar no centro. O
corpo não recebe placa móvel, nônio, lupa física, ajuste fino, trava ou
acessório lateral.

## 3. Anchor map e escala

- eixo primário: base horizontal;
- referências indicadas: `5°` no extremo esquerdo, `90°` no topo e `180°` no
  extremo direito;
- pivô: centro do diâmetro;
- ponteiro: lateral/linha da régua que encontra diretamente um traço do arco;
- passo: 180 intervalos iguais no semicírculo;
- rótulos: a cada `10°` em telas amplas e a cada `20°` em 320 px, sem remover
  as divisões físicas;
- rótulos terminais: `5°` e `180°` ficam ancorados junto às bordas e à base,
  separados dos rótulos interiores;
- articulação: pino visual de raio máximo `5,5 CSS px`; a área de toque pode ser
  maior e invisível para preservar acessibilidade;
- marca selecionada: deriva do mesmo inteiro de minutos usado pela régua e pela
  resposta.

## 4. Ownership cinemático

| Parte | Ao aumentar a leitura | Datum preservado |
| --- | --- | --- |
| Corpo, arco, números e base | imóveis | diâmetro horizontal e pivô |
| Régua, linha indicadora e cauda | giram do lado esquerdo em direção ao direito | centro da articulação |
| Leitura | cresce de `5°00′` a `180°00′` | inteiro em minutos de arco |
| Ângulo físico projetado | acompanha a leitura | mesma leitura, sem offset global |
| Leitura complementar | diminui de `175°00′` a `0°00′` | `10.800′ − leitura` |
| Lupa | altera somente a projeção | mesmo inteiro, quantizado a `5′` |

Mouse, toque, teclado, botões e sorteio escrevem o mesmo estado inteiro em
múltiplos de `5′`. Não há
volta cíclica nem sentido bilateral de nônio.

## 5. Contrato da lupa

A lupa não amplia o instrumento inteiro. Ela abre uma janela limpa da escala:

1. ponteiro vinho fixo no centro;
2. traços vizinhos de `5′` espaçados por pelo menos `7 CSS px`;
3. 12 traços por grau, com `15′`, `30′` e `45′` enfatizados e graus rotulados;
4. leitura correspondente e complementar derivadas do mesmo estado;
5. arraste horizontal da escala, setas e `Escape` continuam ativos;
6. nos limites, nenhuma marca indicada fora de `5–180°` é inventada.

Essa projeção torna explícito o método publicado por Stefanelli — ler o valor
sob o ponteiro e calcular o complementar — sem reproduzir a antiga interface
Flash.

## 6. Comparação e aceite técnico

O quadro de mesma pose foi gerado em
`output/playwright/protractor-reference-comparison.png`. A comparação é
diagnóstica: identidade, espessura da lâmina, acabamento e interface do telefone
são diferenças intencionais. A topologia, o sentido da escala e os datums são o
critério de aceite.

- [x] Corpo semicircular, base, pivô e régua correspondem à família escolhida.
- [x] Escala fixa começa em `5`, preserva `90°` no topo e termina em `180°`.
- [x] Não existe nônio nem peça auxiliar do goniômetro universal anterior.
- [x] Estado inteiro dirige ponteiro, escala, resposta e complementar.
- [x] Lupa subdivide cada grau em 12 passos exatos de `5′`, sem introduzir nônio.
- [x] Rótulo terminal `180` permanece separado do `170` em todas as projeções.
- [x] Pino central mínimo preserva o pivô sem encobrir a formação do ângulo.
- [x] Limites indicados e projetados são `5°` e `180°`.
- [x] Desktop, `844 × 390` e `320 px` foram inspecionados.
- [x] Lupa localizada, teclado e `Escape` foram verificados em navegador real.
- [ ] Responsável do produto aprova visualmente a nova solução.
- [ ] Especialista humano valida o uso didático e metrológico.

O simulador é didático e não afirma calibração, exatidão certificada ou
equivalência dimensional com um instrumento comercial.
