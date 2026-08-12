# Análise da referência Stefanelli — paquímetro universal

## Objetivo e limites da análise

Esta análise registra o modelo mental, o fluxo didático e os comportamentos observados nas páginas do Prof. Eduardo J. Stefanelli para orientar uma implementação original da Cabalero_Automações. Não foram copiados código, imagens, animações, textos extensos nem outros ativos da referência.

A inspeção foi feita em navegador automatizado e isolado, sem clicar em anúncios, sem aceitar notificações, sem iniciar downloads e sem executar os arquivos `.exe` oferecidos pelo site. O conteúdo textual também foi conferido por leitura HTTP. As observações abaixo distinguem comportamento efetivamente testado de inferências de projeto.

## Páginas consultadas

- Índice de downloads: `https://www.stefanelli.eng.br/download-autoavaliacao-paquimetro-milimetro-polegada/`
- Simulador métrico de 0,05 mm: `https://www.stefanelli.eng.br/paquimetro-virtual-simulador-milimetro-05/`
- Simulador métrico de 0,02 mm: `https://www.stefanelli.eng.br/paquimetro-virtual-simulador-milimetro-02/`
- Simulador em polegada fracionária de 1/128 in: `https://www.stefanelli.eng.br/paquimetro-virtual-nonio-polegada-fracionaria-simulador/`
- Simulador em polegada milesimal, nônio de 25 divisões: `https://www.stefanelli.eng.br/paquimetro-virtual-simulador-polegada-milesimal-25/`
- Simulador em polegada milesimal, nônio de 40 divisões: `https://www.stefanelli.eng.br/paquimetro-virtual-simulador-polegada-milesimal-40/`

## Resumo do modelo de interação

O núcleo da experiência é um paquímetro analógico desenhado horizontalmente. O bico fixo e a escala principal permanecem imóveis; o cursor, o bico móvel e o nônio se deslocam juntos. O usuário arrasta esse conjunto no eixo horizontal, e a medida muda continuamente, respeitando a resolução do modelo.

O simulador apresenta simultaneamente:

1. a posição física dos bicos;
2. a escala principal;
3. o nônio alinhado à posição atual;
4. uma cota gráfica entre os bicos, acompanhada do valor;
5. uma leitura numérica destacada em vermelho;
6. uma lupa que amplia as graduações;
7. um ícone de olho associado à exibição da resposta;
8. setas na região do cursor como alternativa de ajuste fino;
9. um comando externo do contêiner para ocupar a tela.

Na referência, cada sistema/resolução vive em uma página diferente. Na plataforma Cabalero, o mesmo modelo mental deve ser preservado, mas sistema e resolução devem ser alternados no próprio simulador, sem navegação ou recarga.

## Fluxo observado

### 1. Entrada na página

O usuário atravessa cabeçalho, conteúdo editorial, anúncios e explicações antes de chegar ao simulador. Em viewport móvel de 390 × 844 px, o simulador foi encontrado aproximadamente 1.872 px abaixo do topo. Isso confirma que o instrumento não é o protagonista da página atual, embora seja a razão principal da visita.

**Requisito derivado:** abrir diretamente na bancada de simulação; explicações devem ser secundárias, recolhíveis ou acessíveis por uma seção de ajuda.

### 2. Manipulação do cursor

O texto da página orienta “arraste e solte o cursor na horizontal”. Em teste, o arraste efetivamente alterou a abertura dos bicos e o valor: uma leitura de 67,45 mm passou a 58,35 mm ao mover o cursor. A peça móvel inteira acompanha a entrada, mantendo a relação visual entre bico, cursor e nônio.

**Requisitos derivados:**

- restringir o movimento ao eixo horizontal;
- capturar o ponteiro durante o gesto, para o arraste não se perder quando sair do componente;
- limitar a posição ao intervalo físico do instrumento;
- quantizar a medida na menor divisão da configuração atual;
- manter bico móvel, cursor, parafuso/roldana e nônio em uma única transformação;
- oferecer a mesma ação por toque e teclado.

### 3. Leitura

A referência mostra o valor de duas formas: junto à cota entre os bicos e como leitura numérica vermelha no canto inferior direito. Essa redundância é útil em projeção, pois vincula a abertura física ao número e mantém uma resposta visível quando a escala é pequena.

A própria seção de comentários documenta uma dificuldade recorrente: em certas resoluções de monitor, mais de um traço pode parecer coincidente. A lupa foi criada para resolver esse problema.

**Requisitos derivados:**

- manter uma resposta grande e de alto contraste fora do desenho do instrumento;
- vincular visualmente a cota ao vão medido;
- não depender apenas da cor para distinguir resposta, escala ou estado;
- renderizar graduações como vetores nítidos em qualquer densidade de tela;
- fornecer zoom real e previsível, sem trocar a coordenada matemática da leitura.

### 4. Lupa

O clique na lupa ampliou fortemente a região da escala e do nônio. O detalhe tornou as coincidências mais evidentes, mas a ampliação observada substitui a visão geral e pode cortar partes importantes do instrumento. O controle continua no canto inferior direito.

