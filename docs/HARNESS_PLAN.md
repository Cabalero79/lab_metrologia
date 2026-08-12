# Plano do harness de qualidade

## 1. Propósito

O harness deve transformar confiabilidade metrológica, interação e acessibilidade em verificações repetíveis. Ele precisa ser rápido no desenvolvimento local, determinístico no CI e extensível para novos instrumentos sem copiar toda a infraestrutura.

Este documento descreve o estado-alvo. No starter atual, somente estes comandos já existem:

```text
npm run lint
npm run build
npm test
```

O `npm test` atual compila o projeto e executa `tests/rendered-html.test.mjs`, que valida apenas o esqueleto temporário. Quando o produto substituir o starter, esse teste deverá ser substituído por um smoke test da página real.

## 2. Princípios do harness

- Testar o valor físico no modelo, não somente o texto na tela.
- Manter o oráculo de testes independente da função de produção.
- Usar índices inteiros de passo para impedir flutuação numérica.
- Preferir seletores por papel, nome e rótulo acessível; usar `data-testid` apenas onde a geometria não tem semântica estável.
- Fixar locale, timezone, viewport, DPR, fontes e animações nas capturas.
- Registrar seed de testes gerativos e artefatos suficientes para reproduzir falhas.
- Não aceitar retentativas como correção de teste instável.
- Executar a mesma regra de contrato para todo instrumento que implementar o protocolo comum.

## 3. Camadas

| Camada | Ferramenta proposta | Responsabilidade | Frequência |
| --- | --- | --- | --- |
| Estática | TypeScript + ESLint + jsx-a11y | Tipos, imports, hooks e problemas acessíveis detectáveis estaticamente | A cada alteração |
| Unidade | Vitest, ou `node:test` para módulos JS puros | Matemática, quantização, conversão, formatação e reducers | A cada alteração |
| Componente | Vitest + Testing Library + user-event | Estados React, nomes acessíveis, teclado e ocultar/revelar | A cada alteração |
| Contrato geométrico | Vitest + fixtures | Coerência entre modelo, divisões do nônio e coordenadas SVG/canvas | A cada alteração |
| E2E | Playwright | Mouse, toque, fullscreen, responsividade e fluxos reais | Pull request |
| Acessibilidade | axe-core integrado ao Playwright + revisão manual | WCAG 2.2 AA automatizável e fluxos assistivos | Pull request + versão |
| Visual | Screenshots do Playwright | Escala, nônio, layout, foco e breakpoints | Pull request |
| Empacotamento | build + smoke no worker compilado | SSR, assets e página servida | Pull request |
| Manual metrológico | Roteiro versionado | Validação didática por pessoa qualificada | Antes da versão |

Vitest, Testing Library, Playwright e axe são propostas; não estão instalados no `package.json` no momento deste plano.

## 4. Estrutura proposta

```text
tests/
  unit/
    measurement-model.test.ts
    conversion.test.ts
    format-measurement.test.ts
  component/
    instrument-controls.test.tsx
    measurement-visibility.test.tsx
    keyboard-control.test.tsx
  contract/
    instrument-contract.test.ts
    vernier-geometry.test.ts
  e2e/
    caliper-pointer.spec.ts
    caliper-touch.spec.ts
    caliper-keyboard.spec.ts
    caliper-profiles.spec.ts
    fullscreen.spec.ts
    responsive.spec.ts
    accessibility.spec.ts
    visual.spec.ts
  fixtures/
    caliper-known-readings.ts
    instrument-contract-cases.ts
  manual/
    release-checklist.md
  rendered-html.test.mjs
playwright.config.ts
vitest.config.ts
```

O código de produção pode expor uma API pequena e estável para testes, sem publicar detalhes de React:

```ts
type MeasurementProfile = {
  id: string;
  unit: "mm" | "in";
  resolution: number;
  min: number;
  max: number;
};

type InstrumentState = {
  physicalMicrometres: number;
  profileId: string;
  answerVisible: boolean;
};
```

Coordenadas visuais devem ser derivadas do mesmo estado, mas verificadas por fixtures independentes com leituras conhecidas.

