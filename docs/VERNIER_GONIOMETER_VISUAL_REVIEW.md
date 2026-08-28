# Revisão visual do goniômetro — 27/08/2026

Este registro evita que rodadas futuras repitam soluções já rejeitadas. Ele deve
ser lido junto de `docs/CODEX_HANDOFF.md` e
`docs/VERNIER_GONIOMETER_REFERENCE_CONTRACT.md` antes de qualquer novo ajuste
visual no goniômetro.

## 1. Escopo e referências conferidas

- variante preservada: goniômetro universal analógico INSIZE `2372-360`;
- pose canônica: `52°30′`, sentido horário, lâmina longa;
- referência mecânica principal: página, fotografia, ficha e manual oficiais do
  INSIZE `2372-360`;
- referência didática: simulador e explicação de Eduardo Stefanelli para nônio
  retrógrado de `5′`;
- referência industrial de controle: goniômetro universal Mitutoyo Série 187,
  somente para nomenclatura e relações entre lâmina, bloco, ajuste fino, lupa e
  acessório angular. Sua topologia não foi misturada com a variante INSIZE.

O site do Stefanelli registra que o zero fornece os graus inteiros, as doze
divisões fornecem passos de `5′` e a leitura acompanha o sentido de giro. O
manual INSIZE governa a montagem física, o nônio bilateral `23°/12`, o lado de
leitura e as fixtures `15°25′` e `71°45′`.

## 2. Falhas marcadas pelo responsável do produto

| Falha observada | Classificação | Diagnóstico confirmado |
| --- | --- | --- |
| números bagunçados no nônio | funcional | quatro rótulos de dois dígitos por lado eram colocados dentro dos próprios traços e ligados por linhas auxiliares, criando cruzamentos sem equivalente físico |
| leitura quase ilegível | funcional | a lupa ampliava a composição inteira; lâmina, botões, carcaça e escala competiam pela mesma área, sem uma janela limpa para graus e minutos |
| borda do nônio sobre números centrais | funcional | o setor móvel e os números da escala principal ocupavam praticamente o mesmo raio; o contorno completo do setor atravessava a faixa dos números fixos |
| bloco cinza solto abaixo da ferramenta | cosmética/topológica | um retângulo largo pretendia representar o parafuso inferior, mas estava junto ao cabeçote e sem contato convincente com a base |
| composição desconectada à esquerda | cosmética/topológica | o bloco de fixação começava de um único lado do pivô e o botão de ajuste fino não possuía ponte visual até o conjunto móvel |

## 3. Soluções anteriores que não devem ser repetidas

1. **Aumentar apenas a fonte.** Falhou porque a densidade e as colisões
   permaneceram; contraste não era a causa dominante.
2. **Alternar pistas radiais mantendo linhas-guia.** Falhou porque as linhas se
   cruzavam com traços, bordas e outros números, parecendo uma anotação solta.
3. **Ampliar o instrumento inteiro em torno do pivô.** Falhou porque a lâmina e
   os comandos físicos continuavam cobrindo a região que deveria ensinar a
   coincidência das escalas.
4. **Usar um contorno completo e escuro no setor do nônio.** Falhou porque o
   arco externo cortava a escala principal e transformava a costura de leitura
   em uma borda decorativa dominante.
5. **Representar parafusos e blocos sem âncora mecânica.** Falhou porque peças
   plausíveis isoladamente pareciam resíduos gráficos quando não tocavam o
   componente ao qual pertencem.

## 4. Correções aplicadas nesta rodada

- a escala principal passou para o anel externo do cabeçote e seus números
  ganharam uma pista radial própria, fora do envelope do nônio;
- a visão geral mostra somente `30′` e `60′` no lado ativo, além do zero; todas
  as 12 divisões físicas por lado continuam presentes;
- as linhas-guia dos números do nônio foram removidas;
- os traços do nônio foram encurtados para liberar uma faixa interna exclusiva
  para `0`, `15`, `30`, `45` e `60` na ampliação;
- o setor móvel conserva preenchimento e bordas laterais/interna, mas não usa
  mais um arco externo escuro sobre a escala fixa;
- a ampliação foca a costura real de leitura e omite base, lâmina, blocos,
  botões e lupa física. Ela altera somente a projeção e mantém arraste, toque,
  teclado e botões no mesmo inteiro;
- a lupa física da visão geral recebeu ponte voltada ao cabeçote e ficou atrás
  das inscrições, impedindo que sua moldura corte os números;
- o bloco de fixação foi centralizado sobre a lâmina e ancorado pelo botão
  central;
- o ajuste fino recebeu uma ponte visível até o conjunto móvel;
- o antigo bloco cinza foi substituído por um parafuso estreito, em contato com
  a parte inferior direita da base, como na referência INSIZE;
- a densidade dos números principais da visão geral caiu de `10°` para `20°`;
  em projeção compacta permanece `30°`, e na ampliação volta a `10°`.

## 5. Guardas automatizadas adicionadas

- fonte efetiva mínima de `14 CSS px` para rótulos ampliados;
- mínimo de `2 CSS px` por grau na ampliação;
- distância mínima de `2 CSS px` entre caixas de rótulos;
- separação radial entre os números da escala principal e o limite externo do
  nônio;
- visão geral limitada às divisões rotuladas `6` e `12` (`30′` e `60′`);
- preservação das 12 divisões físicas por lado e do nônio `23°/12`.

## 6. Matriz visual desta rodada

Conferir sempre, nos dois sentidos de leitura:

| Janela | Visão geral | Ampliação | Estados adicionais |
| --- | --- | --- | --- |
| desktop `1211 × 455` | obrigatório | obrigatório | `0°00′`, `52°30′`, `359°55′` |
| celular horizontal `844 × 390` | obrigatório | obrigatório | teclado e `Escape` |
| largura `320 px` | obrigatório | obrigatório | toque, ocultar números e limites |

Verificação executada em 27/08/2026: visão geral e ampliação conferidas nos
três formatos; sentidos direito e esquerdo legíveis; `ArrowRight`, `Home`,
`End` e `Escape` funcionais na ampliação; console sem erros. O quadro
diagnóstico referência/render foi gerado em
`output/playwright/goniometer-reference-comparison.png`. Métricas de pixel não
são tratadas como prova de equivalência por causa de fotografia, crop,
acabamento e marca deliberadamente diferentes.

## 7. Estado de aceite

As correções são incrementais e não alteram `lib/vernier-goniometer.ts`. O
resultado continua pendente de aceite visual do responsável do produto e de
validação metrológica humana. Se houver nova reprovação, registrar neste arquivo
o sintoma, a causa e a alternativa usada antes de iniciar outra tentativa.
