# Contrato de reconstrução — micrômetro externo milesimal

Este documento registra a aplicação da skill `mechanical-reference-reconstruction`
às imagens locais fornecidas pelo responsável do produto. As imagens permanecem
como evidência da montagem funcional e como histórico visual. Em 25/08/2026, o
responsável do produto substituiu explicitamente a ferradura circular por um U
quadrado com cantos arredondados; essa instrução mais recente governa a silhueta.
Ele governa a estrutura mecânica visível do terceiro instrumento. `PRODUCT.md`
continua governando o produto, e o modelo inteiro em
`lib/external-micrometer.ts` governará a leitura.

## 1. Identidade da referência

| Campo | Evidência |
| --- | --- |
| Família | Micrômetro externo analógico com arco em C |
| Variante observável | Faixa `0–25 mm`, resolução `0,001 mm`, bainha com nônio milesimal |
| Tipo de contato | Bigorna fixa plana e fuso móvel plano, coaxiais |
| Princípio representado | Distância horizontal entre a face direita da bigorna e a face esquerda do fuso |
| Passo adotado | `0,50 mm`, consistente com 50 divisões centesimais no tambor |
| Pose canônica | `10,000 mm`, estimada pelas marcas `0`, `5` e `10` expostas; a fotografia não fornece leitura inequívoca |
| Qualidade da vista | Fotografia de catálogo quase ortográfica, `1000 × 1000 px`, fundo branco |

O fabricante é identificável na fotografia, mas o número de catálogo não está
visível. A implementação preserva a variante observável e substitui marca e
placa proprietárias pela identidade Cabalero.

### 1.1 Prioridade das fontes

| Fonte | Uso permitido | Uso que não governa |
| --- | --- | --- |
| `ferradura.png`, `565 × 491 px` | diagnóstico histórico do conflito entre quadro, batente e cabeçote | formato ativo da ferradura após a decisão pelo U quadrado |
| `M_externo.webp` | inventário mecânico, ordem axial, contatos, bainha, tambor e catraca | formato final da ferradura quando divergir da fonte dedicada |
| `M_externo3.png` | relação simplificada entre ferradura e conjunto axial | substituição do contorno dedicado por uma aproximação genérica |

O recorte mecânico de `ferradura.png` é `x=22..543`, `y=18..469`. A linha
branca interna é evidência de um friso/rebaixo decorativo, não uma segunda
borda estrutural. O símbolo branco do cabeçote direito não é reproduzido,
pois a implementação conserva a trava funcional observada na fotografia.

## 2. Recorte e inventário de partes

Envelope mecânico aproximado na imagem: `x=14..987`, `y=309..710`. As caixas
abaixo são normalizadas por esse envelope.

| Ordem axial | Parte | Caixa normalizada aproximada `(x,y,w,h)` | Propriedade |
| ---: | --- | --- | --- |
| 1 | Arco em C e base do quadro | `(0,00; 0,04; 0,45; 0,96)` | fixo; principal silhueta e espaço negativo |
| 2 | Bigorna fixa com inserto brilhante | `(0,04; 0,02; 0,09; 0,20)` | fixa; face direita é o primeiro contato |
| 3 | Vão de medição | `(0,13; 0,08; 0,07; 0,14)` | espaço negativo obrigatório na pose canônica |
| 4 | Fuso móvel e haste exposta | `(0,20; 0,08; 0,13; 0,15)` | translada axialmente; face esquerda é o segundo contato |
| 5 | Orelha/bucha do quadro | `(0,32; 0,00; 0,14; 0,34)` | fixa; recebe fuso, trava e bainha |
| 6 | Alavanca de trava | `(0,35; 0,08; 0,08; 0,34)` | fixa ao quadro; comando visual separado |
| 7 | Bainha graduada e nônio superior | `(0,43; 0,00; 0,14; 0,27)` | fixa; escala longitudinal e referência |
| 8 | Cone graduado do tambor | `(0,53; 0,00; 0,18; 0,30)` | móvel e rotativo; costura com a bainha |
| 9 | Empunhadura recartilhada | `(0,70; 0,00; 0,17; 0,29)` | acompanha o tambor; volume distinto |
| 10 | Pescoço metálico | `(0,86; 0,05; 0,04; 0,20)` | acompanha o tambor |
| 11 | Catraca terminal | `(0,89; 0,05; 0,11; 0,21)` | móvel; último volume axial |