## 5. Comandos-alvo

Após a instalação das ferramentas e criação das configurações, padronizar scripts equivalentes a:

```text
npm run lint             # ESLint, incluindo regras React e jsx-a11y
npm run typecheck        # tsc --noEmit
npm run test:unit        # unidade + propriedades + contratos
npm run test:component   # componentes React em DOM de teste
npm run test:e2e         # navegadores do Playwright
npm run test:a11y        # axe + cenários manuais listados no relatório
npm run test:visual      # comparação de screenshots sem atualizar baselines
npm run test:visual:update # atualização explícita de baselines
npm run build            # build vinext/Cloudflare
npm run test:smoke       # worker compilado responde e renderiza o produto
npm test                 # gate local: estática + unitário + componente + build + smoke
npm run test:ci          # gate completo, incluindo E2E, a11y e visual
```

`test:visual:update` nunca deve fazer parte do gate automático. Atualizar imagens é uma decisão de revisão, não uma forma de fazer o CI passar.

## 6. Configuração determinística

### 6.1 Ambiente

- Node fixado pela propriedade `engines` e, idealmente, arquivo de versão do projeto.
- Instalação no CI com `npm ci`.
- `TZ=UTC` nos processos de teste, sem mudar a apresentação `pt-BR` esperada.
- Locale do navegador fixado em `pt-BR`.
- Relógio congelado quando houver conteúdo temporal.
- Seed fixa por execução normal; seed aleatória registrada em uma execução noturna opcional.
- Rede externa bloqueada nos E2E. A aplicação inicial não deve precisar dela.
- Transições CSS desabilitadas apenas para comparação visual; os testes de `prefers-reduced-motion` usam a implementação real.

### 6.2 Projetos de navegador

- `chromium-desktop`: referência visual, 1440×900, DPR 1.
- `chromium-projector`: 1024×768, DPR 1.
- `firefox-desktop`: fluxo crítico.
- `webkit-mobile`: viewport móvel, toque e área segura simulados.
- `chromium-reduced-motion`: `reducedMotion: "reduce"`.
- Projeto adicional com zoom/emulação adequada para reflow a 200%.

Tela cheia costuma exigir gesto do usuário e varia por engine. Os testes devem:

1. validar a integração real onde o navegador do CI oferece a API;
2. cobrir a rejeição/ausência da API com um mock pequeno em teste de componente;
3. validar sincronização por `fullscreenchange`, inclusive saída por `Esc`.

### 6.3 Isolamento

Cada teste começa com:

- estado conhecido do instrumento;
- armazenamento local limpo, se vier a ser usado;
- viewport e perfil explicitamente escolhidos;
- resposta visível/oculta explicitamente escolhida;
- nenhuma dependência da ordem dos testes.

## 7. Fixtures e oráculos

Cada fixture metrológica deve conter dados explícitos, por exemplo:

```ts
{
  profileId: "metric-0.02",
  physicalMicrometres: 12340,
  expectedDisplay: "12,34 mm",
  expectedMainScale: 12,
  expectedVernierDivision: 17
}
```

O exemplo é apenas o formato; valores e perfis finais precisam ser confirmados com a geometria escolhida. A fixture não pode chamar a função de produção para gerar `expectedDisplay` ou a divisão esperada.

Conjunto mínimo por perfil:

- zero e primeiro passo;
- passo anterior e posterior a uma transição da escala principal;
- pelo menos três combinações não triviais de principal + nônio;
- metade da faixa;
- último passo e máximo;
- valores de arredondamento ao converter para todos os demais perfis.

Além das fixtures, testes por propriedade percorrem todos os passos quando a faixa for pequena o suficiente; caso contrário, amostram limites e uma sequência com seed registrada.

## 8. Critérios por etapa

### Durante o desenvolvimento

- `lint`, `typecheck`, unidade e componentes passam.
- Nenhum teste focado ou ignorado entra no commit sem justificativa.
- Cobertura de linhas não substitui casos de fronteira; como orientação, o núcleo matemático deve ter 100% de branches e o restante não deve regredir.

