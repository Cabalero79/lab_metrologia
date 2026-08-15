---
target: CaliperWorkbench atual comparado a Exemplos/aberto.png e Exemplos/fechado.png
total_score: 28
p0_count: 0
p1_count: 3
timestamp: 2026-08-15T05-44-59Z
slug: app-components-caliperworkbench-tsx
---
# Auditoria geométrica do paquímetro atual contra `Exemplos/aberto.png` e `Exemplos/fechado.png`

## Design Health Score

| # | Heurística | Nota | Questão principal |
|---|---|---:|---|
| 1 | Visibilidade do estado | 4 | Leitura e resolução são claras. |
| 2 | Correspondência com o mundo real | 2 | Silhueta, profundidade e degrau ainda não formam um mecanismo fisicamente completo. |
| 3 | Controle e liberdade | 4 | Mouse, toque, teclado, fechar, lupa e tela cheia existem. |
| 4 | Consistência e padrões | 2 | A geometria muda de proporção e pode se autointersectar conforme o viewport. |
| 5 | Prevenção de erros | 1 | Canvas abaixo de 268 px permite mandíbula inferior invertida sem aviso. |
| 6 | Reconhecimento em vez de memória | 4 | Comandos e estado ficam visíveis. |
| 7 | Flexibilidade e eficiência | 4 | Há múltiplas formas equivalentes de operação. |
| 8 | Estética e minimalismo | 2 | Cauda de escala, calcanhar grosso e cursor variável enfraquecem a leitura técnica. |
| 9 | Recuperação de erros | 2 | Fechar restaura zero, mas a deformação responsiva é silenciosa. |
| 10 | Ajuda e documentação | 3 | A interface orienta a interação, mas não identifica os quatro modos físicos de medição. |
| **Total** |  | **28/40** | **Bom limite inferior; geometria precisa de correção estrutural.** |

## Veredito de anti-padrões

O problema não é decoração genérica nem aparência de interface gerada por IA. O detector determinístico permaneceu limpo (`[]`, exit 0). A falha é mais profunda e específica de canvas: proporções mecânicas são calculadas por limites independentes em X e Y, o que o detector não interpreta.

Não houve overlay confiável: a automação disponível não ofereceu injeção mutável. A evidência foi obtida por navegador real, screenshots, DOM, fórmulas e análise raster.

## Impressão geral

O modelo metrológico horizontal é forte: contato, zero, quantização e costura são derivados do mesmo estado exato. A silhueta, porém, não usa uma unidade técnica uniforme e por isso muda com a razão do canvas. A maior oportunidade é separar coordenadas mecânicas invariáveis da transformação responsiva final.

## O que funciona

- Faces externas e zeros se deslocam pela mesma quantidade, com erro algébrico nulo.
- A mandíbula inferior fixa e a móvel usam um único `Path2D` espelhado.
- A costura métrica e a de polegadas preservam todas as divisões e o alinhamento exato.
- Aberto e fechado das referências confirmam um cursor rígido: parte fixa `(+6,+108) px`, parte móvel `(-411,+108) px`, curso relativo `417 px`.

## Medições de referência

Com `B = 156 ±1 px`, altura da haste principal:

| Relação | Referência |
|---|---:|
| ponta superior | `1,365B ±0,01` |
| patamar superior | `0,346B ±0,01` |
| início da perna inferior | `0,481B ±0,01` abaixo da haste |
| fundo da perna inferior | `2,686B ±0,02` abaixo da haste |
| ombro inferior | `0,885B ±0,01` |
| calcanhar inferior | `0,378B ±0,01` |
| face externa → zero | `0,577B ±0,01` |
| placa superior | `3,609B × 0,532B` |
| nônio + trilho | `3,635B × 0,481B` |
| parafuso na placa | `50,1% ±0,5%` |
| rolete na placa | `87,1% ±0,5%`; raio `0,429B` |
| fim de 150 mm → fim da haste | `0,256B ±0,02` |

## Diferenças objetivas

| Elemento | Atual | Referência | Efeito |
|---|---:|---:|---|
| início inferior | `+0,25B` | `+0,47–0,48B` | ombro começa 48% cedo demais |
| extensão inferior | variável/cortada | `2,69B` | pode encurtar ou inverter |
| calcanhar | cerca de `0,70B` | `0,38B` | aproximadamente 86% grosso demais |
| contato→zero no canvas vivo | `0,79B` | `0,58B` | cerca de 36% maior |
| placa superior 0,02 | até `5,07B` | `3,61B` | largura depende do viewport |
| cauda depois de 150 mm | `3,5–4,6B` | `0,26B` | instrumento parece acima de 200 mm |
| profundidade no zero | `6–16 px` | `≤0,02B` | haste não parece recolhida |
| pastilha inferior | tira de 7 px por toda face | `0,337B × 0,628B` na ponta | barra escura grossa no zero |

