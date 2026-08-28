# Métricas de legibilidade dos nônios

Este contrato governa somente a projeção visual. Modelos inteiros, resolução,
quantização, coincidência e ownership mecânico permanecem nos contratos de cada
instrumento.

## Responsabilidades

| Frente | Ação |
| --- | --- |
| Interface | controlar zoom, densidade, pistas, orientação e clipping dos rótulos |
| Código | expor métricas puras de projeção sem alterar o estado metrológico |
| Testes | verificar pitch, fonte, folga, envelope e fixtures de coincidência |
| Harness | validar desktop, `844 × 390` e `320 px` em visão geral e lupa |

## Limites verificáveis

- fonte efetiva na lupa: mínimo `14 CSS px`;
- fonte efetiva na visão geral compacta, quando um número for exibido: mínimo
  `9 CSS px`;
- distância entre caixas de rótulos: mínimo `2 CSS px`;
- pitch do paquímetro na lupa: mínimo `3 CSS px` entre divisões do nônio;
- pitch da escala principal do goniômetro na lupa: mínimo `2 CSS px` por grau;
- traço essencial: mínimo `1 CSS px`;
- contraste textual: mínimo `4,5:1`; contraste não textual: mínimo `3:1`;
- nenhum rótulo pode sair do envelope da placa ou ser recortado pelo canvas;
- as dez marcas do nônio milesimal do micrômetro externo devem permanecer
  dentro da bainha, inclusive as divisões `8` e `9`;
- em `320 px`, a visão geral pode reduzir a quantidade de números, mas nunca a
  quantidade de divisões físicas. A lupa deve disponibilizar a leitura completa.

## Matriz de aceite

Validar visão geral e lupa em `1211 × 455`, `844 × 390` e `320 × 380`, nos
perfis métricos e em polegadas do paquímetro, no micrômetro externo milesimal e
nos dois sentidos do goniômetro. Conferir limites e estados intermediários,
incluindo coincidências nas primeiras, centrais e últimas divisões.

O gate automatizado deve combinar geometria independente com inspeção em
navegador real. Aumento de fonte isolado não prova legibilidade se as caixas
continuarem sobrepostas.
