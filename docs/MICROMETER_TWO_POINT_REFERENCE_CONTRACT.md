# Contrato de reconstrução — micrômetro interno de duas pontas

Este documento aplica a skill `mechanical-reference-reconstruction` à referência aprovada pelo responsável do produto em 24/08/2026. Ele governa a estrutura mecânica visível; `PRODUCT.md` continua governando o produto e o modelo inteiro em `lib/internal-micrometer.ts` governa a leitura.

## 1. Identidade da referência

| Campo | Evidência |
| --- | --- |
| Família | Micrômetro interno analógico tipo paquímetro, Série 145 |
| Variante adotada | Padrão visual do `145-185 / IMP-30`, pois a capacidade começa em 5 mm |
| Tipo de contato | Duas pontas cilíndricas tipo pino; não usar as bigornas curvas do `145-186` |
| Princípio representado | Distância horizontal entre as faces externas das duas pontas |
| Perfil didático preservado | `5,00–15,00 mm`, `0,01 mm`, passo de `0,50 mm` |
| Pose canônica da implementação | Estado inicial `7,36 mm`; a fotografia não informa sua leitura exata |
| Qualidade da vista | Catálogo quase ortográfico, mas rasterizado e sem cotas axiais completas |

Fonte visual primária: `Photo 1.jpg` fornecida pelo usuário. Recorte analisado no arquivo de `576 × 1280 px`: `x=10`, `y=330`, `w=560`, `h=220`.

Fonte visual secundária: `Photo 2.jpg` fornecida pelo usuário em 24/08/2026. A vista é perspectiva, com sombra e instrumento apoiado sobre papel, portanto não substitui a vista quase ortográfica do catálogo. Ela confirma com maior nitidez três relações: as hastes cilíndricas são paralelas, as faces internas sob as hastes seguem verticais e a numeração ocupa a bainha desde o cabeçote até a costura do tambor.

Fonte dimensional auxiliar oficial: desenho externo `145-185`, que estabelece ponta `Ø2 mm`, trecho exposto de `4,5 mm`, altura do cabeçote de `27,5 mm` e capacidade mínima de `5 mm`.

## 2. Inventário e topologia observável

As caixas abaixo são normalizadas pelo envelope mecânico apertado da fotografia superior, aproximadamente `x=10..534` e `y=338..541`.

| Ordem axial | Parte | Caixa normalizada aproximada `(x,y,w,h)` | Propriedade |
| ---: | --- | --- | --- |
| 1 | Tampa/cilindro esquerdo curto | `(0,00; 0,43; 0,08; 0,29)` | acompanha a mandíbula esquerda |
| 2 | Mandíbula esquerda assimétrica | `(0,07; 0,00; 0,09; 0,91)` | móvel; pino deslocado para o vão |
| 3 | Parafuso de trava inferior | `(0,08; 0,89; 0,08; 0,11)` | acompanha o carro esquerdo |
| 4 | Vão e haste exposta | `(0,16; 0,45; 0,04; 0,28)` | espaço negativo obrigatório |
| 5 | Mandíbula direita assimétrica | `(0,20; 0,00; 0,09; 0,87)` | fixa; pino deslocado para o vão |
| 6 | Bainha graduada | `(0,29; 0,45; 0,19; 0,28)` | fixa à mandíbula direita |
| 7 | Cone e colar graduado do tambor | `(0,48; 0,35; 0,21; 0,43)` | móvel e rotativo |
| 8 | Empunhadura recartilhada | `(0,69; 0,35; 0,18; 0,43)` | móvel e rotativa; separada do colar |
| 9 | Pescoço/anéis da catraca | `(0,87; 0,45; 0,04; 0,27)` | acompanha o tambor |
| 10 | Catraca terminal recartilhada | `(0,91; 0,42; 0,09; 0,33)` | último volume axial |

Partes que não podem ser fundidas: colar graduado e empunhadura; empunhadura e catraca; cilindro esquerdo e bainha; as duas mandíbulas.

## 3. Âncoras estruturais

| Âncora | Valor/evidência |
| --- | --- |
| Eixo principal | aproximadamente `y=0,61` do envelope mecânico |
| Extremos axiais | cilindro esquerdo `x=0`; catraca `x=1` |
| Centro da mandíbula esquerda | aproximadamente `x=0,12` na pose fotográfica |
| Centro da mandíbula direita | aproximadamente `x=0,24` |
| Início da bainha | aproximadamente `x=0,29` |
| Costura bainha/tambor | aproximadamente `x=0,48` |
| Início da recartilha principal | aproximadamente `x=0,69` |
| Início da catraca | aproximadamente `x=0,91` |
| Ponta | `Ø2 mm`; altura exposta `4,5 mm` |
| Cabeçote | altura total `27,5 mm` no desenho oficial |
| Vão mínimo nominal | `5 mm` entre faces externas de medição |
| Paralelismo no cabeçote | bordas internas das hastes e faces internas das mandíbulas compartilham a mesma vertical |
| Início útil da escala | primeira numeração fica junto ao cabeçote; não reservar trecho cilíndrico vazio antes das marcas |
| Base das mandíbulas | termina aproximadamente no envelope vertical do corpo cilíndrico; a trava é o único volume que desce além dele |

