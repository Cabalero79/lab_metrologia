# Especificação de interface — Cabalero_Automações Metrologia

## Visão do produto

Uma bancada virtual de metrologia para ensino e prática individual. A tela deve parecer uma ferramenta de engenharia em uso, não uma página editorial nem um dashboard. O paquímetro domina a composição; marca e controles dão contexto sem competir com as graduações.

Cena de uso que orienta o desenho: **uma sala técnica iluminada, com o professor projetando a escala enquanto estudantes acompanham de suas mesas e também podem repetir o exercício no celular**.

Direção de marca: **Engenharia de Software aplicada à Indústria — precisa, industrial e didática**.

## Princípios de interface

1. Instrumento antes da interface: o paquímetro recebe a maior área útil.
2. A escala é a fonte: o número destacado confirma, mas não substitui a leitura analógica.
3. Um gesto, um efeito: arrastar move; lupa amplia; olho revela; controles não têm funções escondidas.
4. Professor e aluno usam a mesma tela: ocultação e projeção não criam um aplicativo separado.
5. Precisão visível: unidade, resolução e valor têm formato estável e nunca dependem apenas de cor.
6. Sem distrações: nenhuma publicidade, feed, pop-up ou download no fluxo.

## Arquitetura da tela

### Wireframe — desktop e projeção

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [marca CA] Cabalero_Automações   Metrologia             [Ajuda] [Tela cheia]│
├──────────────────────────────────────────────────────────────────────────────┤
│ Paquímetro universal               Sistema          Resolução                │
│ Ajuste a abertura e leia o nônio   [ Milímetros | Polegadas ] [0,05 | 0,02] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ÁREA DO INSTRUMENTO — 65 a 75% da altura útil                              │
│                                                                              │
│  bico fixo       vão                         bico móvel + cursor              │
│     ┃<──────────────── cota ────────────────>┃                               │
│     ┣━━━━━━━━ escala principal ━━━━━━━━━━━━━━━━ haste                        │
│                                 ┗━━━━ nônio ━━━┛                             │
│                                                                              │
│              [ − ]  arraste o cursor ou use ← →  [ + ]                      │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ LEITURA ATUAL                                                               │
│ [ícone unidade]  58,35 mm  · resolução 0,05 mm       [olho Ocultar] [Lupa] │
└──────────────────────────────────────────────────────────────────────────────┘
```

O cabeçalho tem uma única linha e altura contida. A barra de configuração fica imediatamente acima do instrumento, sem card. A leitura forma uma faixa de conclusão abaixo dele, com o valor no extremo mais visível e ações no lado oposto.

### Wireframe — telefone em retrato

```text
┌────────────────────────────────────┐
│ [CA] Cabalero_Automações     [⋯]  │
├────────────────────────────────────┤
│ Paquímetro universal               │
│ [ Milímetros | Polegadas ]         │
│ Resolução [ 0,05 mm          ▾ ]   │
├────────────────────────────────────┤
│                                    │
│  instrumento em viewport próprio   │
│  com pan/zoom didático controlado  │
│                                    │
│       [ − ]  ← ajuste →  [ + ]     │
├────────────────────────────────────┤
│ Leitura atual                      │
│ 58,35 mm                           │
│ resolução 0,05 mm                  │
│ [Ocultar resposta] [Ampliar escala]│
└────────────────────────────────────┘
```

Em retrato, não se deve reduzir o instrumento inteiro até as graduações ficarem ilegíveis. A área usa uma câmera horizontal sobre um instrumento vetorial maior: o zero do nônio fica visível por padrão, e um botão “Ver instrumento inteiro” alterna para o enquadramento geral. Ao girar para paisagem, o instrumento usa toda a largura automaticamente.

## Componentes e hierarquia

### 1. Marca e cabeçalho

- Símbolo original simples baseado na relação entre duas graduações, sem reproduzir o desenho da referência.
- Nome visível: `Cabalero_Automações`.
- Assinatura acessível/alternativa: “Engenharia de Software aplicada à Indústria”.
- No corpo do paquímetro, gravar `Cabalero_Automações`; a gravação é secundária e nunca intercepta eventos.
- “Ajuda” abre um painel lateral ou região expansível, não um modal inicial.
- “Tela cheia” é um botão com ícone e texto em desktop; apenas ícone com `aria-label` em superfícies realmente estreitas.

### 2. Seletor de sistema

- Controle segmentado semântico, implementado como grupo de radios ou botões pressionáveis.
- Opções iniciais: `Milímetros` e `Polegadas`.
- O rótulo deve ficar sempre visível; não usar apenas `mm`/`in` como nome.
- A seleção muda a lista de resoluções válidas.

### 3. Seletor de resolução

Matriz proposta para o MVP:

| Sistema | Rótulo para o usuário | Valor de domínio | Nônio |
| --- | --- | --- | --- |
| Milímetros | Centesimal — 0,02 mm | 2 centésimos de mm por passo | 50 divisões |
| Milímetros | Cinco centésimos — 0,05 mm | 5 centésimos de mm por passo | 20 divisões |
| Polegadas | Milesimal — 0,001 in | 1 milésimo de in por passo | construção de 25 divisões inicialmente |

A arquitetura pode receber “Fracionária — 1/128 in” e a construção milesimal de 40 divisões depois. Não rotular 0,05 mm como “decimal” ou 0,001 in como mera troca visual: cada opção muda graduações, nônio, formatação e incremento.

Desktop pode usar outro controle segmentado quando houver até três opções. Telefone usa `select` nativo para preservar espaço e familiaridade.

### 4. Superfície do instrumento

- Preferir SVG responsivo ou geometria vetorial equivalente, com partes agrupadas por responsabilidade.
- Escala fixa em camada própria; conjunto móvel em grupo transformado apenas no eixo X.
- Área de arraste maior que o desenho do cursor, mas cursor visual `grab`/`grabbing` apenas onde a ação é válida.
- Uma alça discreta no cursor indica o ponto de manipulação; não usar texto vermelho sobre a escala.
- Traços principais, intermediários e menores têm comprimentos e pesos diferentes, nunca apenas cor.
- Números usam algarismos tabulares.
- A cota termina nas faces de medição e continua visível quando a resposta está oculta; o texto da cota vira “?” nesse estado.
- O instrumento representa bicos externos e internos, haste de profundidade, trava/parafuso e roldana, sem ornamentação fotorrealista desnecessária.

### 5. Leitura atual

- Região persistente com título “Leitura atual”.
- Valor usa o maior tamanho tipográfico da interface, mas sem aparência de display digital no corpo do instrumento.
- Formatação pt-BR por padrão: `58,35 mm`; para polegadas decimais: `2,297 in`; para futura fração: número misto legível, como `2 3/16 in`.
- Algarismos tabulares evitam salto horizontal durante o arraste.
- Unidade nunca fica implícita.
- “Resolução 0,05 mm” aparece na mesma região.
- Quando oculto, mostrar `— —,— — mm` ou “Resposta oculta”, preservando largura. A segunda forma é preferível para leitores de tela.

### 6. Botão de resposta

- Ícone de olho aberto + “Ocultar resposta” no estado visível.
- Ícone de olho riscado + “Mostrar resposta” no estado oculto.
- `aria-pressed` reflete se a resposta está oculta ou usar nome mutável com estado equivalente; não duplicar mensagens.
- Atalho sugerido: `R`, ignorado quando o foco estiver em campo editável.
- Em modo oculto, o valor não deve existir como texto visual escondido por `opacity`; renderizar uma representação neutra e fornecer apenas “Resposta oculta” à árvore de acessibilidade.
- Revelar anuncia “Resposta: 58,35 milímetros” em região `aria-live="polite"`.

### 7. Lupa

- Botão “Ampliar escala”, alternando para “Fechar ampliação”.
- Abre uma região inline dentro da bancada, não uma nova página.
- A janela detalhada centra o zero do nônio e mostra pelo menos uma marca candidata de coincidência de cada lado.
- Um pequeno indicador de posição na visão geral mostra o trecho ampliado.
- O usuário ainda pode ajustar por setas enquanto ampliado.
- Lupa e tela cheia são independentes e podem coexistir.

### 8. Ajuste fino

- `ArrowLeft`/`ArrowRight`: um passo da resolução.
- `Shift` + seta: dez passos.
- `Home`: fechamento/zero.
- `End`: abertura máxima.
- Botões `−` e `+` são visíveis em dispositivos com ponteiro grosseiro e podem permanecer no desktop por descoberta.
- Pressionar e segurar pode repetir após uma pequena espera, com limite físico e sem aceleração surpresa.
- O valor é anunciado após pausa de aproximadamente 300–500 ms, não a cada frame de arraste.

## Estados da interface

### Estado inicial

- Configuração padrão: milímetros, 0,05 mm.
- Abertura inicial não nula, escolhida deterministicamente ou restaurada da sessão.
- Resposta visível no estudo individual; se existir preferência persistida do professor, respeitá-la sem esconder silenciosamente na primeira visita.
- Ajuda curta: “Arraste o cursor ou use as setas para ajustar.” Some após a primeira interação, mas continua disponível em Ajuda.

### Arrastando

- Cursor `grabbing`.
- Alça e contorno móvel ganham ênfase de estado, sem glow decorativo.
- Valor e posição atualizam no mesmo frame.
- Seleção de texto e rolagem horizontal da página ficam suprimidas apenas durante o gesto ativo.

### Limite mínimo/máximo

- Movimento é clampado sem quique.
- Botão correspondente fica desabilitado e expõe essa condição.
- Uma mensagem discreta “Limite do instrumento” pode ser anunciada uma vez, sem toast repetitivo.

### Resposta oculta

- Número grande, número da cota e qualquer explicação do alinhamento ficam suprimidos.
- Unidade e resolução permanecem visíveis.
- Ícone e texto do botão indicam claramente como revelar.
- Arraste, setas, lupa e tela cheia continuam funcionando.

### Lupa ativa

- Região ampliada recebe título “Detalhe da escala e do nônio”.
- O foco continua no botão que abriu ou vai para a região somente se isso ajudar a navegação; ao fechar, volta ao botão.
- A medida não muda ao abrir/fechar.

### Tela cheia

- Cabeçalho de marca se reduz; sistema, resolução, olho e saída permanecem visíveis.
- Instrumento e leitura usam a nova área sem recorte.
- `Esc` sai pela convenção do navegador; botão “Sair da tela cheia” também existe.
- Ao sair, o foco retorna ao botão e a escala recalcula para o contêiner.

### Troca de sistema/resolução

- Preservar a abertura física, arredondada para a divisão representável mais próxima.
- Atualizar escala, nônio, formato, incremento e limites atomicamente.
- Uma mensagem breve anuncia, por exemplo, “Polegadas, resolução um milésimo”.
- Não animar traços entre duas geometrias; uma transição curta de opacidade de até 180 ms evita morph visual enganoso.

### Carregamento e erro

- Como a geometria é local e determinística, o primeiro quadro deve aparecer sem spinner central.
- Se um módulo falhar, manter controles de navegação e exibir “Não foi possível carregar o instrumento. Tente novamente.” com ação de nova tentativa.
- Nunca oferecer download de executável como recuperação.

## Responsividade

### ≥ 1.200 px

- Cabeçalho e controles em uma linha.
- Instrumento ocupa até 75% da altura disponível.
- Faixa de leitura em linha, ideal para projetor 16:9.
- Largura máxima do conteúdo pode ultrapassar padrões editoriais; é uma ferramenta gráfica.

### 768–1.199 px

- Título e seletores podem quebrar em duas linhas.
- Leitura permanece em linha; botões mantêm texto.
- Instrumento prioriza escala até aproximadamente 150 mm e pode usar enquadramento adaptativo.

### 480–767 px

- Controles empilham sistema e resolução.
- Instrumento usa câmera horizontal centrada no zero do nônio.
- Leitura fica em duas linhas.
- Ações continuam com rótulo textual sempre que couber.

### 320–479 px

- Barra compacta de marca.
- `select` nativo para resolução.
- Ações essenciais distribuídas em duas colunas, alvos de 44 px ou mais.
- Nenhum pinch-to-zoom customizado bloqueia o zoom do navegador; o zoom da lupa é um recurso adicional.

### Altura reduzida / paisagem móvel

- Cabeçalho recolhe detalhes não essenciais.
- Configuração e leitura podem ficar em barras finas acima/abaixo da superfície.
- Garantir ao menos 240 px de altura para o instrumento; abaixo disso, permitir rolagem vertical normal.

## Acessibilidade WCAG 2.2 AA

### Semântica e teclado

- `<header>`, `<main>`, região “Simulador de paquímetro” e grupo “Configuração da escala”.
- Superfície ajustável representada por elemento focável com semântica de slider: `aria-valuemin`, `aria-valuemax`, `aria-valuenow` e `aria-valuetext` com unidade pronunciável.
- Todos os ícones têm botão HTML real; nenhum alvo existe somente no SVG/canvas.
- Ordem de foco: sistema → resolução → instrumento → menos/mais → ocultar → lupa → tela cheia → ajuda.
- Foco visível de pelo menos 2 CSS px, com contraste mínimo 3:1 e sem ser coberto por barras fixas.
- Não criar armadilha de teclado em tela cheia ou lupa.

### Contraste e projeção

- Texto normal: mínimo 4,5:1; texto grande: 3:1; traços e limites funcionais: 3:1.
- Buscar 7:1 para texto principal e valor, pois projetores lavam os tons.
- Estados ativos usam cor + forma/posição/rótulo.
- Traços da escala são quase pretos sobre metal claro; o vermelho-óxido da marca nunca é usado para os traços críticos.

### Movimento e feedback

- Transições funcionais entre 150 e 200 ms.
- `prefers-reduced-motion: reduce` remove transições de câmera e usa mudança instantânea/crossfade.
- Sem animação de entrada da página.
- Durante arraste, evitar anúncios por frame; anunciar o valor final no `pointerup` ou após debounce no teclado.

### Toque, zoom e orientação

- Alvos mínimos de 44 × 44 px para ações essenciais.
- `touch-action: none` somente no elemento de arraste; o restante da página mantém gestos do navegador.
- Suportar zoom da página a 200% e reflow a 400% onde aplicável.
- Não exigir orientação paisagem; sugeri-la apenas como melhoria, nunca bloquear retrato.

## Direção visual

### Conceito

**Bancada clara de controle metrológico com uma marca vermelho-óxido.** A superfície neutra funciona em sala iluminada e impressão mental do instrumento; o acento lembra marcação de inspeção industrial sem transformar o produto em um painel sombrio ou agressivo.

Estratégia de cor: restrita. O acento ocupa menos de 10% da tela e significa seleção, foco ou ação primária.

### Tokens propostos

```css
:root {
  --ui-bg: oklch(1 0 0);
  --ui-surface: oklch(0.965 0 0);
  --ui-surface-raised: oklch(0.925 0.006 20);
  --ui-ink: oklch(0.18 0.012 20);
  --ui-muted: oklch(0.43 0.018 20);
  --ui-primary: oklch(0.40 0.13 20);
  --ui-primary-hover: oklch(0.35 0.13 20);
  --ui-accent: oklch(0.31 0.085 245);
  --ui-focus: oklch(0.54 0.16 245);
  --ui-metal-light: oklch(0.88 0.006 250);
  --ui-metal-mid: oklch(0.70 0.008 250);
  --ui-scale: oklch(0.12 0 0);
  --ui-danger: oklch(0.48 0.18 25);
}
```

Os contrastes finais precisam ser medidos no navegador antes de consolidar os tokens. Texto branco deve ser usado sobre o vermelho-óxido preenchido.

### Tipografia

- Uma família sans de produto: Geist já disponível no starter, com fallback `system-ui`.
- Escala fixa em `rem`, sem títulos fluidos exagerados.
- Valor e números da graduação com `font-variant-numeric: tabular-nums`.
- Valor da leitura: 2–3 rem no desktop, 2 rem no telefone; título de página: 1,25–1,5 rem.
- Corpo e instruções: 1 rem, altura de linha 1,5.
- Gravação no instrumento pode usar a mesma família em peso médio; não simular manuscrito.

### Forma e material

- Interface predominantemente plana; separações por mudança de superfície e bordas discretas.
- Raios de 8–12 px em painéis e 8 px em controles; botões segmentados podem formar um grupo, não pílulas isoladas.
- Metal vetorial com no máximo três tons neutros e bordas nítidas. Evitar cromado fotorrealista, ruído e brilho animado.
- Sombra, se necessária para distinguir peça móvel da régua, curta e estrutural (até 8 px de blur), sem combinar borda ornamental e sombra larga.

### Ícones

- Conjunto coerente de traço de 1,75–2 px: olho/olho riscado, lupa, expandir/recolher, ajuda, menos/mais.
- Sempre acompanhados de rótulo em ações ambíguas ou no primeiro uso.
- Não reutilizar os bitmaps da referência.

## Conteúdo e microcopy

- Título: “Paquímetro universal”.
- Instrução inicial: “Arraste o cursor ou use as setas para ajustar a abertura.”
- Sistema: “Sistema de medida”.
- Resolução: “Resolução do nônio”.
- Leitura: “Leitura atual”.
- Resposta visível: “Ocultar resposta”.
- Resposta oculta: “Mostrar resposta”.
- Lupa fechada: “Ampliar escala”.
- Lupa aberta: “Fechar ampliação”.
- Tela normal: “Usar tela cheia”.
- Tela cheia: “Sair da tela cheia”.
- Limite: “Limite do instrumento”.

Evitar “clique aqui”, abreviações sem expansão e instruções dependentes de mouse. Em ajuda, explicar leitura em três passos: inteiro antes do zero do nônio; traço coincidente; soma conforme a resolução.

## Preparação para instrumentos futuros

A navegação futura pode adicionar um seletor “Instrumento”, mas ele não deve aparecer vazio no MVP. A especificação visual reserva:

- cabeçalho de produto compartilhado;
- barra de configuração dirigida por esquema;
- superfície vetorial específica por instrumento;
- faixa compartilhada de leitura e resposta;
- modos comuns de ocultação, lupa, tela cheia e teclado.

Para micrômetros externo e interno, reaproveitar tokens, controles de unidade/resolução, leitura e acessibilidade. Não reaproveitar a geometria ou o gesto do paquímetro por força: o tambor do micrômetro exige interação rotacional/linear própria.

## Checklist de validação visual

- Instrumento é o maior elemento em 1.280 × 720 e 1.920 × 1.080.
- Número do nônio não sobrepõe traços em todas as configurações.
- Cabalero_Automações está legível no corpo, sem competir com a graduação.
- Modo oculto não revela resposta na cota, em tooltip ou nome acessível.
- Lupa mantém contexto e não corta o controle de fechar.
- Cinco ciclos de tela cheia restauram exatamente o layout.
- 320 × 568, 390 × 844, 768 × 1.024, 1.366 × 768 e 1.920 × 1.080 foram verificados.
- Zoom do navegador a 200% e preferência de movimento reduzido foram verificados.
- Captura em escala de cinza continua distinguindo seleção, foco e estado oculto.
- Teste em projetor ou simulação de baixo contraste mantém escala e leitura compreensíveis.
