# Relatório de segurança e boas práticas

## Resumo executivo

O frontend não apresentou achado crítico nem fluxo de XSS, redirecionamento aberto, armazenamento de segredo, telemetria, anúncio, embed ou download automático. A implementação usa renderização segura do React, mantém a simulação local e já entrega cabeçalhos defensivos pelo Worker.

Após as correções aplicadas, permanecem três pontos: um alerta **alto** na cadeia de build (`image-size`, trazido pelo Vinext), um achado **médio** relacionado à CSP e um ponto **baixo** de governança. A exposição do alerta alto está reduzida no produto atual porque não há upload nem processamento de imagem fornecida por usuário, mas ele deve continuar bloqueando a publicação de qualquer futura função que aceite imagem não confiável.

Resultado de `npm audit` neste estado:

- dependências de produção (`npm audit --omit=dev`): **0** vulnerabilidades conhecidas;
- árvore completa: **2** alertas altos — ambos no mesmo parser de imagens da cadeia de ferramentas;
- nenhuma credencial, arquivo `.env`, chave privada ou certificado foi encontrado no escopo do repositório.

Este relatório é uma fotografia de um projeto ainda em construção, não uma garantia de ausência de vulnerabilidades nem uma homologação de produção.

## Estado e escopo da revisão

- Data/hora da coleta: **2026-08-11 22:11 BRT**.
- Diretório: `F:\Paquimetro_para_Estudos`.
- Estado Git: repositório inicializado, mas **sem commit `HEAD`**; havia 26 entradas não rastreadas. Portanto, não existe hash imutável ao qual vincular este relatório.
- Stack revisada: React 19.2.8, TypeScript 5.9, Vinext 1.0.0-beta.5, Vite 8.2.1 e Cloudflare Worker.
- Escopo de código: `app/`, `lib/`, `worker/`, `public/`, configurações, testes, `package.json` e `package-lock.json`.
- Fora do escopo: infraestrutura real do provedor após publicação, conta Cloudflare, DNS/TLS, WAF, navegador do aluno, extensões, sistema operacional e qualquer backend futuro.

Verificações executadas, todas somente leitura:

1. busca por sinks XSS, execução dinâmica, URLs/navegação dinâmicas, `postMessage`, Web Storage, requisições de rede, service workers, scripts remotos e padrões de segredo;
2. inspeção dos fluxos de ponteiro e Fullscreen API;
3. inspeção da política CSP e demais cabeçalhos;
4. `npm audit --omit=dev --json` e `npm audit --json`;
5. inspeção das cadeias com `npm explain`;
6. resposta local em `http://localhost:3000/`, incluindo cabeçalhos e interface de escuta;
7. confronto com a análise controlada da referência em `docs/REFERENCE_ANALYSIS.md`.

## Achados críticos

Nenhum achado crítico foi identificado neste estado.

## Achados altos

### SEC-001 — Vinext incorpora parser de imagens sem versão corrigida

- **Regra:** REACT-SUPPLY-001 / REACT-FILE-001
- **Severidade:** Alta para a dependência; exposição atual reduzida pela arquitetura
- **Localização:** `package.json:45`; `package-lock.json:5850`; `package-lock.json:8417`
- **Evidência:** `vinext@1.0.0-beta.5` depende exatamente de `image-size@2.0.2`. O `npm audit` associa essa versão a loops infinitos ao processar buffers ICNS, JXL e HEIF especialmente construídos. Em 11/08/2026, o registro npm ainda indicava `2.0.2` como versão mais recente e os advisories não listavam versão corrigida.
- **Impacto:** se, no futuro, uma imagem controlada por atacante alcançar esse parser em um processo Node/CI, o processo pode ficar preso e causar negação de serviço. O impacto não foi demonstrado no fluxo publicado atual: a aplicação só usa ativos locais controlados, não oferece upload e o endpoint de otimização restringe a origem e tipos de conteúdo.
- **Correção recomendada:** acompanhar Vinext/`image-size` e atualizar assim que houver release corrigida; registrar o risco aceito enquanto isso. Não adotar automaticamente o downgrade incompatível sugerido pelo `npm audit` sem validar Vinext, build e Worker.
- **Mitigação imediata:** manter proibidos uploads, URLs remotas e imagens fornecidas por usuário; aceitar somente ativos versionados e revisados. Se upload de imagem entrar no roadmap, usar serviço isolado com allowlist de PNG/JPEG/WebP, limites de bytes/dimensões/tempo e sem expor os formatos vulneráveis ao parser.
- **Nota de falso positivo/exposição:** a severidade vem do advisory da dependência. A explorabilidade depende de entrada binária não confiável chegar ao parser; isso não existe no produto atual.

