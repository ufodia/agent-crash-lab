export const scenarioIds = ['timeout-after-commit', 'duplicate-delivery', 'partial-batch', 'stale-state', 'out-of-order-reply'] as const;
export type ScenarioId = typeof scenarioIds[number];
export type Policy = 'naive' | 'safe';
export type Tone = 'info' | 'success' | 'warning' | 'failure';
export interface Event { step: number; label: string; detail: string; tone: Tone; node: 'agent' | 'network' | 'store'; }
export interface Snapshot { event: Event; effects: string[]; value: string; violations: number; }
export interface Trace { format: 'agent-crash-lab/1'; scenario: ScenarioId; policy: Policy; snapshots: Snapshot[]; }
export interface Scenario { id: ScenarioId; name: string; caption: string; question: string; invariant: string; }
export const scenarios: Scenario[] = [
  { id: 'timeout-after-commit', name: 'The missing receipt', caption: 'TIMEOUT AFTER COMMIT', question: 'The invoice was sent. The reply never arrived. What happens on retry?', invariant: 'One logical invoice must produce exactly one delivery.' },
  { id: 'duplicate-delivery', name: 'Déjà vu delivery', caption: 'DUPLICATE DELIVERY', question: 'The queue delivers the same task twice. Does the agent notice?', invariant: 'Duplicate task delivery must not duplicate its side effect.' },
  { id: 'partial-batch', name: 'Half a job', caption: 'PARTIAL BATCH', question: 'Two of three files were published before a crash. Where do you resume?', invariant: 'Each file must be published exactly once, including after restart.' },
  { id: 'stale-state', name: 'Yesterday’s numbers', caption: 'STALE STATE', question: 'A colleague changed the budget after the agent read it. Whose work survives?', invariant: 'A stale write must not overwrite a concurrent update.' },
  { id: 'out-of-order-reply', name: 'Back to the future', caption: 'OUT-OF-ORDER REPLY', question: 'The newer response arrives first. Can an old response roll the UI backward?', invariant: 'Displayed state must never regress to an older revision.' },
];

/** Build a repeatable local simulation. Nothing outside this data structure is changed. */
export function simulate(scenario: ScenarioId, policy: Policy): Trace {
  if (!scenarioIds.includes(scenario) || !['safe', 'naive'].includes(policy)) throw new Error('Unknown scenario or policy.');
  const safe = policy === 'safe';
  const effects: string[] = [];
  const snapshots: Snapshot[] = [];
  let value = 'Waiting';
  let violations = 0;
  const add = (label: string, detail: string, node: Event['node'] = 'agent', tone: Tone = 'info') => snapshots.push({ event: { step: snapshots.length + 1, label, detail, tone, node }, effects: [...effects], value, violations });
  const commit = (id: string) => { if (!safe || !effects.includes(id)) effects.push(id); };
  if (scenario === 'timeout-after-commit' || scenario === 'duplicate-delivery') {
    add('Task accepted', 'Deliver invoice INV-104. Logical operation ID: invoice:104.');
    add('Request dispatched', safe ? 'Attach stable idempotency key invoice:104.' : 'Send request without a stable operation key.', 'network');
    commit('invoice:104'); value = 'Invoice delivered';
    add('Server commits', 'The delivery is durable before the client receives a response.', 'store', 'success');
    add(scenario === 'timeout-after-commit' ? 'Receipt lost' : 'Task redelivered', scenario === 'timeout-after-commit' ? 'A timeout hides a successful commit. The outcome is unknown to the caller.' : 'The queue repeats the same logical operation ID.', 'network', 'warning');
    add('Retry begins', safe ? 'Reuse the original key; do not infer failure from a timeout.' : 'Treat missing confirmation as a failed operation.', 'agent', 'warning');
    commit('invoice:104'); violations = safe ? 0 : 1;
    add(safe ? 'Existing result returned' : 'Second delivery committed', safe ? 'The server recognizes the key and returns the original result.' : 'Two physical deliveries now exist for one logical task.', 'store', safe ? 'success' : 'failure');
  } else if (scenario === 'partial-batch') {
    add('Batch accepted', 'Publish report-A, report-B, and report-C. Each file has a stable operation ID.');
    commit('publish:A'); value = '1 of 3 unique files'; add('First file published', 'report-A is durable.', 'store', 'success');
    commit('publish:B'); value = '2 of 3 unique files'; add('Second file published', 'report-B is durable, but local progress has not been saved.', 'store', 'success');
    add('Agent process crashes', 'The process loses its in-memory progress.', 'agent', 'warning');
    add('Recovery starts', safe ? 'Reconcile stable operation IDs with durable state.' : 'Restart the entire batch with no reconciliation.', 'agent', 'warning');
    for (const id of ['publish:A', 'publish:B', 'publish:C']) commit(id);
    value = '3 of 3 unique files'; violations = safe ? 0 : 2;
    add('Batch finished', safe ? 'A and B are recognized; only C creates a new side effect.' : 'A and B are published twice. C is published once.', 'store', safe ? 'success' : 'failure');
  } else if (scenario === 'stale-state') {
    value = '$100 · revision 1'; add('Read current budget', 'The agent intends to increase the latest budget by $10.', 'store');
    value = '$80 · revision 2'; effects.push('colleague:update:80'); add('Concurrent edit', 'A colleague changes the budget to $80, revision 2.', 'store', 'warning');
    add('Agent submits stale write', safe ? 'Send expectedRevision=1 with the proposed update.' : 'Unconditionally write the value calculated from $100.', 'network', 'warning');
    if (safe) {
      add('Precondition rejected', 'Revision 1 is stale. No agent write is committed.', 'store', 'success');
      add('Read and rebase', 'Read $80 at revision 2, then calculate $80 + $10.');
      value = '$90 · revision 3'; effects.push('agent:update:90');
      add('Conditional write accepted', 'Revision 2 still matches. The colleague’s update survives.', 'store', 'success');
    } else {
      value = '$110 · revision 3'; effects.push('agent:update:110'); violations = 1;
      add('Concurrent edit lost', 'The stale calculation overwrites the newer $80 budget.', 'store', 'failure');
    }
  } else {
    value = 'Draft · revision 1'; add('Two requests in flight', 'A draft read and a later sent read are both pending.', 'network');
    effects.push('send:104'); add('Server advances state', 'The invoice changes from draft (revision 1) to sent (revision 2).', 'store', 'success');
    value = 'Sent · revision 2'; add('New response arrives', 'The UI displays sent at revision 2.', 'network', 'success');
    add('Old response arrives late', 'The delayed draft response carries revision 1.', 'network', 'warning');
    if (safe) add('Stale response ignored', 'The monotonic revision guard keeps revision 2 on screen.', 'agent', 'success');
    else { value = 'Draft · revision 1'; violations = 1; add('UI state regresses', 'Arrival order wins over revision order. The UI now lies about delivery.', 'agent', 'failure'); }
  }
  return { format: 'agent-crash-lab/1', scenario, policy, snapshots };
}

