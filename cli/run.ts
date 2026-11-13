import { readFileSync, writeFileSync } from 'node:fs';
import { parseTrace, scenarioIds, simulate, type Policy, type ScenarioId } from '../src/engine.ts';

const args = process.argv.slice(2);
try {
  if (args.includes('--help')) {
    console.log('Usage: npm run simulate -- [scenario] [naive|safe] [output.json]\n       npm run simulate -- --replay trace.json\nScenarios: ' + scenarioIds.join(', '));
  } else if (args[0] === '--replay') {
    if (!args[1]) throw new Error('Supply a trace file after --replay.');
    const trace = parseTrace(readFileSync(args[1], 'utf8'));
    console.log(JSON.stringify(trace, null, 2));
  } else {
    const scenario = (args[0] ?? 'timeout-after-commit') as ScenarioId;
    const policy = (args[1] ?? 'safe') as Policy;
    const trace = simulate(scenario, policy);
    const output = JSON.stringify(trace, null, 2) + '\n';
    if (args[2]) writeFileSync(args[2], output, { flag: 'wx' });
    else process.stdout.write(output);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Simulation failed.');
  process.exitCode = 1;
}
