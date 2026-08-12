# Guia de aprendizagem — paquímetro universal

## 1. Finalidade

Este guia organiza o uso do simulador em aula, em demonstrações projetadas e no estudo individual. O objetivo não é decorar uma sequência de cliques: é aprender a decompor a leitura de um paquímetro analógico em duas partes e justificar o resultado.

O simulador trabalha com cinco perfis:

| Perfil | Divisão da escala principal | Divisões do nônio | Resolução |
| --- | ---: | ---: | ---: |
| Métrico decimal | 1 mm | 10 | 0,1 mm |
| Métrico de 0,05 mm | 1 mm | 20 | 0,05 mm |
| Métrico centesimal | 1 mm | 50 | 0,02 mm |
| Polegada fracionária | 1/16″ | 8 | 1/128″ |
| Polegada milesimal | 0,025″ (1/40″) | 25 | 0,001″ |

Os números desta tabela correspondem aos perfis declarados em `lib/caliper.ts`. Na interface e em aula, o nome tradicional deve aparecer sempre acompanhado da resolução. “Centesimal” pode se referir genericamente a centésimos; dizer **0,02 mm** elimina a ambiguidade. De modo semelhante, “milesimal” deve aparecer como **0,001″**.

## 2. Ideia fundamental do nônio

Toda leitura pode ser organizada assim:

```text
leitura = valor da escala principal + complemento do nônio
complemento do nônio = índice da linha coincidente × resolução
```

O procedimento é sempre o mesmo:

1. Localize o zero do nônio, que se move com o cursor.
2. Na escala principal, leia a última divisão completamente ultrapassada pelo zero do nônio.
3. Encontre a linha do nônio que coincide melhor com uma linha da escala principal.
4. Multiplique o índice dessa linha pela resolução do perfil.
5. Some as duas parcelas, mantenha a unidade e confira se a quantidade de casas ou o denominador são compatíveis com a resolução.

Quando a linha zero do nônio coincide, o complemento é zero. Em um instrumento sem erro de zero, a leitura com as mandíbulas fechadas também deve ser zero.

## 3. Sequência de aula sugerida

### Encontro 1 — reconhecer o instrumento

**Meta:** distinguir escala principal, nônio, cursor, mandíbulas externas, mandíbulas internas, haste de profundidade e faces de ressalto.

1. Apresente o paquímetro fechado e peça aos estudantes que identifiquem as partes sem calcular uma medida.
2. Abra lentamente o instrumento e verbalize qual elemento permanece fixo e qual se desloca.
3. Demonstre mouse, toque e teclado. Ressalte que o movimento visual representa uma abertura física, não um número digitado.
4. Mostre o botão do olho. Explique que ele oculta somente a resposta; as escalas continuam contendo todas as informações necessárias.

### Encontro 2 — leitura métrica guiada

**Meta:** dominar a decomposição `escala principal + nônio`.

1. Comece em 0,1 mm, com a resposta visível.
2. Faça leituras em que o nônio coincidente seja 0, depois 1 e depois um índice intermediário.
3. Passe para 0,05 mm e 0,02 mm sem mudar o método; compare apenas o número de divisões e a resolução.
4. Em cada exemplo, peça a justificativa em voz alta antes de confirmar o resultado.

### Encontro 3 — polegada fracionária e milesimal

**Meta:** evitar a transferência incorreta das regras métricas.

1. Revise equivalências: `1″ = 25,4 mm` e `1/16″ = 8/128″`.
2. Na fracionária, transforme a parcela principal em denominador 128 antes de somar o nônio.
3. Na milesimal, leia a escala principal em passos de 0,025″ e some milésimos.
4. Compare duas aberturas próximas em unidades diferentes, sem sugerir que seus valores arredondados são idênticos.

### Encontro 4 — prática sem resposta

**Meta:** produzir e explicar leituras de modo independente.

1. O professor posiciona o instrumento e oculta a resposta.
2. Cada estudante registra as duas parcelas, a soma e a unidade.
3. Um estudante explica o raciocínio; outro confere a linha coincidente.
4. O professor revela o valor e discute a causa de divergências, não apenas quem acertou.
5. Ao final, os estudantes criam desafios entre pares e verificam a leitura no simulador.

## 4. Leitura por perfil

### 4.1 Métrico — resolução de 0,1 mm

- A escala principal avança de 1 mm em 1 mm.
- O nônio tem 10 divisões e fornece décimos de milímetro.
- Use `leitura = milímetros inteiros + índice coincidente × 0,1 mm`.

Exemplo: o zero do nônio ultrapassou 7 mm e a linha 4 coincide.

```text
7 mm + 4 × 0,1 mm = 7,4 mm
```