Em navegador real, a mandíbula inverte quando `jawBottom < contactTopY`:

- canvas desktop `1211,47×389,70`: não inverte, mas fica truncada;
- canvas `842×228,06`: inverte;
- canvas `320×244,78`: inverte e o parafuso é cortado em 150 mm;
- altura mínima algébrica para não inverter: `267,5 px`;
- altura necessária para a perna completa com os mínimos atuais: `454,7 px`.

## Inconsistências das próprias referências

- Zeros fecham exatamente, mas as faces internas superiores deixam residual de `4–5 px` após compensar o curso.
- `fechado.png` possui um vão/recorte raster de `21–23 px` na região superior dos mordentes externos; não deve substituir a coincidência matemática do app.
- O nônio raster parece usar passo próximo de `1,96×` o passo principal. Isso é compatível com um nônio estendido de 0,05 mm (`20` divisões em `39 mm`), enquanto o app usa a construção compacta (`20` divisões em `19 mm`). Ambas podem ser fisicamente válidas; a escolha deve ser explícita e validada pelo professor, não inferida apenas pela aparência.
- O comprimento aberto da haste de profundidade está cortado pela borda e não é mensurável integralmente.

## Problemas prioritários

### [P1] Sistema geométrico não uniforme

**Por que importa:** o mesmo instrumento muda de proporção por viewport e pode gerar `Path2D` autointersectado.

**Correção:** definir toda a mecânica em uma única unidade `B`/escala técnica e aplicar uma transformação uniforme ao canvas. Textos e espessuras podem ter clamps; peças mecânicas não.

**Comando sugerido:** `$impeccable adapt`.

### [P1] Cursor deixa de ser rígido no fim do curso

**Por que importa:** clamps independentes em `sliderRight`, `screwX` e `rollerX` alteram distâncias internas perto de 150 mm.

**Correção:** garantir `Pi(valor) = Pi(0) + (delta,0)` para mandíbula, placas, nônio, parafuso e rolete. A reserva visual deve ficar fora da viga graduada.

**Comando sugerido:** `$impeccable harden`.

### [P1] Quatro modos físicos incompletos

**Por que importa:** a haste de profundidade não acompanha a abertura e não há datums próprios para degrau.

**Correção:** expor profundidade igual ao curso e criar superfícies fixa/móvel de degrau cuja separação também seja `delta`.

**Comando sugerido:** `$impeccable polish`.

### [P2] Anatomia das hastes inferiores

**Por que importa:** ombro alto, calcanhar espesso e tiras escuras integrais ensinam uma construção diferente da referência.

**Correção:** início `0,46–0,50B`, fundo `2,65–2,70B`, ombro `0,86–0,90B`, calcanhar `0,37–0,42B`, pastilhas apenas nas pontas e costura fechada de 1–2 px.

**Comando sugerido:** `$impeccable polish`.

### [P2] Capacidade visual maior que 150 mm

**Por que importa:** `scaleLengthMm = 202` deixa 52 mm técnicos sem graduação depois de 150 mm.

**Correção:** separar capacidade graduada, comprimento da viga e área de overhang do cursor, sem comprimir a escala principal.

**Comando sugerido:** `$impeccable shape`.

## Personas

**Instrutor projetando em sala:** percebe imediatamente a silhueta curta/grossa e a cauda equivalente a mais de 50 mm; perde confiança na representação mesmo quando a leitura está correta.

**Estudante iniciante:** pode aprender superfícies de contato erradas porque as faixas escuras cobrem a face inteira e a haste de profundidade não responde ao movimento.

**Usuário móvel dependente de acessibilidade:** em reflow ou WebView sem `pointer: coarse`, encontra a mandíbula invertida e um alvo móvel que acompanha a forma incorreta.

## Observações menores

- Ponta e patamar superiores atuais estão próximos das referências.
- A posição do rolete está próxima; seu raio atual é aproximadamente 16% menor.
- O parafuso deve ser centralizado pela caixa completa da placa, não por trecho contado a partir do zero.
- A marca Cabalero precisa de zona neutra própria após a redução de face→zero.

## Questões

1. O nônio de `0,05 mm` deve seguir a construção compacta atual (`19 mm`) ou a construção estendida sugerida pela referência (`39 mm`)?
2. Para manter o desktop sem rolagem, a prioridade é reduzir uniformemente o instrumento dentro do canvas ou compactar cabeçalho/controles para reservar cerca de `455 px` de altura ao desenho?
3. A primeira correção deve incluir os quatro modos físicos, ou limitar-se a silhueta inferior, cursor rígido e escala de 150 mm?
