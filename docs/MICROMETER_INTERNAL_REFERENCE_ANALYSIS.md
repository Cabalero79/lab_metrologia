# Análise clean-room — micrômetro interno centesimal (imicro)

## 1. Objetivo e limites

Este documento registra o comportamento observável e o modelo matemático rederivado do arquivo local `micrometro-interno-milimetro-centesimal-imicro.exe`. A finalidade é orientar uma implementação web original da Cabalero_Automações.

Não entram no produto nem no repositório:

- o executável, o SWF ou o ActionScript descompilado;
- formas, PNGs, fontes ou vetores exportados;
- a malha de recartilha, textos promocionais ou a composição proprietária;
- links, downloads, fullscreen automático ou qualquer recurso remoto da referência.

A referência é informativa. O modelo metrológico novo será governado por fixtures independentes, documentação técnica e aprovação humana de especialista.

### Referência visual aprovada posteriormente

Em 24/08/2026, o responsável do produto forneceu uma página de catálogo da família analógica Série 145 e pediu que a representação adotasse exatamente esse padrão mecânico. A capacidade iniciada em 5 mm corresponde ao modelo de duas pontas cilíndricas finas; as capacidades a partir de 25 mm usam mandíbulas com bigornas curvas. Essa decisão substitui a silhueta de três contatos inferida do Flash, mas preserva o modelo inteiro de leitura `5,00–15,00 mm`, passo de `0,50 mm` e resolução de `0,01 mm`.

## 2. Proveniência e método

| Item | Evidência |
| --- | --- |
| Executável local | `1.589.229` bytes; SHA-256 `4F528A8C0C86ADD91567F157D803B76FDD412DEE43BE1CB80EB8C69C4FDEFBC1` |
| Projetor | Macromedia Flash Player `8.0.22.0`; o `.exe` não foi executado |
| SWF incorporado | `8.165` bytes; SHA-256 `D27A7D26F7C1C9910746EC9B2A382E29965A288D9A8E87F172AD4938BB5241D7` |
| Formato | SWF 8, ZLIB, ActionScript 2/AVM1 |
| Palco | `770 × 684 px`, três frames, `120 fps` |
| Ferramenta | JPEXS FFDec `26.2.1`; pacote SHA-256 `0333B56998A55BD83F4E0DEB678A811FCDC45607582B4F5DD438309C8C3AD5CE` |
| Técnica | extração estática do payload anexado ao projetor, exportação temporária de tags e inspeção de scripts/frames |

Os três frames estáticos exportados são visualmente idênticos. A diferença entre eles está nos manipuladores de interação; por isso, um PNG isolado não representa todo o comportamento em execução.

## 3. Estrutura da tela legada

A raiz mostra duas projeções do mesmo símbolo e do mesmo estado:

- `micrometroMini_mc`: vista geral a aproximadamente `40,3%`, no topo;
- `micrometro_mc`: vista ampliada em escala integral, recortada à direita e embaixo;
- crédito do autor no rodapé, configurado como link HTTP externo.

O conceito válido é “contexto geral + detalhe da escala”. O novo produto pode reaproveitar esse modelo mental, mas não a composição, os ativos ou a alternância por hover.

## 4. Inventário de objetos visíveis

### 4.1 Vista geral superior

| # | Objeto | Papel visual/funcional observado |
| --- | --- | --- |
| 1 | Fundo branco | palco sem contêiner ou hierarquia semântica |
| 2 | Duas setas opostas | comunicam o aumento do diâmetro interno nos contatos |
| 3 | Dois contatos cilíndricos estreitos | representam dois dos contatos vistos em perfil; o terceiro contato do imicro não é explicitado |
| 4 | Linha central dos contatos | separa contato fixo e móvel na projeção |
| 5 | Dois pescoços curvos espelhados | ligam os contatos ao cabeçote de medição |
| 6 | Degrau horizontal do cabeçote | transição entre pescoços e corpo |
| 7 | Dois blocos inferiores | corpo dividido entre lado fixo e lado móvel |
| 8 | Ressalto lateral | detalhe mecânico sem função interativa identificada |
| 9 | Plaqueta `5–15 mm / 0.01 mm` | declara capacidade nominal e resolução |
| 10 | Bainha | corpo fixo que recebe a escala axial |
| 11 | Linha de referência longitudinal | datum para leitura do tambor |
| 12 | Traços axiais acima/abaixo da linha | marcas de milímetro e meio milímetro |
| 13 | Números `15`, `10`, `5` | escala absoluta em ordem decrescente da esquerda para a direita |
| 14 | Transição cônica | liga bainha e tambor sem degrau abrupto |
| 15 | Escala circular do tambor | 50 divisões por volta |
| 16 | Números `40`, `45`, `0`, `5`, `10` | amostra do ciclo graduado ao redor do tambor |
| 17 | Corpo cilíndrico do tambor | acompanha a translação axial do fuso |
| 18 | Recartilha cruzada | affordance visual de manuseio |
| 19 | Anéis escuros laterais | delimitam a recartilha |
| 20 | Botão/catraca terminal | elemento terminal recartilhado |
| 21 | Instrução vermelha | informa arraste horizontal na vista pequena |