Não podem ser fundidos: arco e bigorna; fuso e bucha; bainha e tambor; cone
graduado e empunhadura; empunhadura e catraca. O vão interno do arco e o vão de
medição são partes estruturais da referência.

## 3. Mapa de âncoras

| Âncora | Valor/evidência normalizada |
| --- | --- |
| Eixo de medição | `y≈0,15` do envelope mecânico |
| Extremo esquerdo do quadro | `x=0,00` |
| Face da bigorna | `x≈0,13` |
| Face do fuso na pose | `x≈0,20` |
| Centro da bucha | `x≈0,37`, `y≈0,12` |
| Início da bainha | `x≈0,43` |
| Costura bainha/tambor | `x≈0,56` na pose canônica; em medidas inteiras, a graduação correspondente compartilha exatamente esse datum |
| Início da recartilha | `x≈0,70` |
| Início da catraca | `x≈0,89` |
| Extremo direito | `x=1,00` |
| Base do arco | `y=1,00` |
| Linha de referência da bainha | coincide com o eixo de medição |

O quadro tem perfil robusto e assimétrico: topo interrompido pelo vão, ramo
esquerdo curto junto à bigorna, ramo direito alto integrado à bucha e arco
inferior espesso. Uma moldura circular uniforme não satisfaz a referência.

### 3.1 Âncoras históricas da ferradura circular

As coordenadas de projeção usam `B`; `x` parte da origem da cena e `y` parte
do eixo de medição. Elas estão registradas em
`EXTERNAL_MICROMETER_FRAME_REFERENCE` e protegidas por teste independente.

| Âncora | Pixel na referência | Razão na projeção |
| --- | ---: | ---: |
| extremo externo esquerdo | `(22, 253)` | `(0,18; 1,63)` |
| extremo externo direito | `(543, 124)` | `(5,52; 0,31)` |
| topo do cabeçote direito | `(540, 19)` | `(5,49; -0,77)` |
| coroa interna esquerda | `(127, 104)` | `(1,26; 0,10)` |
| coroa interna direita | `(409, 129)` | `(4,14; 0,36)` |
| fundo da abertura interna | `(291, 323)` | `(2,94; 2,34)` |
| fundo externo | `(239..305, 469)` | `y=3,84` |

Essas âncoras documentam somente a tentativa circular rejeitada. Elas não
governam mais o desenho ativo e não devem ser usadas para reconstruir o quadro.

### 3.2 Âncoras ativas do quadro quadrado

O perfil ativo está em `EXTERNAL_MICROMETER_SQUARE_FRAME_RATIOS`:

| Parte | Razão ativa |
| --- | ---: |
| laterais externas | `x=0,66` e `x=5,52`, coincidentes com os extremos do batente e da caixa da trava |
| laterais internas | `x=1,56` e `x=4,36`, coincidentes com a face do batente e o início da caixa da trava |
| fundo externo | `y=3,78` a partir do eixo |
| fundo interno | `y=2,80` a partir do eixo |
| encontro sob o batente esquerdo | `y=0,24` a partir do eixo |
| encontro sob a caixa da trava | `y=0,70` a partir do eixo |
| letreiro | `2,72 × 0,52 B`, raio `0,13 B`, centralizado na base |

As pernas e a base são retas; somente os encontros inferiores recebem raios.
O friso interno é aberto no topo e termina abaixo do batente e do cabeçote.

## 4. Modelo de leitura

- unidade inteira: `0,001 mm`;
- faixa estrita: `0..25.000` ticks (`0,000–25,000 mm`);
- passo do fuso: `500` ticks (`0,50 mm`);
- tambor: 50 divisões de `10` ticks (`0,01 mm`);
- nônio: 10 divisões para resolver o resto de `0..9` ticks (`0,001 mm`);
- leitura: bainha + tambor + nônio, todos derivados do mesmo tick inteiro.

