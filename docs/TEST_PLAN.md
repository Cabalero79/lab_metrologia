# Plano de testes — Paquímetro para Estudos

## 1. Objetivo

Validar que o paquímetro universal virtual seja matematicamente confiável, didático e operável por professores e estudantes em projeção ou uso individual. A prioridade é impedir três classes de falha:

1. uma leitura exibida que não corresponda à geometria do instrumento;
2. perda de controle por mouse, toque ou teclado;
3. revelação acidental da resposta durante um exercício.

Este plano cobre a primeira entrega do paquímetro e define contratos reaproveitáveis pelos futuros micrômetros externo e interno.

## 2. Escopo e premissas

- Aplicação React, executada no navegador e sem dependência de Flash.
- Instrumento analógico, com escala principal e nônio visíveis.
- Perfis mínimos de leitura:
  - métrico, com a resolução efetivamente declarada pela interface;
  - polegada, com a resolução efetivamente declarada pela interface.
- A terminologia e a geometria precisam concordar. Por exemplo, um perfil chamado `0,02 mm` deve avançar somente em múltiplos de `0,02 mm`; um perfil `0,001 in` deve avançar somente em múltiplos de `0,001 in`.
- Se a interface usar os nomes “centésimal” e “milésimal”, o valor numérico da resolução também deve permanecer visível para remover ambiguidade didática.
- A troca de unidade preserva a abertura física do instrumento e pode arredondar apenas para o passo representável no novo perfil.
- A medida deve ser calculada por um modelo determinístico, não inferida de texto formatado nem de pixels renderizados.

## 3. Oráculo matemático

Os testes devem comparar a aplicação com um oráculo independente e baseado em inteiros.

Para cada perfil, definir:

- `min`: menor abertura física;
- `max`: maior abertura física;
- `resolution`: menor incremento representável;
- `step`: índice inteiro da posição atual;
- `value = min + step * resolution`;
- `step = clamp(round((rawValue - min) / resolution), 0, maxStep)`.

Evitar igualdade direta entre números de ponto flutuante. Nos testes, converter para uma unidade inteira canônica, como micrômetros, ou comparar índices de passo. Para polegadas, a conversão física usa exatamente `1 in = 25,4 mm`.

Ao mudar de perfil:

```text
converted = physicalValueInMm / 25.4       // quando o destino é polegada
targetStep = round(converted / targetResolution)
targetValue = targetStep * targetResolution
```

O erro máximo aceitável após a quantização é metade da resolução de destino, exceto quando houver saturação em `min` ou `max`.

## 4. Matriz de testes

### 4.1 Modelo matemático e escalas

| ID | Cenário | Camada | Evidência/resultado esperado |
| --- | --- | --- | --- |
| MAT-001 | Posição inicial | Unidade | Valor igual a `min`, passo `0`, zero do nônio alinhado ao zero da escala principal |
| MAT-002 | Primeiro incremento | Unidade + visual | Valor igual a uma resolução; texto, `aria-valuenow` e deslocamento do cursor concordam |
| MAT-003 | Valor intermediário exato | Unidade | `value = step * resolution`, sem erro acumulado |
| MAT-004 | Último incremento | Unidade | Valor igual ao maior passo representável e não superior a `max` |
| MAT-005 | Entrada abaixo de `min` | Unidade | Saturação em `min` |
| MAT-006 | Entrada acima de `max` | Unidade | Saturação em `max` |
| MAT-007 | Arredondamento imediatamente antes, no e depois de meio passo | Unidade | Regra de arredondamento documentada e estável |
| MAT-008 | Cem ou mais incrementos e decrementos consecutivos | Unidade | Retorno exato à posição inicial, sem deriva de ponto flutuante |
| MAT-009 | Todos os passos de cada perfil | Propriedade | Todo valor é múltiplo da resolução e está dentro do intervalo |
| MAT-010 | Sequência pseudoaleatória reprodutível | Propriedade | Invariantes de faixa, passo e formatação nunca são violados; semente registrada |
| MAT-011 | Leitura do nônio | Unidade + visual | Divisão coincidente e escala principal recompõem exatamente o valor do modelo |
| MAT-012 | Casa decimal exibida | Unidade | Quantidade de casas e separador definidos pelo locale, sem dígitos falsamente precisos |
| MAT-013 | Troca mm → in | Unidade + E2E | Abertura física preservada; erro no máximo igual a meia resolução do perfil em polegadas |
| MAT-014 | Troca in → mm | Unidade + E2E | Abertura física preservada; erro no máximo igual a meia resolução do perfil métrico |
| MAT-015 | Ciclo repetido mm ↔ in | Unidade | Sem deriva além da quantização explicitamente permitida; fonte física canônica preservada |
| MAT-016 | Troca de resolução na mesma unidade | Unidade + E2E | Abertura preservada e valor ajustado ao passo válido mais próximo |
| MAT-017 | Limites após troca de perfil | Unidade | Valor saturado com segurança quando os perfis tiverem faixas diferentes |
| MAT-018 | Valores conhecidos de calibração | Unidade + E2E | Casos de referência conferidos manualmente por especialista em metrologia |

