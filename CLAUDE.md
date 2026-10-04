# CLAUDE.md — EventPilot

> Contexto do projeto para o Claude Code. Leia este arquivo inteiro antes de qualquer tarefa.

## 1. O que é o EventPilot

CLI + plataforma open-core para **arquitetura orientada a eventos**. Em um comando, o dev escolhe linguagem, broker, contratos e recursos; o EventPilot gera a infra local (Docker), o código base e um painel web para configurar tópicos/schemas/consumidores, ver o fluxo de eventos ao vivo e acompanhar métricas.

**Inspirações de modelo:** n8n, Supabase, Grafana (núcleo open source auto-hospedável + camada paga de conveniência/time).
**Inspirações de DX:** `create-next-app`, `npm create vite`, Expo.

### Problema que resolve

- Montar um ambiente de eventos local exige um Compose gigante e muita cola.
- Difícil enxergar "este evento disparou quais consumidores".
- Padrões difíceis (Outbox, Saga, idempotência, DLQ, retry) são reimplementados do zero toda vez.
- Contratos entre produtores e consumidores quebram sem aviso.

### Fora de escopo (por enquanto)

- Não é um broker novo. Usa Redpanda/Kafka/RabbitMQ/NATS.
- Não é um orquestrador de workflows (Temporal/n8n já existem).
- Sem suporte a cloud brokers (SQS/SNS) no MVP.

## 2. Princípios

1. **YAML é a fonte da verdade** (`eventpilot.yaml`). Todo o resto (compose, código, painel) deriva dele.
2. **Núcleo agnóstico** de linguagem e broker; tudo específico vive em plugins.
3. **Modular:** cada recurso liga/desliga no YAML e pode ser adicionado depois com `eventpilot add`.
4. **Um comando para começar:** `npx eventpilot init` deve funcionar sem instalar nada além de Node e Docker.
5. **Começar pequeno:** 1 broker + 2 linguagens, mas com a interface de plugins já estável.
6. **Idempotência:** rodar `init`, `generate` ou `add` duas vezes não pode quebrar nem duplicar nada.

## 3. Escopo do MVP

- **Broker:** Redpanda (padrão).
- **Linguagens geradas:** Node/TypeScript e Java.
- **Contratos:** AsyncAPI (validação) + JSON Schema.
- **Recursos:** painel básico, grafo de eventos ao vivo, métricas (throughput, lag, erros, DLQ), DLQ/retry, Outbox, replay simples.
- **Fora do MVP:** Saga, Avro, simulador de falhas, multi-ambiente, SSO/RBAC (pago).

## 4. Arquitetura

```
┌──────────────┐    gera     ┌───────────────────────────┐
│     CLI      │ ──────────▶ │ eventpilot.yaml + compose │
│ (wizard/add) │             │ + código base (templates) │
└──────┬───────┘             └───────────┬───────────────┘
       │ sobe                            │
       ▼                                 ▼
┌─────────────────────────────────────────────────────┐
│ Docker: broker (Redpanda) + schema registry + core  │
└──────────────┬──────────────────────────────────────┘
               │ API / WebSocket
       ┌───────▼────────┐        ┌────────────────────┐
       │  Control plane │◀───────│ Agente/SDK leve    │
       │ (API + painel) │ traces │ (nos serviços do   │
       └────────────────┘        │  usuário)          │
                                 └────────────────────┘
```

### Camadas

1. **CLI** — wizard interativo, comandos `init`, `up`, `down`, `generate`, `add`, `validate`, `doctor`.
2. **Core** — parser/validador do YAML, resolução de plugins, geração de arquivos.
3. **Plugins**
   - **Broker adapters:** interface comum (criar tópico, listar, métricas, produzir/consumir para replay).
   - **Language generators:** templates de producer, consumer, outbox, retry, DLQ.
   - **Feature modules:** `metrics`, `dlq`, `outbox`, `replay`, depois `saga`.
4. **Control plane** — API + painel web (config, grafo ao vivo, métricas).
5. **Agente/SDK** — envia telemetria/traces dos eventos ao control plane (propaga `correlation_id`/`causation_id`).

### Modelo de integração: greenfield vs. brownfield

O control plane (API + painel) é um processo **separado** do(s) serviço(s) do usuário — é o que `eventpilot up` sobe via Docker. Existem dois jeitos de usar o EventPilot, e nenhum exige recriar o projeto do zero dentro dele:

1. **Greenfield (projeto novo):** `eventpilot init`/`add` geram o código base (producer/consumer/outbox/DLQ) já com o SDK integrado. Útil para começar do zero ou como referência de implementação dos padrões.
2. **Brownfield (API já existente):** o usuário instala o SDK (`sdk-node` ou `sdk-java`) como dependência na própria API e configura via variáveis de ambiente:
   - `EVENTPILOT_CONTROL_PLANE_URL` — endereço do control plane, para onde o SDK envia telemetria/traces.
   - endereço do broker — o mesmo que o serviço já usa para produzir/consumir eventos.

   O SDK então propaga `correlation_id`/`causation_id` nos eventos e reporta os traces ao control plane, que alimenta o grafo ao vivo e as métricas no painel. Não é necessário usar o código gerado pelos templates — o usuário pode adaptar só os padrões (ex: Outbox) manualmente, ou plugar apenas o SDK.

