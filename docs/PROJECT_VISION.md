# Visão do projeto

## Proposta

Criar uma família de instrumentos de medição virtuais para ensino técnico e prática individual. A experiência deve preservar a leitura analógica: o aluno aprende a interpretar a escala e o nônio, enquanto o valor numérico funciona como conferência controlada pelo professor.

O produto começa pelo paquímetro universal e prepara uma base coerente para micrômetros externo e interno. A marca usada nesta fase é **Cabalero_Automações**, definida como **Engenharia de Software aplicada à Indústria**.

## Público e contexto

- professores e instrutores de metrologia, mecânica e manufatura;
- estudantes em laboratório, sala projetada ou estudo individual;
- escolas técnicas, cursos profissionalizantes e treinamento industrial;
- uso em desktop, projetor, tablet e telefone.

Sala de aula e estudo individual têm a mesma prioridade. Por isso, controles grandes, resposta ocultável, tela cheia e operação por teclado são requisitos de produto, não complementos.

## Primeira entrega

O paquímetro universal deve:

1. ocupar a maior parte da tela e manter aparência reconhecível de instrumento analógico;
2. abrir e fechar horizontalmente por mouse, toque, caneta ou teclado;
3. apresentar escala principal e nônio coerentes com a mesma medida interna;
4. operar em milímetros e polegadas, com perfis metrológicos válidos;
5. mostrar a medida em destaque e ocultá-la por um botão de olho;
6. permitir sortear uma medida já oculta para perguntas em aula;
7. suportar ampliação da escala e tela cheia sem alterar a leitura;
8. funcionar sem anúncios, executáveis, telemetria ou conteúdo incorporado da referência.

## Perfis metrológicos

| Sistema | Perfil | Resolução | Nônio |
| --- | --- | --- | --- |
| Métrico | decimal | 0,1 mm | 10 divisões |
| Métrico | cinco centésimos | 0,05 mm | 20 divisões |
| Métrico | dois centésimos | 0,02 mm | 50 divisões |
| Imperial | fracionário | 1/128″ | 8 divisões |
| Imperial | milesimal | 0,001″ | 25 divisões |

No vocabulário do projeto, **centesimal** identifica as resoluções métricas expressas em centésimos de milímetro; **milesimal** identifica o perfil imperial de 0,001 polegada. Eles não são apenas níveis visuais de zoom.

## Princípios

- O instrumento é o protagonista.
- A matemática é determinística e testável.
- O desenho e o valor nunca podem divergir.
- Ocultar a resposta não altera a medida.
- Acessibilidade segue WCAG 2.2 AA e cobre mouse, toque, teclado, contraste, daltonismo, foco e movimento reduzido.
- O produto é original: reaproveita a ideia educacional da referência, não seu código, seus ativos ou sua composição publicitária.
- Novos instrumentos só entram depois de validação metrológica, pedagógica, visual e automatizada.

## Fora do escopo desta entrega

- paquímetro digital ou com relógio;
- conta de usuário, histórico remoto, ranking ou telemetria;
- upload de imagens ou arquivos;
- micrômetros já navegáveis na interface;
- substituir treinamento prático, calibração ou inspeção real.

## Critério de sucesso

Um professor deve conseguir abrir a ferramenta, ajustar ou sortear uma medida, ocultar a resposta, projetar o instrumento e revelar o resultado sem atravessar menus ou conteúdo editorial. Um aluno deve conseguir repetir a mesma atividade em seu dispositivo e obter a mesma leitura quantizada.