### Pull request

- Build e smoke passam em ambiente limpo.
- E2E crítico passa em três engines.
- Zero violações axe críticas ou sérias.
- Diferenças visuais revisadas.
- Artefatos de falha publicados.

### Release

- Checklist manual em dispositivo móvel real e projetor.
- NVDA com Firefox ou Chrome e VoiceOver no Safari móvel.
- Revisão das leituras conhecidas por responsável pelo conteúdo.
- Nenhuma chamada de rede, popup ou download inesperado no fluxo normal.
- Matriz de navegadores e versões registrada no relatório.

## 9. Evidências e diagnóstico

Em sucesso, reter:

- resumo JUnit por camada;
- relatório HTML do Playwright;
- resultado axe estruturado;
- baselines visuais aprovados e hash do commit;
- checklist manual assinado ou identificado.

Em falha, reter adicionalmente:

- screenshot;
- trace do navegador;
- vídeo somente do teste falho, se necessário;
- DOM/ARIA snapshot relevante;
- console do navegador e erros de página;
- perfil, viewport, DPR, engine, unidade, resolução, medida física e seed.

Os artefatos não devem conter dados pessoais. Como a ferramenta não precisa de conta na primeira versão, testes devem permanecer anônimos.

## 10. Política para testes instáveis

- CI pode repetir uma falha uma vez apenas para coletar evidência comparativa.
- Se passar na repetição, o teste continua sendo reportado como instável.
- Teste instável não é removido silenciosamente; recebe responsável e prazo curto.
- Esperas de tempo fixo são proibidas quando existe uma condição observável (`expect`, evento, estado de rede ou `fullscreenchange`).
- Baseline visual não é atualizado automaticamente.

## 11. Contrato extensível para instrumentos

O harness deve executar uma suíte compartilhada contra um adaptador por instrumento:

```ts
interface InstrumentHarnessAdapter {
  instrumentId: string;
  profiles: MeasurementProfile[];
  setPhysicalValue(micrometres: number): Promise<void>;
  getPhysicalValue(): Promise<number>;
  getDisplayedReading(): Promise<string | null>;
  increment(steps?: number): Promise<void>;
  decrement(steps?: number): Promise<void>;
  hideAnswer(): Promise<void>;
  revealAnswer(): Promise<void>;
}
```

A suíte comum valida faixa, quantização, formatação, troca de perfil, resposta oculta, teclado, responsividade e acessibilidade. Suites específicas validam a geometria de cada instrumento.

### 11.1 Futuro micrômetro externo

Adicionar casos para:

- passo do fuso por volta do tambor;
- relação entre linha da bainha, meia volta e divisão do tambor;
- leitura combinada de bainha + tambor + nônio, quando existir;
- rotação em ambas as direções e limite físico;
- catraca/fricção, se simulada, sem ultrapassar o contato;
- zero, erro zero didático e calibração, se fizerem parte da experiência;
- fechamento sobre medida externa conhecida.

### 11.2 Futuro micrômetro interno

Reutilizar o contrato, acrescentando:

- abertura mínima nominal e extensões;
- sentido visual correto do aumento de diâmetro;
- composição da leitura com a constante da haste/extensão;
- prevenção de valores abaixo da capacidade nominal;
- contato interno e representação sem ambiguidade.

Fixtures de micrômetro ficam em arquivos próprios, mas obedecem à mesma unidade física canônica. A inclusão de um instrumento novo só é aceita quando ele passa na suíte compartilhada e em sua suíte geométrica específica.

## 12. Sequência recomendada de implantação

1. Extrair e testar o modelo matemático puro.
2. Substituir o teste do skeleton por smoke test do produto.
3. Instalar Vitest e criar testes unitários/contrato.
4. Adicionar Testing Library para estados e teclado.
5. Adicionar Playwright para ponteiro, toque, responsividade e tela cheia.
6. Integrar axe e revisão manual acessível.
7. Criar baselines visuais somente após a geometria do paquímetro ser aprovada.
8. Publicar artefatos e gates no CI.

