# Roteiro de estudos para os próximos instrumentos

## 1. Estado e limite deste documento

O paquímetro universal foi o primeiro instrumento do produto. O micrômetro interno de duas pontas foi implementado e aprovado visualmente em 24/08/2026. O micrômetro externo centesimal/milesimal entrou na interface local a partir da referência `Exemplos/M_externo.webp` e aguarda aceite visual final e validação metrológica especializada. O interno de três contatos continua futuro.

## 2. Base reaproveitável

Os próximos instrumentos devem reutilizar a experiência comum, não a geometria específica do paquímetro.

### Serviços comuns

- seletor de unidade e perfil de resolução;
- mostrador com ocultar/revelar resposta;
- modo de projeção e tela cheia;
- alternativas por mouse, toque e teclado;
- anúncio acessível de estado sem vazar uma resposta oculta;
- limites, quantização, formatação e conversão exatas;
- geração de desafios por índices inteiros de passo;
- registro de perfil, valor físico, tentativa e resultado, caso um modo de estudo seja adicionado;
- harness compartilhado para faixa, teclado, responsividade e acessibilidade.

### Contrato conceitual por instrumento

Cada instrumento deve fornecer quatro responsabilidades separadas:

1. **Modelo físico:** faixa, perfis, unidade canônica, limites e snap.
2. **Decomposição da leitura:** parcelas que um estudante precisa identificar.
3. **Geometria:** posição das peças e marcas derivada do mesmo estado físico.
4. **Estratégia didática:** explicação, exercícios, erros frequentes e critérios de domínio.

Uma forma futura do contrato pode ser:

```ts
type ReadingPart = {
  id: string;
  label: string;
  exactTicks: number;
  formatted: string;
};

interface InstrumentModel {
  instrumentId: string;
  profiles: readonly string[];
  snap(rawTicks: number, profileId: string): number;
  format(ticks: number, profileId: string): string;
  decompose(ticks: number, profileId: string): readonly ReadingPart[];
}
```

Esse esboço não deve ser copiado sem revisão. Alguns perfis futuros, como 0,0001″, não são representados exatamente pela constante atual de 80.000 ticks por milímetro. Antes de ampliar a faixa de resoluções, a equipe deve escolher entre aumentar a unidade canônica comum ou usar uma razão inteira exata por perfil. Ponto flutuante acumulado não é uma alternativa aceitável.

## 3. Micrômetro externo — protótipo local implementado

### Objetivo pedagógico

Ensinar a leitura combinada da bainha e do tambor, o contato correto com a peça e o uso da catraca ou fricção sem transformar a simulação em um mostrador digital.

### Recorte adotado na primeira versão

- micrômetro externo de 0–25 mm;
- passo de fuso de 0,5 mm por volta como configuração inicial a validar;
- bainha com marcas de 1 mm e 0,5 mm;
- tambor com 50 divisões centesimais;
- perfil centesimal de 0,01 mm e perfil com nônio de 10 divisões para resolução final de 0,001 mm, conforme a referência escolhida pelo responsável do produto;
- contato entre bigorna e fuso representado sem deformação fictícia da peça;
- catraca didática com estado de “contato atingido”, se o comportamento for validado.

Essas características são comuns, mas variam entre modelos reais. A geometria final precisa ser conferida com o instrumento físico ou documentação técnica do modelo escolhido.

### Regra de leitura a ensinar

Para o perfil métrico de 0,01 mm:

```text
leitura = milímetros visíveis na bainha
        + marca de 0,5 mm visível, quando houver
        + divisão coincidente do tambor × 0,01 mm
```

Para um perfil com nônio de 0,001 mm, acrescenta-se uma quarta parcela. O simulador deve permitir destacar cada parcela separadamente antes de exibir a soma.

### Interação

- Arrastar ou girar o tambor deve alterar a abertura de forma coerente com o passo do fuso.
- Teclas de seta oferecem o menor passo; `Shift` pode oferecer avanço maior documentado.
- Uma alternativa linear acessível deve existir para quem não consegue executar gesto circular.
- O limite de contato interrompe o avanço; a interface não deve sugerir compressão ilimitada.
- A abertura deve persistir ao ocultar a resposta e ao entrar em tela cheia.

### Conteúdo didático mínimo