/** Validate user-provided replay data; imported traces are evidence, not trusted code. */
export function parseTrace(text: string): Trace {
  if (text.length > 2_000_000) throw new Error('Trace exceeds the 2 MB text limit.');
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Trace must be an object.');
  const t = data as Record<string, unknown>;
  if (t.format !== 'agent-crash-lab/1' || !scenarioIds.includes(t.scenario as ScenarioId) || !['naive', 'safe'].includes(t.policy as string) || !Array.isArray(t.snapshots) || t.snapshots.length < 1 || t.snapshots.length > 1000) throw new Error('Unsupported trace format, scenario, policy, or snapshot count.');
  for (const [index, raw] of t.snapshots.entries()) {
    if (!raw || typeof raw !== 'object') throw new Error('Invalid snapshot.');
    const s = raw as Record<string, unknown>;
    const e = s.event as Record<string, unknown> | undefined;
    if (!e || e.step !== index + 1 || typeof e.label !== 'string' || typeof e.detail !== 'string' || e.label.length > 200 || e.detail.length > 5000 || !['agent', 'network', 'store'].includes(e.node as string) || !['info', 'success', 'warning', 'failure'].includes(e.tone as string) || !Array.isArray(s.effects) || s.effects.length > 5000 || s.effects.some(v => typeof v !== 'string' || v.length > 200) || typeof s.value !== 'string' || s.value.length > 1000 || !Number.isInteger(s.violations) || (s.violations as number) < 0 || (s.violations as number) > 1_000_000) throw new Error(`Invalid snapshot at step ${index + 1}.`);
  }
  // Keep only the documented, validated fields. Unchecked extension data can be
  // deeply nested and must not break replay exports after an otherwise valid import.
  const snapshots = (t.snapshots as Snapshot[]).map(s => ({
    event: { step: s.event.step, label: s.event.label, detail: s.event.detail, tone: s.event.tone, node: s.event.node },
    effects: [...s.effects], value: s.value, violations: s.violations,
  }));
  return { format: 'agent-crash-lab/1', scenario: t.scenario as ScenarioId, policy: t.policy as Policy, snapshots };
}

export function atStep(trace: Trace, cursor: number): Snapshot | null {
  if (!Number.isInteger(cursor) || cursor < 0) throw new Error('Cursor must be a nonnegative integer.');
  return trace.snapshots[Math.min(cursor, trace.snapshots.length) - 1] ?? null;
}
