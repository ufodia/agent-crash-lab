# Changelog

## Reliability fixes — 2026-11-13

- Normalize replay imports to validated trace fields so unchecked extensions cannot break export.
- Keep newer scenario/reset actions when an older file read finishes late.
- Cover the import race in the browser suite and document replay normalization.

## 1.0.0 — 2026-11-13

- Add five deterministic failure scenarios with naive and guarded policies.
- Add event playback, stepping, reset, durable effect ledgers, and invariant counts.
- Add validated JSON trace replay and export.
- Add a local TypeScript CLI and documented engine API.
- Add regression tests, reproducible dependency lockfile, and checks-only CI.
- Add English guides, local visual assets, MIT licensing, and Ufodia support links.