- nomes e funções: arco, bigorna, fuso, bainha, tambor, catraca e trava;
- leitura da bainha inteira e da meia volta;
- leitura do tambor;
- composição das parcelas;
- força de medição e finalidade da catraca;
- limpeza das faces, verificação do zero e influência do erro de zero;
- exercícios em zero, próximo de 0,5 mm, após 1 mm e perto do limite de 25 mm.

### Critérios de aceite

- uma volta completa desloca o fuso exatamente pelo passo configurado;
- desenho, valor interno e texto recompõem a mesma leitura;
- não há deriva após rotações repetidas em sentidos opostos;
- contato e limites não podem ser ultrapassados por ponteiro nem teclado;
- as parcelas podem ser explicadas sem revelar antecipadamente a resposta final;
- um especialista aprova fixtures de leitura em pelo menos zero, um passo, meia volta, valor intermediário e limite.

## 4. Micrômetro interno

### Recorte implementado

Por solicitação do responsável do produto e conforme a referência visual aprovada em 24/08/2026, o instrumento implementado é o **micrômetro interno analógico tipo paquímetro, de duas pontas**, métrico e centesimal, com faixa nominal `5–15 mm` e resolução `0,01 mm`. A análise clean-room, o brief e o contrato final estão registrados em:

- `docs/MICROMETER_INTERNAL_REFERENCE_ANALYSIS.md`;
- `docs/MICROMETER_INTERNAL_DESIGN_BRIEF.md`;
- `docs/MICROMETER_TWO_POINT_REFERENCE_CONTRACT.md`.

Essa seleção antecipou o imicro em relação à ordem anteriormente sugerida neste roteiro. O responsável do produto autorizou a implementação incremental em 24/08/2026; o modelo inteiro, as fixtures independentes e a interface foram adicionados, mas a publicação permanece condicionada à validação humana de metrologia. O modelo legado analisado contém uma divergência `4,5–15,5 mm` versus a plaqueta `5–15 mm`; o intervalo legado não foi usado como oráculo.

### Decisão de produto registrada

“Micrômetro interno” descreve famílias distintas. A escolha vigente é o tipo paquímetro de duas pontas; a comparação abaixo permanece como registro histórico da decisão:

1. **Tipo paquímetro, de duas pontas:** corresponde à referência aprovada; a faixa iniciada em 5 mm usa pontas finas, enquanto capacidades maiores usam bigornas curvas.
2. **De três contatos para furos:** permanece como instrumento futuro distinto e exige geometria e procedimento de centralização próprios.

O modelo selecionado reaproveita a leitura tradicional de bainha e tambor, mas exige representar o vão horizontal entre uma ponta fixa e outra móvel. A ficha metrológica definitiva continua dependente de professor e especialista, não apenas da conveniência de interface.

### Objetivo pedagógico

Ensinar que uma medida interna exige contato, alinhamento e capacidade nominal corretos. A leitura pode combinar o cabeçote micrométrico com uma constante de haste ou extensão; omitir essa parcela produz um erro sistemático.

### Modelo físico a estudar

- capacidade mínima e máxima por configuração;
- corpo/cabeçote e conjunto de hastes compatíveis;
- constante nominal de cada extensão;
- passo do fuso e resoluções suportadas;
- sentido de abertura visual ao aumentar o diâmetro;
- condição de contato interno e procedimento de alinhamento;
- erro de zero e calibração, caso façam parte do programa do curso.

Não deve existir uma faixa genérica de zero até o máximo. Um micrômetro interno pode ter medida mínima diferente de zero e cada extensão altera a faixa válida.

### Regra de leitura a ensinar

Para o modelo com extensão:

```text
medida interna = constante da configuração
               + leitura da bainha
               + leitura do tambor
               + leitura do nônio, quando existente
```

O modo de estudo deve perguntar separadamente qual extensão está instalada, qual é sua constante e qual é a leitura do cabeçote. A soma final só deve ser liberada depois dessas decisões.

### Interação e representação

- A seleção de uma extensão deve atualizar faixa e geometria, sem alterar silenciosamente a medida para um valor inválido.
- Aumento da leitura deve aumentar o diâmetro representado.
- O estudante precisa reposicionar e alinhar o instrumento, caso o curso inclua técnica de medição; nesse caso, o “menor/maior valor durante o balanço” deve seguir o procedimento real validado.
- Se a primeira versão ensinar apenas leitura, a interface deve declarar que alinhamento e força não estão sendo avaliados.
- Teclado e controles simples devem substituir qualquer gesto de rotação ou alinhamento complexo.