Há ainda um campo de valor e uma área de interação definidos no SWF, mas o valor é ocultado pelo script e a área não possui representação semântica.

### 4.2 Vista ampliada inferior

| # | Objeto | Diferença em relação à vista geral |
| --- | --- | --- |
| 1 | Contatos ampliados | exibem gradiente metálico e separação central; as setas deveriam ser ocultadas pelo script |
| 2 | Pescoços e cabeçote | revelam melhor a simetria e as divisões estruturais |
| 3 | Plaqueta técnica | continua dentro do corpo e permanece muito pequena para acessibilidade |
| 4 | Bainha e linha de referência | passam a ser o principal datum da leitura |
| 5 | Escala axial `15–10–5` | revela traços de milímetro e meio milímetro com maior clareza |
| 6 | Cone do tambor | mostra faces superior e inferior inclinadas |
| 7 | Graduação circular | desloca verticalmente dentro de uma máscara |
| 8 | Recartilha | fica parcialmente fora do viewport à direita |
| 9 | Instrução | deveria mudar para “arraste na vertical”, mas o frame estático não executa essa troca |
| 10 | Crédito/link | ocupa o canto inferior esquerdo e abre nova janela no legado |

## 5. Funcionamento em tela

### 5.1 Estado e frames

1. O primeiro frame inicializa variáveis, força fullscreen e seleciona o modo fino.
2. O modo `milimetro` habilita arraste horizontal do tambor da vista pequena.
3. O modo `milesimo` habilita arraste vertical da recartilha da vista ampliada.
4. Passar o mouse sobre o tambor pequeno troca para o modo horizontal; sair retorna ao vertical.
5. Um listener global de mouse marca qualquer pressionamento como início potencial de gesto.

Essa troca implícita por hover não deve migrar. Ela não funciona de modo previsível por toque ou teclado e cria dois vocabulários de gesto para o mesmo estado.

### 5.2 Modelo legado rederivado

Constantes observadas:

```text
valor inicial interno = 4,500 mm
valor máximo interno  = 15,500 mm
curso total           = 11,000 mm
passo do fuso         = 0,500 mm por volta
divisões do tambor    = 50
resolução nominal     = 0,010 mm
projeção axial        = 12 px/mm na vista grande
```

O código primeiro arredonda o valor para milésimos:

```text
N = round(valorEmMm × 1000)
```

Depois mantém três casas no estado mecânico, mas monta a leitura usando somente décimos e centésimos. Para valores positivos, isso equivale a truncar o milésimo:

```text
leitura exibida = floor(N / 10) / 100
```

Consequência: existem dez posições internas distintas para uma mesma leitura exibida. Exemplo: `5,005 mm` permanece visualmente diferente de `5,000 mm`, mas ambos podem aparecer como `5,00 mm`.

A posição axial do tambor e do contato móvel usa o mesmo deslocamento de `12 px/mm`. A tira do tambor repete a cada `500` milésimos, correspondente a uma volta de `0,5 mm`:

```text
deslocamento axial = valorEmMm × 12 px/mm
deslocamento da tira = N mod 500
```

Na tira ampliada, `0,01 mm` ocupa aproximadamente `10 px`.

### 5.3 Arraste horizontal

- Atua na vista pequena.
- Um curso de `132 px` representa `11 mm`.
- Mover o tambor para a esquerda aumenta a leitura.
- Os limites enviados ao `startDrag` aparecem invertidos no legado, embora a fórmula posterior preserve o sentido esperado.
- O valor é calculado em relação à origem do gesto e redesenha as duas projeções.

### 5.4 Arraste vertical

- Atua em uma faixa invisível sobre a recartilha ampliada.
- Subir aumenta; descer diminui.
- A sensibilidade é `1000 px/mm`, ou `10 px` por `0,01 mm`.
- O intervalo do gesto é assimétrico: cerca de `+0,8 mm` ao subir e `−1,0 mm` ao descer.
- Ao soltar, a faixa de interação volta à origem, mas o estado conserva o milésimo oculto.

## 6. Inconsistências que não devem migrar

