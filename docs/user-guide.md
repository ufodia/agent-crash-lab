# User guide

## Your first experiment

1. Run `npm ci` and `npm run dev` from the repository root.
2. Open the local URL printed in your terminal.
3. Select **The missing receipt**.
4. Click **Step** three times. The state vault has committed the invoice before the reply reaches the caller.
5. Continue stepping. A timeout makes the outcome unknown to the caller.
6. At the end, compare two naive deliveries with one guarded delivery.

The guarded policy reuses an operation ID. The server recognizes that ID and returns its existing result. This demonstration assumes the server supports durable idempotency; merely attaching a header to an arbitrary service is not enough.

## Playback

**Run experiment** advances automatically. **Pause** freezes the cursor. **Step** stops playback and advances one event. **Reset** returns to event zero. Changing the pace pauses a running experiment. Select a different scenario to leave an imported trace and return to built-in comparisons.

The left timeline shows the naive policy (or the imported trace). Both policy cards show their own state at the cursor. Timelines have different lengths in the stale-state case; a completed policy retains its last snapshot.

## Exports and imports

**Export traces** downloads two JSON files for built-in experiments. Some browsers ask whether to allow multiple downloads. For a single file, use the CLI with a policy argument. Imported traces export as one JSON file.

**Replay a trace** accepts one UTF-8 JSON file up to 2 MB. It must use the documented format. Invalid imports leave the previous experiment intact and show an error. Imported labels, values, effects, and violation counts come from the producer; the app does not assert that those observations are truthful.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| `npm ci` reports an unsupported engine | Use Node.js 24 and the included lockfile |
| Port 5173 is occupied | Use the next local URL Vite prints, or `npm run dev -- --port 5174` |
| Only one trace downloads | Allow multiple downloads or use the CLI |
| Replay is rejected | Check `format`, scenario ID, policy, ordered steps, and field types in [formats](formats.md) |
| The page appears unchanged after editing | Check the Vite terminal for a compile error and refresh |

The app does not save sessions automatically. Export a trace before closing the page if you need to retain it.