A forma das mandíbulas é assimétrica: a face interna junto ao vão é quase vertical, o pino fica deslocado em direção ao vão e o ombro externo se alarga em direção ao corpo. Uma forma de “vaso” simétrica não satisfaz a referência.

## 4. Mapa cinemático adotado

| Parte | Translação ao aumentar a leitura | Rotação | Datum preservado |
| --- | --- | --- | --- |
| Cilindro, mandíbula esquerda e trava | para a esquerda | nenhuma | face externa do pino esquerdo |
| Mandíbula direita e bainha | fixa | nenhuma | face externa do pino direito e linha da escala |
| Haste exposta | aumenta entre as mandíbulas | nenhuma | eixo principal |
| Colar, empunhadura e catraca | para a esquerda | fase do tambor | costura com a bainha |
| Cota didática | acompanha as duas faces | nenhuma | leitura inteira exata |

O estado inteiro em centésimos deve dirigir simultaneamente o vão, o curso axial, a fase circular, a cota e o valor acessível.

## 5. Incertezas e limites

- A foto não revela a leitura exata da pose; `7,36 mm` é a pose canônica do produto, não uma afirmação sobre a fotografia.
- O desenho oficial fornece cotas do cabeçote, mas não todas as dimensões axiais do conjunto completo.
- A segunda foto sofre perspectiva e sombras; dela são adotados paralelismo e ordem de oclusão, não razões axiais absolutas.
- Reflexos, recartilha e marca do fabricante são aparência, não datums geométricos.
- A marca Cabalero substitui identificação proprietária; isso é uma divergência intencional.
- O produto continua didático e não afirma força constante, calibração, exatidão certificada ou mecanismo interno invisível.

## 6. Matriz de aceite desta rodada

- [x] Pontas cilíndricas e mandíbulas assimétricas correspondem ao `145-185`.
- [x] Cilindro esquerdo é curto e acompanha a mandíbula móvel.
- [x] Vão/haste permanece visível entre as mandíbulas.
- [x] Bainha começa imediatamente após a mandíbula direita.
- [x] Colar graduado, empunhadura, pescoço e catraca são volumes distintos.
- [x] Pose canônica gera quadro de referência/render/sobreposição/diferença.
- [x] Limites `5,00` e `15,00 mm` preservam topologia e graduações.
- [x] Arraste, toque, teclado e botões alteram o mesmo estado.
- [x] Desktop, celular horizontal e 320 px preservam a mesma silhueta.
- [ ] Responsável do produto recebe preview concreto para aceite visual.

## 7. Refinamento com a segunda referência

- [x] Abertura nominal de `5 mm` e pontas de `Ø2 mm` usam a mesma escala geométrica.
- [x] As duas hastes e as faces internas das mandíbulas permanecem paralelas em todo o curso.
- [x] As duas barras expostas ocupam todo o vão negativo entre as mandíbulas.
- [x] A base das mandíbulas termina junto ao envelope do corpo cilíndrico.
- [x] A numeração começa junto ao cabeçote e ocupa a extensão útil da bainha.
- [x] Em `7,36 mm`, os rótulos `15`, `13`, `11` e `9` permanecem visíveis antes do tambor.
- [x] Os estados `5,00`, `7,36` e `15,00 mm` foram inspecionados em navegador real.
- [x] A silhueta foi verificada em desktop, `844 × 390` e `320 × 700` sem rolagem horizontal.
- [ ] Responsável do produto aprova visualmente este refinamento.

## 8. Aprovação com ressalva — legibilidade da escala

O responsável do produto aprovou a estrutura mecânica em 24/08/2026, com duas condições antes do aceite sem ressalvas:

- a numeração completa deve permanecer disponível para professor e aluno durante todo o curso;
- o afastamento entre a orelha fixa e o extremo `15` da escala, que fica próximo
  à orelha, deve ser preservado.

Correção após validação cinemática: não existe uma segunda escala sobreposta. A única escala longitudinal pertence à bainha fixa, fica centralizada na metade superior do cilindro e é recortada pela costura do tambor. A borda visual do tambor e o limite matemático da bainha compartilham exatamente o mesmo datum, sem sobreposição antecipada. Assim, as graduações já percorridas são ocultadas pelo tambor como no instrumento físico, enquanto os números do trecho exposto permanecem legíveis. O modo de ampliação atende à leitura em telas estreitas sem alterar essa oclusão. O afastamento entre a orelha e o extremo `15` permanece como datum explícito de `0,18 × B`.

- [x] Existe somente a escala física da bainha, sem duplicação sobre o tambor.
- [x] Os números do trecho exposto permanecem centralizados e legíveis.
- [x] A costura do tambor determina exatamente o limite visível da escala.
- [x] Graduações e números circulares são recortados pelo envelope do tambor.
- [x] Afastamento junto à orelha é invariável em toda a matriz responsiva.
- [ ] Responsável do produto aprova a solução didática sem ressalvas.