O resultado deve ser apresentado com uma casa decimal, inclusive em uma leitura exata como `7,0 mm`, para comunicar a resolução selecionada.

### 4.2 Métrico — resolução de 0,05 mm

- A escala principal continua avançando de 1 mm em 1 mm.
- O nônio tem 20 divisões.
- Use `leitura = milímetros inteiros + índice coincidente × 0,05 mm`.

Exemplo: o zero ultrapassou 14 mm e a linha 7 coincide.

```text
14 mm + 7 × 0,05 mm = 14,35 mm
```

Não conte a linha coincidente como “sete milímetros”. O índice só ganha valor depois de ser multiplicado por 0,05 mm.

### 4.3 Métrico centesimal — resolução de 0,02 mm

- A escala principal avança de 1 mm em 1 mm.
- O nônio tem 50 divisões.
- Use `leitura = milímetros inteiros + índice coincidente × 0,02 mm`.

Exemplo: o zero ultrapassou 9 mm e a linha 18 coincide.

```text
9 mm + 18 × 0,02 mm = 9,36 mm
```

“Centesimal” não significa que o passo seja 0,01 mm neste perfil. A leitura avança de **dois centésimos**, isto é, 0,02 mm.

### 4.4 Polegada fracionária — resolução de 1/128″

- Cada divisão principal vale 1/16″, equivalente a 8/128″.
- O nônio tem 8 divisões e resolve incrementos de 1/128″.
- Use `leitura = parcela principal em 1/16″ + índice coincidente × 1/128″`.

Para somar, converta a parcela principal para denominador 128 e, ao final, simplifique a fração.

Exemplo: o zero ultrapassou 5/16″ e a linha 3 coincide.

```text
5/16″ + 3/128″
= 40/128″ + 3/128″
= 43/128″
```

Como o intervalo entre marcas principais contém oito passos de 1/128″, o índice útil do complemento vai de 0 a 7; o oitavo passo já produz a próxima marca de 1/16″.

### 4.5 Polegada milesimal — resolução de 0,001″

- Cada divisão principal vale 0,025″.
- O nônio tem 25 divisões e resolve incrementos de 0,001″.
- Use `leitura = parcela principal em múltiplos de 0,025″ + índice coincidente × 0,001″`.

Exemplo: o zero ultrapassou 0,300″ e a linha 17 coincide.

```text
0,300″ + 17 × 0,001″ = 0,317″
```

O índice útil do complemento vai de 0 a 24; 25 milésimos completam a próxima divisão principal de 0,025″. A resolução `0,001″` equivale a `0,0254 mm`, mas a leitura deve permanecer na unidade do perfil selecionado.

## 5. Estratégias para o professor

### Demonstração projetada

- Use tela cheia e confirme a legibilidade no fundo da sala antes da atividade.
- Posicione a medida com a resposta visível, oculte-a e só então formule a pergunta.
- Peça sempre as duas parcelas. Uma resposta numérica sem justificativa pode resultar de adivinhação.
- Revele a resposta por poucos segundos e volte a ocultá-la para permitir uma segunda explicação.
- Alterne exemplos com nônio zero, coincidência no início, no meio e perto do próximo marco principal.
- Mude apenas uma dificuldade por vez: primeiro a resolução, depois a unidade.

### Avaliação formativa

Use quatro níveis de evidência:

1. **Identificação:** aponta corretamente o zero e a linha coincidente.
2. **Decomposição:** registra a parcela principal e o complemento.
3. **Cálculo:** soma, simplifica e mantém a precisão correta.
4. **Explicação:** justifica o resultado e detecta uma leitura incompatível com o perfil.

Um erro deve ser classificado antes da correção: localização da escala principal, escolha da coincidência, multiplicação pela resolução, soma, simplificação de fração ou unidade. Isso torna a devolutiva específica.

### Uso acessível

- Garanta que a pessoa possa mover o instrumento por teclado, sem depender do gesto de arrastar.
- Não use somente cor para indicar o perfil ou a linha de referência.
- Quando a resposta estiver oculta, não a leia em voz alta nem a exponha por uma descrição acessível automática.
- Para estudantes com baixa visão, trabalhe com zoom e menos marcas visíveis por vez, sem alterar a abertura física.
- Respeite movimento reduzido: a compreensão deve depender da posição final, não de animação.

## 6. Roteiro para estudo individual

1. Escolha um perfil e mantenha a resposta visível em três leituras guiadas.
2. Antes de olhar o mostrador, escreva a parcela principal e o índice coincidente.
3. Oculte a resposta e resolva cinco medidas consecutivas.
4. Revele somente após registrar a hipótese.
5. Para cada erro, marque a etapa que falhou e refaça outra medida do mesmo tipo.
6. Quando atingir quatro acertos justificados em cinco, avance para a próxima resolução.
7. Ao final, misture os perfis e escreva a unidade em todas as respostas.

