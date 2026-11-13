import { describe, expect, it } from 'vitest';
import { atStep, parseTrace, scenarioIds, simulate } from './engine';

describe('durable side effects', () => {
  it('exposes timeout duplicates and avoids them with stable keys', () => {
    const naive = simulate('timeout-after-commit', 'naive').snapshots.at(-1)!;
    const safe = simulate('timeout-after-commit', 'safe').snapshots.at(-1)!;
    expect(naive.effects).toEqual(['invoice:104', 'invoice:104']);
    expect(naive.violations).toBe(1);
    expect(safe.effects).toEqual(['invoice:104']); expect(safe.violations).toBe(0);
  });
  it('reconciles partially committed batches', () => {
    expect(simulate('partial-batch', 'naive').snapshots.at(-1)!.effects).toHaveLength(5);
    expect(simulate('partial-batch', 'safe').snapshots.at(-1)!.effects).toHaveLength(3);
  });
  it('rebases on concurrent state instead of overwriting it', () => {
    expect(simulate('stale-state', 'safe').snapshots.at(-1)!.value).toBe('$90 · revision 3');
    expect(simulate('stale-state', 'naive').snapshots.at(-1)!.value).toBe('$110 · revision 3');
  });
  it('keeps the newest response', () => expect(simulate('out-of-order-reply', 'safe').snapshots.at(-1)!.value).toBe('Sent · revision 2'));
  for (const scenario of scenarioIds) it(`has repeatable failure and recovery for ${scenario}`, () => {
    const safe = simulate(scenario, 'safe');
    expect(safe).toEqual(simulate(scenario, 'safe'));
    expect(safe.snapshots.at(-1)!.violations).toBe(0);
    expect(simulate(scenario, 'naive').snapshots.at(-1)!.violations).toBeGreaterThan(0);
    expect(parseTrace(JSON.stringify(safe))).toEqual(safe);
  });
});
describe('replay boundaries', () => {
  it('starts empty and clamps at the last event', () => {
    const trace = simulate('partial-batch', 'safe');
    expect(atStep(trace, 0)).toBeNull(); expect(atStep(trace, 999)).toEqual(trace.snapshots.at(-1));
    expect(() => atStep(trace, -1)).toThrow();
  });
  it('does not share mutable state between snapshots or runs', () => {
    const t = simulate('partial-batch', 'safe'); t.snapshots[0].effects.push('external');
    expect(t.snapshots[1].effects).not.toContain('external');
    expect(simulate('partial-batch', 'safe').snapshots[0].effects).toEqual([]);
  });
  it('rejects malformed imported traces', () => {
    expect(() => parseTrace('{}')).toThrow();
    const t = simulate('timeout-after-commit', 'safe'); t.snapshots[0].event.step = 99;
    expect(() => parseTrace(JSON.stringify(t))).toThrow();
  });
  it('discards unchecked extension data so a valid import stays exportable', () => {
    const trace = simulate('timeout-after-commit', 'safe');
    const text = JSON.stringify(trace).slice(0, -1) + ',"extension":' + '['.repeat(20000) + '0' + ']'.repeat(20000) + '}';
    const parsed = parseTrace(text);
    expect(parsed).toEqual(trace);
    expect(() => JSON.stringify(parsed)).not.toThrow();
  });
});