No MVP local, `EVENTPILOT_CONTROL_PLANE_URL` aponta para o control plane rodando em Docker. Em produção (fora do MVP, mas objetivo futuro do projeto), apontaria para onde o control plane estiver hospedado — a interface do SDK não deve mudar entre os dois casos.

## 5. Stack

| Camada        | Tecnologia                                                                       |
| ------------- | -------------------------------------------------------------------------------- |
| Monorepo      | pnpm workspaces + Turborepo                                                      |
| CLI           | Node 20+ / TypeScript, `commander`, `@clack/prompts` (wizard), `zod` (validação) |
| Templates     | Handlebars (arquivos `.hbs` por linguagem/feature)                               |
| Core / API    | Node/TypeScript, Fastify, WebSocket para stream ao vivo                          |
| Painel        | React + Vite (ou Next.js), Tailwind, React Flow (grafo de eventos)               |
| Config store  | PostgreSQL                                                                       |
| Métricas      | TimescaleDB no MVP (ClickHouse como evolução)                                    |
| Broker padrão | Redpanda                                                                         |
| Testes        | Vitest, Testcontainers, Playwright (painel)                                      |
| Qualidade     | ESLint, Prettier, Changesets (versionamento), GitHub Actions                     |
| SDK Java      | Maven/Gradle, publicável no Maven Central                                        |

## 6. Estrutura do repositório

```
eventpilot/
├─ CLAUDE.md
├─ README.md
├─ LICENSE
├─ CONTRIBUTING.md
├─ pnpm-workspace.yaml
├─ turbo.json
├─ packages/
│  ├─ cli/                 # comandos e wizard
│  ├─ core/                # schema do YAML, loader, plugin registry
│  ├─ plugin-api/          # interfaces TS dos plugins (contrato público)
│  ├─ broker-redpanda/     # adapter Redpanda/Kafka
│  ├─ gen-node/            # templates Node/TS
│  ├─ gen-java/            # templates Java
│  ├─ feature-dlq/
│  ├─ feature-outbox/
│  ├─ feature-metrics/
│  ├─ feature-replay/
│  └─ sdk-node/            # agente de telemetria (Node)
├─ apps/
│  ├─ control-plane-api/
│  └─ dashboard/
├─ sdk/
│  └─ java/                # agente de telemetria (Java)
├─ examples/
│  ├─ orders-node/
│  └─ orders-java/
└─ docs/
```

## 7. Exemplo de `eventpilot.yaml`

```yaml
version: 1
project:
  name: orders-platform

broker:
  type: redpanda
  version: "latest"

contracts:
  format: asyncapi # asyncapi | json-schema
  path: ./contracts

services:
  - name: order-service
    language: node-ts # node-ts | java
    produces: [order.created, order.cancelled]
    consumes: [payment.confirmed]
  - name: payment-service
    language: java
    produces: [payment.confirmed]
    consumes: [order.created]

topics:
  - name: order.created
    partitions: 3
    retention: 7d
    schema: ./contracts/order.created.json
    dlq: true

features:
  dashboard: true
  metrics: true
  dlq: { maxRetries: 5, backoff: exponential }
  outbox: { enabled: true, store: postgres }
  replay: true
```

## 8. Contrato dos plugins (rascunho)

```ts
// packages/plugin-api/src/index.ts
export interface BrokerAdapter {
  id: string;
  composeService(cfg: BrokerConfig): ComposeFragment;
  createTopic(t: TopicConfig): Promise<void>;
  listTopics(): Promise<TopicInfo[]>;
  getMetrics(topic: string): Promise<TopicMetrics>;
  readRange(topic: string, range: Range): AsyncIterable<EventRecord>; // replay
  publish(topic: string, e: EventRecord): Promise<void>;
}

export interface LanguageGenerator {
  id: string; // "node-ts" | "java"
  generate(ctx: GenerateContext): Promise<GeneratedFile[]>;
}

export interface FeatureModule {
  id: string; // "dlq" | "outbox" | ...
  configSchema: ZodTypeAny;
  apply(ctx: FeatureContext): Promise<GeneratedFile[]>;
}
```

Regras: o `core` nunca importa um adapter/gerador diretamente — sempre via registry. Mudanças em `plugin-api` são breaking changes e exigem changeset major.

## 9. Comandos do CLI

| Comando                    | O que faz                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `eventpilot init`          | Wizard: linguagem, broker, contratos, recursos → gera `eventpilot.yaml`, compose e código |
| `eventpilot up` / `down`   | Sobe/derruba a infra Docker                                                               |
| `eventpilot generate`      | Regenera arquivos a partir do YAML (idempotente)                                          |
| `eventpilot add <feature>` | Adiciona recurso (`dlq`, `outbox`, `replay`...) a projeto existente                       |
| `eventpilot validate`      | Valida YAML e contratos AsyncAPI/JSON Schema (usável no CI)                               |
| `eventpilot doctor`        | Checa Docker, portas, versões                                                             |
| `eventpilot dashboard`     | Abre o painel local                                                                       |

