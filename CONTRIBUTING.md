# Contributing

Thank you for helping make agent failures easier to understand.

1. Install Node.js 24, clone the repository, and run `npm ci`.
2. Create a focused branch for one behavior change.
3. Run `npm run dev` to inspect the interface.
4. Add a meaningful regression test for engine changes. Keep scenarios deterministic and synthetic.
5. Run `npm run typecheck`, `npm test`, and `npm run build`.
6. Update docs, examples, and `CHANGELOG.md` when behavior changes.
7. Open a pull request explaining the problem, resulting behavior, and verification. Include screenshots for visual changes.

Good first contributions include clearer event explanations, reduced examples of recovery mistakes, keyboard usability fixes, or tests for malformed imports. Discuss a new scenario before introducing a large adapter or runtime dependency.

Do not upload private traces, credentials, customer data, or real payment details. Contributions are licensed under the repository's MIT License. Follow the [code of conduct](CODE_OF_CONDUCT.md).