Os casos de calibração devem incluir, em cada perfil: zero, um passo, valor com parte inteira e parte do nônio, proximidade da mudança de unidade principal e valor máximo. As fixtures devem registrar `perfil`, `abertura física`, `divisão principal`, `divisão do nônio` e `texto esperado`.

### 4.2 Arrastar com mouse e toque

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| PTR-001 | `pointerdown` na parte móvel e movimento para a direita | Abertura cresce monotonicamente e respeita o passo atual |
| PTR-002 | Movimento para a esquerda | Abertura diminui monotonicamente |
| PTR-003 | Arraste além das duas extremidades | Valor permanece limitado a `min`/`max`; não há inversão nem overflow |
| PTR-004 | Ponteiro sai do instrumento durante o arraste | Captura do ponteiro mantém o movimento até `pointerup`/`pointercancel` |
| PTR-005 | Clique sem deslocamento | Não altera a medida inesperadamente |
| PTR-006 | Novo arraste iniciado em posição diferente | Não há salto inicial da mandíbula móvel |
| PTR-007 | Movimento fino menor que um passo | Política de snap é previsível; valor muda somente ao cruzar o limiar definido |
| PTR-008 | Movimento rápido com poucos eventos | Posição final corresponde à coordenada final e não à quantidade de eventos recebidos |
| PTR-009 | Toque de um dedo | Mesmo resultado funcional do mouse; a página não rola enquanto o gesto controla o instrumento |
| PTR-010 | `pointercancel`, perda de foco ou mudança de aba | Estado de arraste é encerrado; retorno não deixa o instrumento “preso” ao ponteiro |
| PTR-011 | Segundo toque durante um arraste | Ignorado ou tratado por regra documentada, sem salto ou alteração de unidade |
| PTR-012 | Dispositivo com DPR 1, 1,5 e 2 | Mesma abertura física para o mesmo deslocamento CSS |

### 4.3 Teclado

Contrato recomendado: setas movem um passo; `Shift` + seta move dez passos; `Home` vai ao mínimo; `End` vai ao máximo. Se outra convenção for escolhida, ela deve estar documentada na ajuda acessível e testada de forma equivalente.

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| KEY-001 | `ArrowRight`/`ArrowUp` | Soma exatamente um passo |
| KEY-002 | `ArrowLeft`/`ArrowDown` | Subtrai exatamente um passo |
| KEY-003 | Modificador de passo maior | Soma/subtrai o múltiplo documentado e respeita limites |
| KEY-004 | `Home`/`End` | Vai para mínimo/máximo |
| KEY-005 | Tecla mantida | Repetição permanece controlável e sem deriva |
| KEY-006 | Limite inferior/superior | Teclas não ultrapassam a faixa |
| KEY-007 | Foco | Controle apresenta indicador visível em todos os temas/estados |
| KEY-008 | Troca de perfil seguida de seta | Incremento usa imediatamente a nova resolução |

### 4.4 Ocultar e revelar a medida

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| EYE-001 | Estado inicial | Estado definido pelo produto e refletido em texto/ícone acessível |
| EYE-002 | Acionar o botão “ocultar medida” | Valor deixa de aparecer no mostrador e em descrições acessíveis anunciadas |
| EYE-003 | Manipular instrumento com resposta oculta | Geometria continua atualizando; resposta numérica continua oculta |
| EYE-004 | Trocar unidade/resolução com resposta oculta | Resposta não pisca durante re-renderização e permanece oculta |
| EYE-005 | Revelar | Valor atual, não o valor antigo, aparece imediatamente |
| EYE-006 | Teclado `Enter` e `Space` | Alterna exatamente uma vez por ativação |
| EYE-007 | Nome e estado acessíveis | Nome descreve a próxima ação; `aria-pressed` ou estado equivalente é coerente |
| EYE-008 | Ícone indisponível ou CSS desligado | Ainda existe texto/nome acessível que comunica a ação |
| EYE-009 | Região viva | Mudanças visíveis são anunciadas sem repetição excessiva; valor oculto não é anunciado |