### Critérios de aceite

- toda configuração tem faixa e constante explícitas;
- valores abaixo da capacidade mínima e acima da máxima são impossíveis;
- troca de extensão preserva a intenção do usuário ou solicita uma nova medida, sem esconder saturação;
- a soma da constante e das parcelas móveis é exata;
- a representação de contato não confunde raio com diâmetro;
- fixtures são aprovadas para cada extensão incluída;
- limitações do simulador em relação ao alinhamento real aparecem no conteúdo didático.

## 5. Arquitetura pedagógica compartilhada

Cada instrumento deve oferecer quatro modos progressivos, ainda que a primeira entrega publique apenas os dois primeiros:

| Modo | Apoio oferecido | Evidência de aprendizagem |
| --- | --- | --- |
| Explorar | resposta visível e partes nomeadas | relaciona movimento e escala |
| Ler | resposta ocultável | decompõe e calcula a leitura |
| Diagnosticar | exemplos com erro deliberado | identifica a etapa incorreta |
| Desafio | sequência mista e feedback após resposta | mantém acurácia sem pistas |

O histórico de tentativas, se implementado, deve registrar o tipo de erro e não somente certo/errado. Nenhum perfil educacional deve exigir conta, coleta de dados pessoais ou ranking público para funcionar.

## 6. Harness para novos instrumentos

Além dos testes comuns descritos em `docs/HARNESS_PLAN.md`, cada instrumento precisa de fixtures independentes que registrem:

- perfil e configuração física;
- valor canônico exato;
- parcelas esperadas;
- posição angular/linear esperada;
- texto final;
- limites e condição de contato.

Para o micrômetro externo, testes específicos cobrem volta do tambor, meia marca da bainha, catraca e erro de zero. Para o interno, cobrem constante da extensão, faixa mínima, sentido de abertura e troca de configuração.

Baselines visuais só devem ser aprovados depois das fixtures matemáticas. Uma ilustração visualmente convincente com decomposição incorreta é uma falha crítica.

## 7. Etapas e portas de decisão

### Etapa A — conteúdo e referência física

- escolher modelos reais representativos;
- reunir manuais e fotografias autorizadas;
- definir terminologia do curso;
- validar passo, divisões, faixas e procedimentos com especialista.

**Saída:** ficha metrológica versionada e conjunto inicial de leituras conhecidas.

### Etapa B — modelo matemático

- decidir a representação racional/integer exata;
- implementar limites, quantização, decomposição e formatação;
- aprovar testes unitários e fixtures antes da interface.

**Saída:** módulo puro e determinístico.

### Etapa C — protótipo didático

- desenhar instrumento sem copiar ativos proprietários;
- testar projeção, celular, teclado e toque;
- realizar aula piloto com resposta visível e oculta;
- registrar confusões de terminologia e leitura.

**Saída:** protótipo revisado e roteiro de aula.

### Etapa D — implementação e aceite

- integrar ao shell comum;
- executar suíte de contrato, E2E, acessibilidade e regressão visual;
- obter aceite de conteúdo e de geometria;
- publicar limitações conhecidas.

**Saída:** instrumento disponível no produto. Até esta porta ser concluída, ele deve aparecer apenas como “em estudo” ou não aparecer na navegação pública.

## 8. Ordem recomendada

1. Validar paquímetro e micrômetro interno em aula real e com especialista em metrologia.
2. Implementar o micrômetro externo métrico de 0–25 mm e 0,01 mm.
3. Avaliar o nônio de 0,001 mm como perfil avançado.
4. Estudar extensões/configurações adicionais do micrômetro interno somente com ficha metrológica aprovada.
5. Só então estudar variações em polegada e instrumentos internos de três contatos.

## 9. Papel do agente de aprendizado

O agente de aprendizado participa desde a ficha metrológica até a aula piloto. Ele transforma o modelo em explicações e exercícios, testa se cada parcela pode ser descoberta sem o mostrador, revisa termos ambíguos e mantém uma matriz de erros frequentes. Também compara feedback de professores e estudantes com as fixtures técnicas. Sua responsabilidade é preservar coerência pedagógica; a aprovação de grandezas, procedimentos e instrumentos continua pertencendo a um especialista humano em metrologia.
