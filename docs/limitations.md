# Limitations and trust boundaries

- The built-in agents are deterministic policies, not live language models. They illustrate mechanisms and do not measure a vendor or model.
- The five scenarios are deliberately small. Real systems have additional failures, races, retention windows, partial idempotency guarantees, and consistency models.
- Imported traces are untrusted observations. Structural validation prevents malformed playback but does not independently verify committed effects or violation counts.
- A guarded policy works under each modeled service contract. This does not mean adding a key or retrying automatically makes any API safe.
- The simulator does not send real email, change calendars, write external files, charge cards, execute imported code, or contact model endpoints.
- The browser holds data in memory. Refreshing clears it; exported JSON is plain text and may contain private information if your adapter inserts it.
- The interface is responsive and supports keyboard operation and reduced motion. Formal assistive-technology certification is not claimed.

Use the lab for explanation, local adapter experiments, and reviewing recovery designs. Independently test actual integrations against their documented service contracts before using them with real accounts.