Fontes: [ICNS — GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) e [JXL/HEIF — GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq).

## Achados médios

### SEC-002 — CSP permite scripts inline

- **Regra:** REACT-CSP-001 / JS-CSP-002
- **Severidade:** Média
- **Localização:** `worker/index.ts:53`
- **Evidência:** a resposta aplica `script-src 'self' 'unsafe-inline'`. A política bloqueia origens externas, curingas, objetos e `unsafe-eval`, mas `unsafe-inline` reduz a proteção da CSP contra injeção de script.
- **Impacto:** não foi encontrado sink XSS nem entrada remota no frontend atual, então não há cadeia de exploração demonstrada. Se uma injeção de HTML aparecer mais tarde, scripts inline poderão ser executados apesar da CSP.
- **Correção recomendada:** migrar para nonce ou hashes compatíveis com o HTML/RSC emitido pelo Vinext. Começar com `Content-Security-Policy-Report-Only`, inventariar os scripts inline legítimos e só então remover `unsafe-inline` da política aplicada.
- **Mitigação:** manter `unsafe-eval` proibido, não adicionar domínios externos, continuar evitando `dangerouslySetInnerHTML` e sinks DOM. O teste de cabeçalhos deve passar a rejeitar `unsafe-inline` quando a migração estiver pronta.
- **Nota de falso positivo/exposição:** a diretiva pode ser uma necessidade temporária do streaming RSC. Isso explica a compatibilidade, mas não elimina o enfraquecimento da defesa em profundidade.

### SEC-003 — Alertas residuais na cadeia de desenvolvimento — mitigado parcialmente

- **Regra:** REACT-SUPPLY-001
- **Severidade:** Média para a estação/CI; não presente na árvore de produção do `npm audit`
- **Localização:** `package.json:18`, `package.json:21`, `package.json:35`; `package-lock.json:81`, `package-lock.json:3716`, `package-lock.json:4150`, `package-lock.json:6356`
- **Evidência atualizada:** Drizzle/D1, `drizzle-kit`, o script `db:generate` e os exemplos do starter foram removidos por não serem usados. Depois de `npm audit fix` sem mudanças incompatíveis, a auditoria completa caiu de 9 para 2 alertas altos, ambos já consolidados no SEC-001; `npm audit --omit=dev` permanece com zero. Este achado está encerrado.
- **Impacto:** entradas maliciosas processadas por lint/build/configuração podem causar consumo de recursos ou leitura de arquivo local, afetando estação de desenvolvimento ou CI. A superfície é maior do que o necessário para o produto.
- **Correção recomendada:** remover `drizzle-orm`, `drizzle-kit`, `db:generate`, `db/`, `drizzle/`, `drizzle.config.ts` e exemplos D1 se não forem usados. Atualizar ESLint/plugins quando versões corrigidas estiverem disponíveis; usar `overrides` apenas após validar compatibilidade e rodar o harness completo.
- **Mitigação:** usar `npm ci` em CI, revisar alterações do lockfile, executar build/lint apenas em contribuições confiáveis e manter servidores de desenvolvimento em loopback. Na coleta, a porta 3000 estava escutando somente em `::1`.
- **Nota de falso positivo/exposição:** `npm audit --omit=dev` retornou zero. Os alertas desta seção não foram observados no bundle de navegador, mas ainda importam para supply chain e estação do desenvolvedor.

## Achados baixos

### SEC-004 — “Resposta oculta” na semântica do slider — mitigado