Não use a posição aproximada do cursor como atalho. A habilidade-alvo é ler as graduações.

## 7. Exercícios

### Bloco A — decomposição

Calcule sem converter de unidade.

| Item | Perfil | Última marca principal ultrapassada | Linha coincidente |
| --- | --- | ---: | ---: |
| A1 | 0,1 mm | 7 mm | 4 |
| A2 | 0,1 mm | 23 mm | 8 |
| A3 | 0,05 mm | 14 mm | 7 |
| A4 | 0,05 mm | 42 mm | 18 |
| A5 | 0,02 mm | 9 mm | 18 |
| A6 | 0,02 mm | 27 mm | 37 |
| A7 | 1/128″ | 5/16″ | 3 |
| A8 | 1/128″ | 1 3/8″ | 4 |
| A9 | 0,001″ | 0,300″ | 17 |
| A10 | 0,001″ | 1,125″ | 9 |

### Bloco B — diagnóstico de afirmações

Classifique como correta ou incorreta e justifique.

1. “No perfil 0,02 mm, a linha 18 acrescenta 0,18 mm.”
2. “Em 1/128″, a marca principal de 3/8″ equivale a 48/128″.”
3. “No perfil milesimal, 12 divisões principais representam 0,300″.”
4. “Trocar de milímetros para polegadas altera fisicamente a abertura.”
5. “Se a resposta está oculta, não é possível descobrir a medida.”

### Bloco C — prática no simulador

Para cada perfil:

1. produza uma leitura com complemento zero;
2. produza uma leitura com complemento mínimo diferente de zero;
3. produza uma leitura cuja linha coincidente esteja na metade do nônio;
4. produza uma leitura próxima da próxima marca principal;
5. oculte o mostrador, troque a abertura e explique a nova leitura para outra pessoa.

### Gabarito dos blocos A e B

| Item | Resposta |
| --- | --- |
| A1 | 7,4 mm |
| A2 | 23,8 mm |
| A3 | 14,35 mm |
| A4 | 42,90 mm |
| A5 | 9,36 mm |
| A6 | 27,74 mm |
| A7 | 43/128″ |
| A8 | 1 13/32″ |
| A9 | 0,317″ |
| A10 | 1,134″ |

1. Incorreta: `18 × 0,02 mm = 0,36 mm`.
2. Correta: multiplica-se numerador e denominador por 8.
3. Correta: `12 × 0,025″ = 0,300″`.
4. Incorreta: muda a representação; a abertura física deve ser preservada, sujeita ao ajuste para o passo representável do novo perfil.
5. Incorreta: o mostrador é uma conferência; escala principal e nônio continuam permitindo a leitura.

## 8. Erros frequentes a observar

- Ler a primeira marca após o zero do nônio em vez da última marca ultrapassada.
- Somar diretamente o índice coincidente sem multiplicá-lo pela resolução.
- Confundir quantidade de divisões do nônio com resolução.
- Escrever casas decimais incompatíveis com o perfil.
- Somar frações com denominadores diferentes sem convertê-las.
- Não simplificar a resposta fracionária.
- Tratar 0,001″ como 0,001 mm.
- Mudar unidade e comparar apenas os textos arredondados, ignorando a abertura física.

## 9. Validação com o modelo do projeto

As fórmulas deste guia foram conferidas contra `lib/caliper.ts`:

- `mainScaleDivision` é 1 mm nos três perfis métricos, 1/16″ no fracionário e 1/40″ no milesimal;
- `vernierDivisions` é respectivamente 10, 20, 50, 8 e 25;
- `stepTicks` representa exatamente as cinco resoluções, sem acumular deriva de ponto flutuante;
- a conversão física usa `25,4 mm = 1″`;
- a formatação esperada usa uma casa em 0,1 mm, duas casas em 0,05/0,02 mm, fração reduzida em 1/128″ e três casas em 0,001″.

O modelo arredonda uma posição livre para o passo válido mais próximo, com empates afastados de zero, e limita a leitura à faixa representável. Conteúdo didático futuro deve preservar esse contrato ou documentar explicitamente qualquer mudança.

## 10. Papel futuro do agente de aprendizado

O agente de aprendizado mantém a ponte entre a matemática, a representação visual e a prática em sala. A cada novo perfil ou instrumento, ele deve revisar terminologia, criar exemplos e gabaritos independentes, identificar erros previsíveis, propor uma progressão de dificuldade e submeter os casos de referência à validação de um especialista em metrologia. Ele não substitui essa validação humana nem altera fórmulas de produção sem testes e revisão técnica.