## 10. Roadmap

**Fase 0 — Fundação**

- [x] Monorepo (pnpm + Turbo), lint, format, CI
- [x] `plugin-api` e `core` com schema Zod do YAML
- [x] README com visão (GIF do wizard ainda pendente — precisa do wizard gravável)

**Fase 1 — CLI + infra**

- [x] `init` com wizard e geração do compose (Redpanda + registry)
- [x] `up`, `down`, `doctor`
- [x] Gerador Node/TS (producer/consumer básicos)
- [ ] `getMetrics`/`readRange` do `BrokerAdapter` Redpanda (hoje lançam erro explícito — dependem do control plane, Fase 3)

**Fase 2 — Recursos**

- [x] DLQ/retry (`@eventpilot/feature-dlq`, só node-ts por ora)
- [x] `add <feature>` (implementado para `dlq`; outbox/metrics/replay ainda recusam com mensagem clara)
- [x] Tópicos declarados no YAML agora são provisionados de verdade no broker (`eventpilot up`/`generate`), incluindo `<topic>.dlq`
- [ ] Outbox
- [ ] `validate` com AsyncAPI (hoje só valida a forma do YAML, não o schema dos contratos)
- [ ] Gerador Java

**Fase 3 — Observabilidade**

- [x] Control plane API (`apps/control-plane-api`): `/api/config`, `/api/topics` (live do broker), `/ws/events`
- [x] Painel (`apps/dashboard`, React+Vite+Tailwind+React Flow): tópicos, grafo estático produtor→tópico→consumidor, feed de eventos ao vivo
- [ ] SDK Node/Java que propaga `correlation_id`/`causation_id` e reporta traces ao control plane — **ainda não existe**: o feed ao vivo hoje funciona porque o control plane lê o broker diretamente (`LiveTail`, ver `apps/control-plane-api/README.md`), não porque o SDK empurra telemetria como a arquitetura da seção 4 descreve
- [ ] Métricas (throughput, lag, erros, DLQ) — depende do pipeline de telemetria acima + TimescaleDB; `getMetrics` do broker ainda lança erro explícito
- [ ] Replay simples
- [ ] `eventpilot dashboard` ainda não inicia o control plane/painel automaticamente (ver instruções manuais que o comando imprime); falta empacotar isso no CLI

**Fase 4 — Open-core**

- [ ] Definir licença e limites open source vs. pago
- [ ] Versão hospedada, SSO/RBAC, auditoria, retenção longa (pago)

## 11. Convenções

- **Idioma:** código, commits, issues e docs públicas em **inglês** (comunidade); conversa com o Claude pode ser em português.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...).
- **TypeScript:** `strict: true`, sem `any` sem justificativa, ESM.
- **Erros:** mensagens do CLI devem dizer o que deu errado **e** como corrigir.
- **Arquivos gerados:** sempre com cabeçalho indicando que foram gerados; nunca sobrescrever edição manual sem confirmar (usar flag `--force`).
- **Testes:** todo plugin tem testes; geradores com snapshot tests; adapters com Testcontainers.
- **Dependências:** preferir poucas e mantidas; justificar novas no PR.
- **Versionamento:** Changesets, semver estrito para `plugin-api` e `core`.

## 12. Decisões tomadas (sem checagem prévia, a pedido do Lucas em 2026-10-04 — revisitar se algo não fizer sentido)

1. **Licença:** Apache-2.0. Adoção máxima; permite terceiros revenderem hospedado, mas simplifica contribuição externa enquanto não há camada paga. Pode migrar para BSL/Sustainable Use mais perto do primeiro release público pago.
2. **Painel:** React + Vite. Mais simples, compatível com "começar pequeno"; ainda não implementado (Fase 3).
3. **Métricas:** TimescaleDB (já refletido na seção 5).
4. **Distribuição do CLI:** só `npx`/`npm` por enquanto (pacote `eventpilot`, scope `@eventpilot/*` livres no npm). Binário único (Go/pkg) fica para quando houver tração.

## 13. Como o Claude deve trabalhar neste repo

- Antes de implementar, confirme em qual **fase do roadmap** a tarefa se encaixa; não antecipe fases futuras.
- Respeite as fronteiras: `core` não conhece brokers/linguagens específicos.
- Ao criar um plugin novo, copie a estrutura de um existente e adicione testes.
- Mudou o schema do YAML? Atualize `core`, o exemplo da seção 7, a documentação e os testes.
- Prefira PRs pequenos e focados; rode `pnpm lint && pnpm test` antes de concluir.
- Se algo estiver ambíguo ou for uma decisão da seção 12, pergunte em vez de assumir.

## 14. Comandos de desenvolvimento

```bash
pnpm install          # instala dependências
pnpm build            # build de todos os pacotes (turbo)
pnpm dev              # modo watch
pnpm test             # testes
pnpm lint             # lint + typecheck
pnpm changeset        # registrar mudança para release
```