Não é necessário tratar o valor como segredo de segurança no HTML, mas ele não deve ficar exposto visualmente, em texto selecionável destinado ao usuário ou na árvore de acessibilidade enquanto a resposta estiver oculta.

### 4.5 Unidade, resolução e controles

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| CTL-001 | Selecionar mm | Escala, unidade, resolução e mostrador ficam coerentes |
| CTL-002 | Selecionar polegada | Escala, unidade, resolução e mostrador ficam coerentes |
| CTL-003 | Alternar resolução | Nônio é redesenhado de acordo com o novo perfil; leitura não usa divisões do perfil anterior |
| CTL-004 | Navegação rápida entre opções | Última opção confirmada vence; nenhum estado misto |
| CTL-005 | Rótulos | Nome técnico e resolução numérica estão disponíveis sem depender de cor |
| CTL-006 | Persistência durante a sessão | Política escolhida é consistente ao redimensionar ou entrar/sair de tela cheia |

### 4.6 Tela cheia

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| FUL-001 | Entrar em tela cheia por clique | Elemento correto ocupa a tela; controles essenciais e instrumento permanecem visíveis |
| FUL-002 | Sair pelo botão da interface | Estado do botão e layout retornam ao normal |
| FUL-003 | Sair com `Esc` do navegador | Evento `fullscreenchange` sincroniza a interface |
| FUL-004 | API de tela cheia indisponível ou negada | Falha tratada sem exceção; controle é ocultado/desabilitado ou informa indisponibilidade |
| FUL-005 | Ocultar/revelar e manipular em tela cheia | Funções mantêm comportamento e foco |
| FUL-006 | Orientação ou viewport muda em tela cheia | Instrumento se reajusta sem alterar a medida |

### 4.7 Responsividade e projeção

Executar pelo menos em `320×568`, `375×667`, `768×1024`, `1024×768`, `1366×768`, `1440×900` e `1920×1080`, além de zoom do navegador em 200%.

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| RSP-001 | Menor viewport suportado | Sem rolagem horizontal da página; controles alcançáveis e instrumento legível |
| RSP-002 | Retrato e paisagem | Mudança de layout não altera a medida nem o estado oculto |
| RSP-003 | Projetor 1024×768 | Leitura e controles principais legíveis a distância; instrumento é o protagonista |
| RSP-004 | Full HD | Escala não fica excessivamente pequena nem dispersa |
| RSP-005 | Zoom 200% | Conteúdo reflui sem perda de operação ou sobreposição (WCAG 1.4.10) |
| RSP-006 | Texto ampliado a 200% | Rótulos não são cortados e o valor não invade controles |
| RSP-007 | Barra do navegador móvel variando de altura | Elementos não ficam inacessíveis por uso incorreto de `100vh` |
| RSP-008 | Área segura móvel | Controles respeitam `safe-area-inset-*` quando aplicável |

### 4.8 Acessibilidade WCAG 2.2 AA