O perfil didático centesimal reutiliza a mesma unidade inteira e a mesma faixa,
mas quantiza a leitura em múltiplos de 10 ticks (`0,01 mm`) e apresenta somente
bainha + tambor. O perfil milesimal preserva o nônio observado na referência.
Em ambos, um pixel de arraste corresponde exatamente a um passo selecionado.

## 5. Mapa cinemático

| Parte | Ao aumentar a leitura | Rotação | Datum preservado |
| --- | --- | --- | --- |
| Arco, bigorna, bucha, trava e bainha | fixos | nenhuma | face direita da bigorna e linha de referência |
| Fuso e face móvel | para a direita | nenhuma visível | eixo de medição |
| Tambor, empunhadura, pescoço e catraca | para a direita | fase do fuso | costura com a bainha |
| Cota didática | aumenta entre as faces | nenhuma | duas faces de contato |

O estado inteiro dirige simultaneamente o vão, a posição do fuso, a costura, a
fase circular, o nônio, a cota e o valor acessível.

A graduação longitudinal e a borda esquerda do tambor usam o mesmo datum axial.
Em posições inteiras como `10,000 mm`, a marca de `10 mm` coincide exatamente
com a costura, enquanto a fase `0` do tambor coincide com a linha de referência.
A espessura visual do contorno não pode ser compensada deslocando a escala, pois
isso produziria uma leitura geometricamente anterior ao valor verdadeiro.

## 6. Incertezas e limites

- a pose fotográfica é adotada como `10,000 mm` apenas para comparação visual;
- a fotografia não fornece cotas certificadas nem número de catálogo;
- reflexos, pintura martelada, logotipo e placa são aparência, não datums;
- a recartilha será sintetizada em canvas sem copiar textura proprietária;
- a implementação é didática e não afirma força de medição, calibração,
  exatidão certificada, desgaste, alinhamento ou mecanismo interno invisível.

## 7. Matriz de aceite

- [x] Quadro em U quadrado preserva espessura, vão e separação dos componentes.
- [x] Bigorna e fuso são coaxiais, planos e visualmente distintos.
- [x] Bucha, trava, bainha, tambor, empunhadura, pescoço e catraca permanecem separados.
- [x] Pose `10,000 mm` gera quadro referência/render/sobreposição/diferença.
- [x] Limites `0,000` e `25,000 mm` preservam topologia e escala.
- [x] Bainha, tambor e nônio recompõem a mesma leitura milesimal.
- [x] Em `10,000 mm`, marca `10`, costura do tambor, fase `0` e zero do nônio concordam.
- [x] Perfil centesimal representa todos os 2.501 valores de `0,00` a `25,00 mm`.
- [x] Arraste, toque, teclado, ajuste fino, sorteio, ocultação, lupa e tela cheia compartilham o mesmo estado.
- [x] Desktop, celular horizontal e `320 px` preservam a silhueta.
- [x] Responsável do produto recebe preview concreto para aceite visual.

## 8. Histórico: refinamento visual de 24/08/2026

- ferradura corrigida com curvas contínuas e vão interno comparado novamente na pose `10,000 mm`;
- silhueta da ferradura refinada segundo `M_externo3.png`: coroa esquerda curta e quadrada, arco inferior compacto e arredondado, ramo direito estreito e transição assimétrica para o cabeçote;
- fuso permanece visível dentro da bucha do quadro em vez de ser coberto como se a haste terminasse na mandíbula;
- quadro usa a paleta neutra de aço/grafite compartilhada pelos outros instrumentos;
- numerais de bainha, nônio e tambor receberam peso, tamanho e contorno de contraste maiores;
- identificação Cabalero ocupa um inserto técnico assimétrico e rebaixado, integrado à curva inferior da ferradura, sem rebites;
- comparação atual registrada em `output/playwright/external-corrections-comparison.png` (artefato local, fora do commit).

## 9. Histórico: correção circular rejeitada em 25/08/2026

- identificado que a rodada anterior usou `M_externo3.png` como inspiração,
  embora a reconstrução estrita exigisse uma fonte geométrica prioritária;