1. A plaqueta declara `5–15 mm`, mas o modelo permite `4,5–15,5 mm`.
2. A resolução declarada é `0,01 mm`, mas o estado trabalha em `0,001 mm` e trunca a saída.
3. O fullscreen é solicitado automaticamente.
4. O crédito abre um endereço HTTP externo em nova janela.
5. O modo de interação depende de hover e mouse global.
6. O desenho não oferece toque, teclado, foco, nome, função ou valor acessível.
7. A leitura calculada é escondida e não existe alternativa HTML anunciável.
8. Há polling contínuo a `120 fps`, mesmo sem mudança observável.
9. Textos pequenos, linhas cinza e vermelho sobre branco perdem legibilidade em celular e projetor.
10. A vista ampliada corta a instrução e parte do tambor.

Para a nova versão, a faixa nominal `5,00–15,00 mm` é a hipótese técnica recomendada. Ela precisa de aprovação explícita antes da geometria final; `4,5–15,5 mm` será tratado como defeito da referência, não como fixture.

## 7. Modelo original recomendado

Criar um módulo próprio, sem alterar o modelo completo do paquímetro:

```text
MICROMETER_TICKS_PER_MM = 100
MIN_TICKS               = 500
MAX_TICKS               = 1500
SPINDLE_PITCH_TICKS     = 50
THIMBLE_DIVISIONS       = 50
RESOLUTION_TICKS        = 1
```

Invariantes:

- um tick é exatamente `0,01 mm`;
- `passo do fuso = divisões do tambor × resolução`;
- a faixa contém `1001` leituras válidas;
- o curso contém exatamente `20` voltas;
- pixels, graus e posição do ponteiro nunca são estado de domínio.

Decomposição:

```text
bainhaTicks = floor(ticks / 50) × 50
divisãoTambor = ticks − bainhaTicks
leitura = bainhaTicks + divisãoTambor
```

Exemplo didático:

```text
7,36 mm = 7,00 mm na bainha + 36 × 0,01 mm no tambor
7,86 mm = 7,50 mm na bainha + 36 × 0,01 mm no tambor
```

O par evidencia o erro frequente de esquecer a marca de `0,5 mm`.

## 8. Fixture mínima independente

| ticks | leitura | bainha | tambor | ângulo do ciclo |
| ---: | --- | ---: | ---: | ---: |
| 500 | `5,00 mm` | 500 | 0 | `0°` |
| 501 | `5,01 mm` | 500 | 1 | `7,2°` |
| 524 | `5,24 mm` | 500 | 24 | `172,8°` |
| 525 | `5,25 mm` | 500 | 25 | `180°` |
| 549 | `5,49 mm` | 500 | 49 | `352,8°` |
| 550 | `5,50 mm` | 550 | 0 | `0°` |
| 599 | `5,99 mm` | 550 | 49 | `352,8°` |
| 600 | `6,00 mm` | 600 | 0 | `0°` |
| 736 | `7,36 mm` | 700 | 36 | `259,2°` |
| 786 | `7,86 mm` | 750 | 36 | `259,2°` |
| 999 | `9,99 mm` | 950 | 49 | `352,8°` |
| 1000 | `10,00 mm` | 1000 | 0 | `0°` |
| 1499 | `14,99 mm` | 1450 | 49 | `352,8°` |
| 1500 | `15,00 mm` | 1500 | 0 | `0°` |

Esses valores ainda precisam de revisão humana de metrologia antes de serem elevados a oráculo de release.

## 9. Referências externas de validação

- A página original do simulador descreve explicitamente o arraste horizontal na vista menor e o arraste vertical na maior: `https://www.stefanelli.eng.br/imicro-virtual-simulador-micrometro-interno/`.
- A Mitutoyo descreve a leitura de micrômetros internos como soma da bainha com o tambor e alerta que ajuste de referência e ponto de contato influenciam a medição real: `https://www2.mitutoyo.co.jp/eng/about-metrology/knowledge/inside-measurements/`.
- O catálogo oficial da Série 145 diferencia o modelo `145-185`, faixa `5–30 mm` e mandíbula tipo pino, dos modelos a partir de `25–50 mm`, com mandíbula tipo bigorna: `https://www2.mitutoyo.co.jp/eng/useful/catalog-2021/pdf/192.pdf`.

Essas páginas ajudam a identificar o modelo mental e os limites didáticos; não autorizam copiar seus ativos ou substituem a aprovação do especialista.

## 10. Decisão clean-room

O produto novo preservará somente ideias gerais do Flash:

- uma única medida exata projetada em vista geral e detalhe;
- leitura combinada de bainha e tambor;
- sentido de abertura interna coerente, agora projetado entre duas pontas horizontais;
- ajuste por ponteiro, toque e teclado;
- resposta ocultável para aula.

Geometria, paleta, tipografia, marca, controles, modelo, testes e textos serão originais e seguirão `PRODUCT.md`, `DESIGN.md` e o marco `entrega-satisfatoria-layout-v2`.