**Requisito derivado:** implementar a lupa como modo de detalhe com dois contextos simultâneos: visão geral reduzida ou indicação clara da posição, e janela ampliada centrada no zero do nônio. O zoom não deve alterar a medida nem o tamanho lógico do instrumento.

### 5. Mostrar/ocultar resposta

O olho comunica o modelo esperado de aula: o professor posiciona o instrumento, oculta a resposta, pergunta à turma e a revela para conferência. Na referência, o controle está desenhado dentro do canvas e não é reconhecido pelo DOM como botão. Em viewport estreito ele ficou encostado ou parcialmente fora da área útil, dificultando a ativação confiável.

**Requisito derivado:** o olho deve ser um botão HTML real, persistente e acessível, com rótulo alternando entre “Ocultar resposta” e “Mostrar resposta”. Quando oculto, deve desaparecer toda resposta pronta — tanto o número destacado quanto o número da cota — sem remover a cota, a escala nem a posição do instrumento. O estado deve sobreviver a arrastes e mudanças de zoom.

### 6. Ajuste por setas

Na visualização ampliada apareceram setas junto ao nônio, e o desenho inclui a instrução “use as setas para mover”. A associação é didaticamente boa, mas o alvo está incorporado ao canvas, não recebe foco e não expõe nome ou estado a tecnologias assistivas.

**Requisito derivado:** permitir `ArrowLeft` e `ArrowRight` para um incremento da resolução; `Shift` + seta para dez incrementos; `Home` para zero e `End` para a abertura máxima. Botões visíveis de menos/mais podem ser oferecidos em telas de toque e devem ter alvos de pelo menos 44 × 44 CSS px.

### 7. Tela cheia

O contêiner oferece um ícone para expandir a simulação. Durante o teste em desktop, a área passou de cerca de 673 × 375 px para 1.280 × 720 px. Ao sair, o canvas permaneceu visualmente ampliado e recortado dentro do contêiner menor, demonstrando uma falha de restauração de dimensões.

**Requisitos derivados:**

- usar a Fullscreen API com estado controlado;
- recalcular apenas a projeção/viewport ao entrar, sair, girar ou redimensionar;
- manter a medida em unidades de domínio, nunca em pixels;
- observar `fullscreenchange` e `ResizeObserver`;
- testar repetidos ciclos entrar/sair e restaurar foco ao botão de origem.

## Sistemas e resoluções documentados na referência

| Sistema | Escala/nônio descritos | Resolução exibida |
| --- | --- | --- |
| Métrico | escala principal em mm; nônio com 20 divisões | 0,05 mm |
| Métrico | escala principal em mm; nônio com 50 divisões | 0,02 mm |
| Polegada fracionária | divisão principal de 1/16 in subdividida pelo nônio | 1/128 in |
| Polegada milesimal | passo principal de 0,025 in e nônio de 25 divisões | 0,001 in |
| Polegada milesimal | passo principal de 0,040 in e nônio de 40 divisões | 0,001 in |

Observação terminológica: “centesimal” se aplica naturalmente ao modo métrico de 0,02 mm; “milesimal” ao modo decimal de 0,001 in. Eles não são simplesmente dois níveis de zoom da mesma escala. A interface deve primeiro selecionar o sistema e depois oferecer apenas resoluções/construções válidas para esse sistema.

## Pontos fortes a reaproveitar

- Instrumento reconhecível, com bicos externo/interno, régua, cursor, nônio, haste e elementos de manuseio.
- Relação direta entre gesto horizontal e abertura dos bicos.
- Escala principal e nônio permanecem como fonte real da resposta; o número não substitui a leitura analógica.
- Cota gráfica dá significado físico ao valor.
- Resposta numérica grande favorece demonstrações em sala.
- Olho representa muito bem o ritual pedagógico “perguntar e revelar”.
- Lupa resolve uma necessidade real das graduações pequenas.
- Setas sugerem ajuste fino e permitem chegar exatamente a uma divisão.
- Material atende tanto prática individual quanto aula projetada, algo confirmado pelos relatos de alunos e professores na própria página.
- Separação conceitual entre configurações métricas, fracionárias e milesimais.

## Problemas e riscos observados

### Usabilidade e responsividade

- O simulador fica enterrado após grande quantidade de conteúdo e publicidade.
- O desenho base usa proporção fixa e, em 390 px, foi reduzido a ponto de números e traços ficarem muito pequenos.
- Controles internos chegam à borda ou ficam parcialmente inacessíveis em telas estreitas.
- A ampliação ocupa a tela com pouco contexto e pode ocultar bicos e zero do instrumento.
- A saída da visualização expandida deixou o canvas ampliado e recortado.
- O texto “use as setas para mover” é visualmente sobreposto às graduações e não explica a unidade do incremento.
- Há duplicação de resposta sem um modo de ocultação robusto em todas as dimensões testadas.

### Acessibilidade

