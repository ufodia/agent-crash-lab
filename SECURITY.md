# Security policy

The current 1.x source on `main` is the supported version. Install dependency updates from reviewed changes and rerun the included checks.

Report a suspected vulnerability through **GitHub Security → Advisories → Report a vulnerability** on this repository if private reporting is enabled. If that control is unavailable, open a public issue containing only a request for a private reporting channel; do not include exploit details, private traces, or secrets.

Useful reports identify the affected commit, reproduction conditions, expected trust boundary, and a minimal synthetic example. Please avoid testing against unrelated accounts or public services. We do not promise a fixed response time or paid bounty.

Imported JSON is data, not code. The application renders imported strings as text and limits import sizes. External adapters remain responsible for isolating their own agent execution and excluding sensitive values from exported evidence.