- `ferradura.png` passa a governar explicitamente a silhueta do quadro;
- o contorno foi extraído do recorte original, convertido em comandos vetoriais
  nomeados e separado do modelo inteiro da medição;
- a abertura interna, a base semicircular espessa, as coroas curtas e os
  cabeçotes retangulares agora seguem a mesma fonte;
- o friso acompanha o mesmo U sem alterar o contorno mecânico;
- o friso forma o circuito U fechado observado na referência, acompanhando
  tanto a abertura interna quanto o arco externo;
- o teste geométrico trava os extremos e o fundo da abertura contra regressões;
- quadro de diagnóstico registrado em
  `output/playwright/external-ferradura-reference-board.png`.

## 10. Substituição por geometria quadrada em 25/08/2026

- o responsável do produto rejeitou a solução circular por invadir visualmente
  o batente esquerdo e interferir na circunferência do cabeçote;
- a ferradura ativa passou a ser um U retangular com cantos inferiores
  arredondados e base reta;
- a perna esquerda encontra somente a face inferior do batente e é desenhada
  antes dele, portanto nunca o cobre;
- a perna direita e o friso terminam abaixo da circunferência da trava;
- o letreiro passou a ser retangular, centralizado e com raio curto;
- o perfil circular rastreado permanece apenas como evidência histórica e não
  deve ser restaurado sem novo pedido explícito.

## 11. Encaixes estruturais corrigidos em 25/08/2026

- a perna esquerda usa exatamente o envelope horizontal do batente fixo,
  de `x=0,66 B` até a face `x=1,56 B`;
- a perna direita usa exatamente o envelope horizontal da caixa da trava,
  de `x=4,36 B` até `x=5,52 B`;
- os topos encontram as faces inferiores em `y=0,24 B` e `y=0,70 B`, sem
  degrau lateral ou espaço visível;
- batente e caixa continuam desenhados depois do quadro, preservando a leitura
  das peças e ocultando qualquer artefato de antialias na união.

## 12. Correção do datum longitudinal em 31/08/2026

- removida a folga artificial de `0,025 × B` entre graduação da bainha e costura;
- `0,000`, `10,000` e `25,000 mm` passam a usar o mesmo datum geométrico para
  marca longitudinal e borda esquerda do tambor;
- o modelo inteiro, a decomposição em bainha/tambor/nônio e o curso axial foram
  preservados; a mudança é exclusivamente da projeção da escala longitudinal.

## 13. Visibilidade da graduação coincidente em 01/09/2026

- em leituras inteiras, a graduação longitudinal e a costura continuam usando
  exatamente a mesma coordenada, sem folga artificial;
- o segmento da graduação abaixo da linha de referência é redesenhado depois do
  tambor, impedindo que a ordem de pintura apague visualmente o traço coincidente;
- em `10,000 mm`, marca `10`, costura, zero do tambor e zero do nônio permanecem
  simultaneamente visíveis e derivados do mesmo estado inteiro.

## 14. Matriz independente de calibração em 01/09/2026

- um oráculo de teste separado do modelo recompõe os `25.001` estados por passo
  de fuso de `500` ticks, incremento centesimal de `10` ticks e resto milesimal;
- a projeção é verificada em `N,000`, `N,100`, `N,109` e `N,499 mm` para cada
  milímetro de `0` a `25`, em desktop, projetor, celular horizontal e 320 px;
- cada pose compara de forma independente a distância entre contatos, o curso
  da costura, a graduação longitudinal, a divisão do tambor e a do nônio;
- a revisão histórica `aabc4c9` não satisfaz esta matriz: sua folga visual de
  `0,025 × B` equivale a um deslocamento longitudinal constante de `0,25 mm`.

## 15. Revelação progressiva dos números longitudinais em 01/09/2026

- cada número é centralizado na coordenada de sua própria graduação;
- o número não é deslocado para a graduação anterior para permanecer inteiro;
- quando a costura alcança `5`, `10`, `15`, `20` ou `25 mm`, o tambor recorta o
  número na coincidência e o revela progressivamente conforme avança;
- essa oclusão preserva a associação visual entre número e traço sem alterar o
  modelo inteiro, o curso axial ou a decomposição da leitura.