- Todo o simulador é um canvas opaco para a árvore de acessibilidade.
- Lupa, olho, setas e arraste não expõem função, nome, valor, limites ou estado.
- Não foi encontrada uma ordem de foco interna nem uma operação de teclado semanticamente confiável.
- A resposta usa vermelho como principal diferenciação visual.
- Textos muito pequenos perdem legibilidade em mobile e projeção.
- Alterações de medida não são anunciadas por região viva.
- A forma do cursor/ponteiro não comunica de maneira consistente toda a área arrastável.

### Desempenho e robustez

- O simulador é carregado por um conversor/compatibilidade de conteúdo Flash (“Swiffy”) dentro de canvas, em vez de uma implementação web nativa.
- Foi observado erro JavaScript em `customSwiffy.js` ao ler `localName` de um valor indefinido.
- Um gesto gerou centenas de avisos de leituras repetidas de `getImageData`; o navegador recomenda `willReadFrequently`. Isso indica trabalho de canvas contínuo e potencial custo de CPU/GPU.
- A restauração após expandir depende de dimensões e escala imperativas frágeis.

### Privacidade, segurança e distração

- A página de referência é explicitamente um índice de executáveis e convida a iniciar downloads.
- A página do simulador carrega publicidade e serviços de terceiros. Na sessão foram observadas requisições para Google Ads, Funding Choices, reCAPTCHA, Google Maps, Hotjar/telemetria e Cloudflare RUM.
- Links editoriais e anúncios estão misturados ao fluxo de estudo.
- A Cabalero não deve embutir a página, o canvas, scripts, JSON, imagens ou executáveis da referência.
- A plataforma nova deve funcionar sem anúncios, downloads automáticos, pop-ups ou scripts de rastreamento não essenciais.

### Propriedade intelectual

- A análise autoriza reaproveitar ideias gerais de interação e princípios didáticos, não a expressão visual específica.
- Devem ser originais: geometria vetorial do instrumento, marca, tipografia, ícones, textos, código, modelo matemático, paleta e disposição dos controles.
- A inscrição do novo instrumento deve ser `Cabalero_Automações`.

## Requisitos funcionais consolidados

1. Exibir um paquímetro universal analógico como superfície principal da aplicação.
2. Mover o conjunto móvel por mouse, toque, caneta e teclado.
3. Ajustar em passos exatos da resolução selecionada, sem deriva de ponto flutuante.
4. Oferecer configurações métricas de 0,05 mm e 0,02 mm.
5. Oferecer polegada milesimal de 0,001 in; polegada fracionária de 1/128 in pode entrar na mesma arquitetura sem contaminar o MVP.
6. Trocar sistema/resolução no mesmo simulador e recalcular a representação sem recarregar a página.
7. Exibir resposta grande, unidade e resolução ativa.
8. Ocultar/revelar todas as respostas prontas por um botão de olho, sem mover o instrumento.
9. Oferecer lupa/foco de escala e tela cheia sem alterar o valor atual.
10. Manter clareza da graduação em desktop, tablet, telefone e projetor.
11. Persistir preferências não sensíveis localmente, sem conta obrigatória.
12. Não carregar scripts, fontes, anúncios ou mídia da referência em produção.

## Critérios de aceite derivados

- Para toda posição válida, o valor destacado, a cota, o zero do nônio e o modelo matemático concordam.
- Arrastar para a direita nunca reduz a abertura; arrastar para a esquerda nunca a aumenta.
- O valor sempre é múltiplo inteiro da resolução ativa.
- Trocar unidade preserva a abertura física dentro do erro máximo de uma divisão da configuração de destino.
- Ocultar a resposta não altera a posição e não deixa o valor exposto em outro ponto visual ou acessível.
- Entrar e sair de tela cheia cinco vezes consecutivas não causa corte, salto de medida ou perda de controles.
- Com zoom do navegador a 200%, todos os controles permanecem operáveis e a escala pode ser lida pelo modo lupa.
- Em 320 CSS px de largura, nenhum controle essencial fica fora da viewport.
- O paquímetro pode ser ajustado do mínimo ao máximo apenas por teclado.
- Não há download iniciado, janela aberta ou requisição publicitária durante o uso normal.

## Evidências da inspeção

- Captura inicial do simulador: `.playwright-cli/element-2026-08-12T00-57-51-518Z.png`.
- Captura após arraste: `.playwright-cli/element-2026-08-12T00-58-36-416Z.png`.
- Captura em ampliação: `.playwright-cli/element-2026-08-12T01-00-08-083Z.png`.
- Captura do recorte após retornar da ampliação: `.playwright-cli/element-2026-08-12T01-01-59-991Z.png`.
- Captura em viewport móvel: `.playwright-cli/element-2026-08-12T01-03-40-203Z.png`.
- Log de console da sessão: `.playwright-cli/console-2026-08-12T00-57-22-970Z.log`.

Esses artefatos são apenas evidência local temporária de pesquisa; não devem ser publicados nem incorporados ao produto.