| ID | Critério principal | Verificação |
| --- | --- | --- |
| A11Y-001 | 1.1.1 Conteúdo não textual | Ícones têm nome; desenho decorativo é ignorado; instrumento possui descrição equivalente |
| A11Y-002 | 1.3.1/1.3.2 Estrutura e ordem | Cabeçalhos, grupos, rótulos e ordem de leitura são semânticos |
| A11Y-003 | 1.4.1 Uso de cor | Unidade, seleção, foco e estado oculto não dependem somente de cor |
| A11Y-004 | 1.4.3 Contraste | Texto normal ≥ 4,5:1; texto grande ≥ 3:1 |
| A11Y-005 | 1.4.11 Contraste não textual | Controles, foco e marcas essenciais ≥ 3:1 contra cores adjacentes |
| A11Y-006 | 2.1.1 Teclado | Todas as funções disponíveis sem mouse |
| A11Y-007 | 2.1.2 Sem armadilha | Foco entra e sai de todos os controles normalmente |
| A11Y-008 | 2.4.3/2.4.7/2.4.11 Foco | Ordem lógica, foco visível e não encoberto |
| A11Y-009 | 2.5.1 Gestos | Arraste possui alternativa por teclado ou controles simples |
| A11Y-010 | 2.5.2 Cancelamento | Ação não dispara indevidamente no `pointerdown`; cancelamento é possível |
| A11Y-011 | 2.5.7 Movimento de arraste | Toda operação de arraste possui alternativa sem arrastar |
| A11Y-012 | 2.5.8 Tamanho do alvo | Mínimo WCAG de 24×24 CSS px; alvo recomendado do produto ≥ 44×44 px |
| A11Y-013 | 3.2.1/3.2.2 Previsibilidade | Foco ou seleção não muda unidade/tela cheia sem ativação explícita |
| A11Y-014 | 3.3.2 Rótulos | Unidade, resolução, visibilidade e tela cheia têm rótulos persistentes ou nomes inequívocos |
| A11Y-015 | 4.1.2 Nome, função e valor | Controle do paquímetro expõe papel, faixa, valor e unidade coerentes |
| A11Y-016 | Leitor de tela | Fluxo manual com NVDA + Firefox/Chrome e VoiceOver + Safari móvel |
| A11Y-017 | Daltonismo/projetor | Simulação não remove distinções essenciais; revisão em contraste reduzido |

A varredura automatizada com axe é obrigatória, mas não substitui navegação manual por teclado, leitor de tela, zoom e inspeção visual.

### 4.9 Movimento reduzido

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| MOT-001 | `prefers-reduced-motion: reduce` | Transições não essenciais são removidas ou praticamente instantâneas |
| MOT-002 | Arraste com movimento reduzido | Posição acompanha a entrada diretamente, sem mola, inércia ou parallax |
| MOT-003 | Ocultar/revelar | Nenhum piscar, zoom ou animação que atrase a resposta |
| MOT-004 | Alteração em tempo de execução | Preferência passa a valer sem recarregar, se o navegador emitir mudança |

### 4.10 Regressão visual

Capturas determinísticas devem cobrir:

- cada perfil de unidade/resolução em zero, valor intermediário conhecido e máximo;
- resposta visível e oculta;
- foco em cada controle principal;
- desktop, projetor, tablet e celular;
- modo normal e tela cheia simulada;
- movimento normal e reduzido;
- textos longos e locale `pt-BR`;
- estados de API de tela cheia disponível e indisponível.

As máscaras visuais só podem cobrir conteúdo genuinamente não determinístico. Escala, nônio, mandíbulas, leitura, logotipo `Cabalero_Automações` e controles nunca devem ser mascarados. Uma diferença visual aceita precisa de revisão humana e atualização explícita do baseline.

## 5. Compatibilidade mínima

- Chromium atual: automação completa e regressão visual de referência.
- Firefox atual: fluxo crítico e acessibilidade.
- WebKit atual: fluxo crítico, toque emulado e tela cheia conforme suporte.
- Chrome/Android e Safari/iOS reais: rodada manual antes da versão pública.

O suporte exato deve ser registrado na política do produto; “atual” no CI significa a versão fixada pelo lockfile do harness.

## 6. Critérios de aceite da primeira versão

A versão está apta para demonstração quando:

1. todos os testes unitários do modelo e conversão passam em 100% dos perfis;
2. nenhuma leitura conhecida diverge do oráculo matemático;
3. os fluxos críticos passam em Chromium, Firefox e WebKit;
4. não há violação axe de impacto crítico ou sério;
5. teclado, toque, resposta oculta, movimento reduzido e tela cheia foram verificados;
6. regressões visuais foram aprovadas conscientemente;
7. `lint` e `build` passam em ambiente limpo;
8. um especialista ou responsável pelo conteúdo aprova os casos de calibração metrológica.

## 7. Riscos que exigem teste exploratório

- confundir “escala”, “resolução” e “unidade” na interface;
- marcas visualmente alinhadas com valor matemático diferente;
- arredondamento de polegada provocando deriva em alternâncias sucessivas;
- arraste dependente da largura do viewport alterar a sensibilidade de forma brusca;
- valor aparecer por um frame ao trocar perfil enquanto está oculto;
- controles sobrepostos às marcas em projetores ou celulares;
- `pointercancel` deixar estado global preso;
- anúncio excessivo da região viva durante arraste contínuo.