- **Regra:** privacidade pedagógica / minimização de exposição
- **Severidade:** Baixa
- **Localização:** `app/components/CaliperWorkbench.tsx:557`, `app/components/CaliperWorkbench.tsx:573`
- **Evidência atualizada:** o mostrador troca o texto visual por uma máscara e `aria-valuetext` agora informa `Resposta oculta`. `aria-valuenow` é preservado por ser obrigatório no contrato do `role="slider"` e para manter a operação por teclado semanticamente correta.
- **Impacto:** a medida não é segredo de segurança, porém um aluno com tecnologia assistiva pode receber a resposta que foi ocultada para a turma. Isso quebra a promessa pedagógica e cria experiência desigual.
- **Validação residual recomendada:** testar o comportamento com NVDA/VoiceOver; não falsificar silenciosamente o valor físico.
- **Mitigação:** deixar explícito na documentação que ocultar é um recurso didático, não controle de confidencialidade.
- **Nota de falso positivo/exposição:** `aria-valuenow` é obrigatório para um `role="slider"`; a solução precisa equilibrar o contrato ARIA com o modo de aula.

### SEC-005 — Gate de segurança existe localmente, mas não há workflow de CI versionado

- **Regra:** REACT-SUPPLY-001 / governança
- **Severidade:** Baixa
- **Localização:** `package.json:12`; `package.json:16`; ausência de `.github/workflows/` no estado revisado
- **Evidência:** existem `npm test`, `test:ci` e testes de cabeçalhos/artefatos, mas não há workflow que imponha `npm ci`, auditoria e gates em cada alteração.
- **Impacto:** regressões podem entrar sem executar o harness, sobretudo mudanças de dependência, CSP e artefatos publicados.
- **Correção recomendada:** criar CI com `npm ci`, `npm run test:ci`, `npm audit --omit=dev` e retenção do relatório; adicionar atualização automática de dependências com revisão humana.
- **Mitigação:** até o CI existir, registrar no checklist de release a execução dos quatro comandos e o hash/estado analisado.
- **Nota de falso positivo/exposição:** a ausência de CI não torna o app diretamente explorável; é uma lacuna de prevenção e repetibilidade.

## Controles positivos confirmados

- Não foram encontrados `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`, `new Function`, handlers em string, navegação dinâmica, `postMessage`, Web Storage, service worker ou scripts remotos no escopo de produção.
- Não há chamadas `fetch`/Axios no frontend, cookies, autenticação, upload, formulário de estado, analytics ou persistência de dados pessoais.
- A Fullscreen API só é chamada a partir de botão explícito, testa disponibilidade e trata rejeição em `app/components/CaliperWorkbench.tsx:486`.
- Ponteiro usa captura e cancelamento; nenhum dado atravessa origem ou vira código.
- O Worker aplica CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e COOP em `worker/index.ts:43`. A resposta local confirmou esses cabeçalhos também em execução.
- A CSP não contém curinga, origem HTTP externa nem `unsafe-eval`; `object-src 'none'` e `connect-src 'self'` reduzem embeds e exfiltração.
- O lockfile contém hashes de integridade e as versões RSC/Vite/Cloudflare foram elevadas para releases que corrigem alertas críticos do starter inicial.
- O teste `tests/build-artifacts.test.mjs:22` rejeita executáveis legados e referências ao domínio Stefanelli no manifesto publicado.
- A análise da referência foi feita sem executar EXEs e documenta a decisão de não incorporar anúncios, trackers, scripts, JSON, mídia ou downloads em `docs/REFERENCE_ANALYSIS.md:155`.

## Riscos residuais e critérios antes da publicação

1. **Aceitar ou mitigar SEC-001 por escrito** enquanto não existir versão corrigida do parser; não lançar upload de imagem sob essa pendência.
2. **Planejar a remoção de `unsafe-inline`** sem quebrar o streaming RSC; não trocar o problema por `unsafe-eval`.
3. Manter removidos os componentes e dependências de starter que não fazem parte do simulador.
4. Executar o build e o Worker exatamente como serão publicados e verificar headers na URL final; configuração em repositório não prova comportamento do edge.
5. Confirmar que os assets finais continuam locais e que a aba de rede não mostra anúncios, reCAPTCHA, mapas, Hotjar, RUM da referência ou downloads.
6. Adicionar CI reprodutível e vincular futuras revisões a um commit.
7. Reabrir a modelagem de ameaças se forem adicionados conta, armazenamento, telemetria, uploads, conteúdo rico, links externos ou API.

## Referências primárias

- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [OWASP NPM Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html)
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit/)
- [React: `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common#dangerouslysetting-the-inner-html)
- [Vite Windows path disclosure advisory](https://github.com/advisories/GHSA-fx2h-pf6j-xcff)
- [React Server Components DoS advisory, corrigido em 19.2.8](https://github.com/advisories/GHSA-wx67-qw84-cm4g)

