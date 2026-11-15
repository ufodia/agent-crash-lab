import { atStep, parseTrace, scenarios, simulate, type ScenarioId, type Trace } from './engine';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="topbar"><a class="brand" href="./"><span class="brand-icon">A↗</span><span>agent crash lab<small>BY UFODIA</small></span></a><nav aria-label="Project links"><span class="local"><i></i> LOCAL SIMULATION</span><a href="https://github.com/ufodia/agent-crash-lab" target="_blank" rel="noreferrer">Source ↗</a><a class="coffee" href="https://buymeacoffee.com/ufodia" target="_blank" rel="noreferrer">Buy me a coffee ↗</a></nav></header>
  <main><section class="intro"><div><p class="eyebrow">A FLIGHT SIMULATOR FOR AGENT WORKFLOWS</p><h1>Rehearse the failure.<br><span>Keep the real world intact.</span></h1><p class="lede">Drop a receipt. Repeat a task. Turn back the clock.<br>Watch a careless retry become a duplicate side effect.</p></div><div class="intro-note"><span>EXPERIMENT 001—005</span><p>Failure is a feature.<br>Surprise is optional.</p><small>Deterministic policies. No live AI, accounts, or network calls.</small></div></section>
  <section class="workspace" aria-label="Crash simulator"><aside class="scenario-panel"><div class="section-label">01 / CHOOSE A FAILURE</div><div id="scenarios"></div><div class="legend"><span class="dot naive"></span> Naive: retries without safeguards<br><span class="dot safe"></span> Guarded: keys, reconciliation, revisions</div></aside>
  <div class="experiment"><div class="experiment-heading"><div><p id="scenario-caption" class="eyebrow"></p><h2 id="scenario-title"></h2></div><span id="run-status" class="status" role="status">Ready to rehearse</span></div><p id="scenario-question" class="question"></p>
  <div class="office" aria-label="Virtual agent environment"><div class="office-node" data-node="agent"><span class="node-glyph">◉</span><strong>Agent desk</strong><small>Decide · retry · recover</small></div><div class="connector">················<span>REQUEST / REPLY</span></div><div class="office-node" data-node="network"><span class="node-glyph">⌁</span><strong>Unreliable network</strong><small>Delay · repeat · disappear</small></div><div class="connector">················<span>DURABLE COMMIT</span></div><div class="office-node" data-node="store"><span class="node-glyph">▤</span><strong>State vault</strong><small>What actually happened</small></div></div>
  <div id="comparison" class="comparison"><article class="policy-card"><div class="policy-title"><span class="dot naive"></span><h3 id="left-name">Naive policy</h3><span class="policy-tag">NO SAFEGUARDS</span></div><div class="metric-line"><strong id="naive-effects">0</strong><span>durable side effects</span><span id="naive-violations" class="violation">0 violations</span></div><p id="naive-value" class="state-value">Waiting</p><div id="naive-ledger" class="ledger"></div></article><article id="safe-card" class="policy-card guarded"><div class="policy-title"><span class="dot safe"></span><h3>Guarded policy</h3><span class="policy-tag">RECOVERY AWARE</span></div><div class="metric-line"><strong id="safe-effects">0</strong><span>durable side effects</span><span id="safe-violations" class="violation">0 violations</span></div><p id="safe-value" class="state-value">Waiting</p><div id="safe-ledger" class="ledger"></div></article></div>
  <div class="controls"><button id="play" class="primary">▶ Run experiment</button><button id="step">Step →</button><button id="reset">↺ Reset</button><label class="speed">Pace <select id="pace"><option value="1000">1 second</option><option value="500">0.5 seconds</option><option value="2000">2 seconds</option></select></label><span id="step-count" class="step-count">STEP 0 / 6</span></div>
  <div class="invariant"><span>THE RULE THAT SHOULD SURVIVE</span><p id="invariant"></p></div></div></section>
  <section class="trace-section"><div class="trace-heading"><div><p class="section-label">02 / INSPECT THE EVIDENCE</p><h2>Every action leaves a trace.</h2></div><div class="trace-actions"><button id="export">↓ Export traces</button><button id="import">↑ Replay a trace</button><input id="trace-file" type="file" accept=".json,application/json" hidden></div></div><p id="error" class="error" role="alert" hidden></p><div id="timeline" class="timeline"><p class="empty">The lab is quiet. Run an experiment or step through one event at a time.</p></div></section>
  <section class="how"><article><span>01</span><h3>Choose your accident</h3><p>Five common failure modes, with the same input for both policies.</p></article><article><span>02</span><h3>Watch durable state</h3><p>Count committed effects, not optimistic success messages.</p></article><article><span>03</span><h3>Take the evidence</h3><p>Export JSON snapshots or import a trace from your own adapter.</p></article></section>
  </main><footer><p>Built by <a href="https://github.com/ufodia">Ufodia</a> · Open source under MIT</p><p>These experiments explain patterns. They do not certify a production agent.</p></footer>`;

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let scenario: ScenarioId = 'timeout-after-commit';
let cursor = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let imported: Trace | null = null;
let traceLoad = 0;
const scenarioList = byId('scenarios');
for (const [index, spec] of scenarios.entries()) {
  const button = document.createElement('button'); button.className = 'scenario'; button.dataset.id = spec.id;
  const count = document.createElement('span'); count.className = 'scenario-number'; count.textContent = String(index + 1).padStart(2, '0');
  const content = document.createElement('span'); const title = document.createElement('strong'); title.textContent = spec.name;
  const caption = document.createElement('small'); caption.textContent = spec.caption; content.append(title, caption); button.append(count, content);
  button.addEventListener('click', () => { traceLoad++; stop(); scenario = spec.id; imported = null; cursor = 0; render(); }); scenarioList.append(button);
}
function traces() { return [imported ?? simulate(scenario, 'naive'), simulate(scenario, 'safe')]; }
function maximum() { const [a,b] = traces(); return imported ? a.snapshots.length : Math.max(a.snapshots.length, b.snapshots.length); }
function stop() { if (timer) clearInterval(timer); timer = null; byId('play').textContent = cursor >= maximum() ? '↺ Run again' : '▶ Run experiment'; }
function render() {
  const spec = scenarios.find(s => s.id === scenario)!;
  byId('scenario-caption').textContent = imported ? `IMPORTED TRACE · ${imported.policy.toUpperCase()} LABEL SUPPLIED BY AUTHOR` : spec.caption;
  byId('scenario-title').textContent = spec.name; byId('scenario-question').textContent = spec.question;
  byId('invariant').textContent = imported ? 'Imported state and violation counts are supplied by the trace author; the lab validates structure, not their truth.' : spec.invariant;
  byId('left-name').textContent = imported ? 'Imported evidence' : 'Naive policy';
  byId('comparison').classList.toggle('single', Boolean(imported)); byId('safe-card').hidden = Boolean(imported);
  document.querySelectorAll<HTMLButtonElement>('.scenario').forEach(b => { const selected = b.dataset.id === scenario; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', String(selected)); });
  const pair = traces();
  for (const [index, prefix] of ['naive', 'safe'].entries()) {
    const state = atStep(pair[index], cursor); byId(`${prefix}-effects`).textContent = String(state?.effects.length ?? 0);
    const violations = state?.violations ?? 0; byId(`${prefix}-violations`).textContent = `${violations} violation${violations === 1 ? '' : 's'}`;
    byId(`${prefix}-violations`).classList.toggle('bad', violations > 0); byId(`${prefix}-value`).textContent = state?.value ?? 'Waiting';
    const ledger = byId(`${prefix}-ledger`); ledger.replaceChildren();
    if (!state?.effects.length) { const empty = document.createElement('span'); empty.className = 'ledger-empty'; empty.textContent = 'No committed effects yet'; ledger.append(empty); }
    for (const [i, effect] of (state?.effects ?? []).entries()) { const tag = document.createElement('span'); tag.textContent = effect; tag.className = state!.effects.indexOf(effect) !== i ? 'effect duplicate' : 'effect'; ledger.append(tag); }
  }
  byId('step-count').textContent = `STEP ${cursor} / ${maximum()}`;
  byId<HTMLButtonElement>('step').disabled = cursor >= maximum();
  byId('run-status').textContent = cursor === 0 ? 'Ready to rehearse' : cursor >= maximum() ? 'Experiment complete' : timer ? 'Experiment running' : 'Paused';
  const current = atStep(pair[0], cursor); document.querySelectorAll<HTMLElement>('.office-node').forEach(el => el.classList.toggle('active', el.dataset.node === current?.event.node));
  const timeline = byId('timeline'); timeline.replaceChildren();
  if (!cursor) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'The lab is quiet. Run an experiment or step through one event at a time.'; timeline.append(p); }
  const visible = pair[0].snapshots.slice(0, cursor);
  for (const snapshot of visible) {
    const row = document.createElement('div'); row.className = `trace-row ${snapshot.event.tone}`;
    const number = document.createElement('span'); number.className = 'trace-number'; number.textContent = String(snapshot.event.step).padStart(2, '0');
    const description = document.createElement('div'); const strong = document.createElement('strong'); strong.textContent = snapshot.event.label; const detail = document.createElement('p'); detail.textContent = snapshot.event.detail; description.append(strong, detail);
    const node = document.createElement('span'); node.className = 'trace-node'; node.textContent = snapshot.event.node.toUpperCase(); row.append(number, description, node); timeline.append(row);
  }
}
byId('play').addEventListener('click', () => {
  if (timer) { stop(); render(); return; }
  if (cursor >= maximum()) cursor = 0;
  const tick = () => { cursor = Math.min(cursor + 1, maximum()); if (cursor >= maximum()) stop(); render(); };
  timer = setInterval(tick, Number(byId<HTMLSelectElement>('pace').value)); byId('play').textContent = 'Ⅱ Pause'; tick();
});
byId('step').addEventListener('click', () => { stop(); cursor = Math.min(cursor + 1, maximum()); render(); });
byId('reset').addEventListener('click', () => { traceLoad++; stop(); cursor = 0; render(); });
byId('pace').addEventListener('change', () => { if (timer) { stop(); render(); } });
function download(name: string, value: unknown) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
byId('export').addEventListener('click', () => { if (imported) download(`${scenario}-imported.json`, imported); else for (const trace of traces()) download(`${scenario}-${trace.policy}.json`, trace); });
byId('import').addEventListener('click', () => { traceLoad++; byId<HTMLInputElement>('trace-file').value = ''; byId<HTMLInputElement>('trace-file').click(); });
byId('trace-file').addEventListener('change', async () => {
  const input = byId<HTMLInputElement>('trace-file'); const file = input.files?.[0]; if (!file) return;
  const load = ++traceLoad;
  try { if (file.size > 2_000_000) throw new Error('Choose a JSON trace smaller than 2 MB.'); const text = await file.text(); if (load !== traceLoad) return; const trace = parseTrace(text); stop(); imported = trace; scenario = trace.scenario; cursor = 0; byId('error').hidden = true; render(); }
  catch (error) { if (load === traceLoad) { byId('error').textContent = error instanceof SyntaxError ? 'This is not valid Agent Crash Lab trace JSON. Choose a JSON file exported in the documented format.' : error instanceof Error ? error.message : 'Could not read trace.'; byId('error').hidden = false; } }
  finally { if (load === traceLoad) input.value = ''; }
});
render();
