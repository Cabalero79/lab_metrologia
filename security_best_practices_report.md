# Relatório resumido de segurança e boas práticas

## Resumo executivo

Revisão e correções concluídas em **28/08/2026**, a partir do commit `6621110`.
Os quatro achados da auditoria foram tratados. A árvore completa de dependências
agora apresenta **zero vulnerabilidades conhecidas**, a CSP usa nonce criptográfico
por resposta, o gate está versionado no GitHub Actions e a persistência automática
de logs do Worker está desativada.

| Severidade aberta | Quantidade |
| --- | ---: |
| Crítica | 0 |
| Alta | 0 |
| Média | 0 |
| Baixa | 0 |

O estado é adequado ao perfil atual: simulador público, sem contas, dados pessoais,
uploads, banco, anúncios, downloads ou telemetria. Isso não substitui uma revisão
da infraestrutura real quando a publicação definitiva for autorizada.

## Validação final

- `npm ci`: instalação reproduzível concluída pelo lockfile.
- `npm audit --audit-level=high`: zero vulnerabilidades.
- `npm run test:ci`: lint, TypeScript e build aprovados.
- Testes técnicos: `69/69` aprovados.
- Testes smoke, SSR, artefatos e segurança: `13/13` aprovados.
- Navegador real: hidratação, lupa, `Escape` e troca mm/polegada funcionais;
  console com zero erros e zero avisos.
- `git diff --check`: sem erro de whitespace.

## Achados corrigidos

### SEC-001 — Parser vulnerável na cadeia do Vinext — corrigido

- **Severidade anterior:** Alta
- **Localização:** `package.json:43`; `package-lock.json:7277-7293`
- **Correção:** Vinext atualizado de `1.0.0-beta.5` para `1.0.0-beta.8`.
  A versão nova remove a dependência transitiva `image-size@2.0.2`.
- **Evidência:** `npm explain image-size` não encontra mais o pacote e a auditoria
  completa retorna zero vulnerabilidades.
- **Risco residual:** futuras atualizações continuam sujeitas à revisão do lockfile
  e ao gate de dependências.

Referências históricas: [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)
e [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq).

### SEC-002 — CSP permitia scripts inline indiscriminadamente — corrigido

- **Severidade anterior:** Média
- **Localização:** `worker/index.ts:25-73`;
  `tests/security-headers.test.mjs:36-71`;
  `tests/rendered-html.test.mjs:63-76`
- **Correção:** o Worker gera um nonce aleatório de 128 bits para cada resposta,
  informa a CSP ao Vinext e entrega `script-src 'self' 'nonce-…'`, sem
  `unsafe-inline` ou `unsafe-eval` para scripts.
- **Evidência:** os testes confirmam nonce único por resposta, rejeitam
  `unsafe-inline` e verificam que todo `<script>` renderizado usa o nonce correto.
- **Risco residual aceito:** `style-src 'unsafe-inline'` permanece para os estilos
  inline legítimos do React/Vinext; não autoriza execução de JavaScript e não há
  entrada de CSS/HTML fornecida por usuário.

### SEC-003 — Gate local sem CI versionado — corrigido

- **Severidade anterior:** Baixa
- **Localização:** `.github/workflows/ci.yml:1-54`
- **Correção:** workflow para push em `main` e pull requests com permissões
  somente de leitura, cancelamento de execuções obsoletas, timeout, Node 22.13.0,
  `npm ci`, auditoria completa e `npm run test:ci`.
- **Evidência:** Checkout, setup do Node e Dependency Review estão fixados por SHA;
  dependências altas ou críticas bloqueiam o fluxo.
- **Risco residual:** a primeira execução remota ocorrerá após o workflow ser
  enviado ao GitHub; os mesmos comandos já passaram localmente.

### SEC-004 — Observabilidade persistente sem decisão explícita — corrigido

- **Severidade anterior:** Baixa
- **Localização:** `vite.config.ts:15-23`;
  `tests/build-artifacts.test.mjs:34-40`
- **Correção:** `observability.enabled` está explicitamente definido como `false`
  na configuração que gera o Worker.
- **Evidência:** o teste abre `dist/server/wrangler.json` e falha se a persistência
  automática de logs voltar a ser habilitada.
- **Risco residual:** logs obrigatórios ou administrativos da plataforma, fora do
  artefato e da conta revisada, devem ser conferidos quando houver implantação.

## Controles positivos preservados

- Não há `dangerouslySetInnerHTML`, sinks DOM inseguros, `eval`, scripts externos,
  Web Storage, cookies, autenticação, upload, banco, service worker ou `postMessage`.
- O endpoint de imagens aceita somente caminhos locais, limita parâmetros, bloqueia
  SVG por padrão, valida `Content-Type` e aplica CSP própria e `nosniff`.
- O Worker mantém `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP,
  `frame-ancestors`, `object-src 'none'`, `form-action` e `connect-src 'self'`.
- O lockfile contém hashes de integridade e o build não publica source maps nem
  executáveis legados.
- `.env*`, artefatos locais e `.codex-remote-attachments/` permanecem fora do Git.

## Próxima revisão

Reabrir a modelagem de ameaças se forem adicionados autenticação, dados pessoais,
API, persistência, conteúdo rico, URLs externas, uploads, telemetria ou publicação
em uma infraestrutura diferente.

Referências: [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit/),
[React — `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common#dangerouslysetting-the-inner-html),
[GitHub Dependency Review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review)
e [Cloudflare Workers Observability](https://developers.cloudflare.com/workers/wrangler/configuration/#observability).
