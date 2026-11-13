# Trace format: `agent-crash-lab/1`

Each exported file is one trace. You can import a built-in export unchanged or generate the same structure from an adapter.

```json
{
  "format": "agent-crash-lab/1",
  "scenario": "timeout-after-commit",
  "policy": "safe",
  "snapshots": [
    {
      "event": {
        "step": 1,
        "label": "Task accepted",
        "detail": "Deliver invoice INV-104.",
        "tone": "info",
        "node": "agent"
      },
      "effects": [],
      "value": "Waiting",
      "violations": 0
    }
  ]
}
```

| Field | Contract |
| --- | --- |
| `format` | Exactly `agent-crash-lab/1` |
| `scenario` | `timeout-after-commit`, `duplicate-delivery`, `partial-batch`, `stale-state`, or `out-of-order-reply` |
| `policy` | `naive` or `safe`; an author-supplied label for imported traces |
| `snapshots` | 1–1,000 entries, in playback order |
| `event.step` | Consecutive integers starting at 1 |
| `event.label` | String up to 200 characters |
| `event.detail` | String up to 5,000 characters |
| `event.tone` | `info`, `success`, `warning`, or `failure` |
| `event.node` | `agent`, `network`, or `store` |
| `effects` | Full ledger at that step; at most 5,000 string IDs of at most 200 characters each |
| `value` | Displayed observable state; string up to 1,000 characters |
| `violations` | Integer from 0 through 1,000,000, determined by the producer |

The browser rejects files larger than 2,000,000 bytes. The parser additionally limits the serialized string to 2,000,000 JavaScript characters. Keep adapters well below both limits. Unknown extra fields are discarded on import and are not included in replay exports.

Repeated effect IDs are deliberately valid: they represent duplicated physical effects of one logical operation. The format does not prove completeness, chronology outside the supplied sequence, or integrity against tampering.
