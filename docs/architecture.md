# Architecture and engine API

```text
Scenario + policy ──→ simulate() ──→ immutable-by-convention snapshots
                                           │
                        ┌──────────────────┼──────────────────┐
                        ▼                  ▼                  ▼
                   Browser UI         JSON download      CLI output
                        ▲
                   parseTrace()
                        ▲
                 External adapter JSON
```

## Modules

- `src/engine.ts`: scenario catalog, deterministic simulator, replay validation, and cursor lookup. It has no DOM, storage, or network dependencies.
- `src/main.ts`: browser event handling, playback, ledger rendering, import and export. User-provided text is rendered with `textContent`.
- `src/style.css`: responsive mission-control interface with reduced-motion support.
- `cli/run.ts`: local CLI for simulation and structural replay validation.

## Public functions

### `simulate(scenario: ScenarioId, policy: Policy): Trace`

Returns a fresh trace. Valid scenario IDs are exported in `scenarioIds`; policies are `naive` and `safe`. Invalid arguments throw. Every snapshot copies the effect ledger, so later simulation steps do not mutate earlier observations. Callers should treat the returned trace as read-only.

```ts
import { simulate } from './src/engine.ts';

const trace = simulate('timeout-after-commit', 'safe');
console.log(trace.snapshots.at(-1)?.effects); // ['invoice:104']
```

### `parseTrace(text: string): Trace`

Parses and validates a serialized external trace. Throws a readable error for malformed fields, unsupported values, unordered steps, or limits. This is a format check, not an attestation or an invariant verifier for arbitrary external systems.

### `atStep(trace: Trace, cursor: number): Snapshot | null`

Returns `null` for zero. Positive integer cursors are one-based and clamp to the last snapshot. Negative or noninteger cursors throw.

## Writing an adapter

Run your agent in your own isolated test environment, then emit the [trace format](formats.md). Each snapshot records the full currently durable effect ledger, observable value, a scenario-specific invariant violation count, and one event. Use stable logical operation IDs to make duplicates inspectable.

The adapter is responsible for determining durable state and violations from its environment. A model's final narrative alone is not sufficient evidence of a commit. Never connect an unreviewed adapter to live payment, email, or production systems just to recreate these examples.

## Recovery semantics

The guarded policies assume an idempotency-aware server, durable operation lookup, conditional revision writes, or revision-tagged responses, depending on the experiment. These contracts are explicitly modeled; the engine does not claim to add them to arbitrary services.

## Build and restore

Restore the repository from GitHub, install Node.js 24, run `npm ci`, then run the documented checks and `npm run dev`. `dist/` is reproducible build output and is intentionally ignored. No secrets, external database, or private configuration are required.
