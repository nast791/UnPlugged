import { medusaSkill } from '../test/skillFixtures.mjs';
import { startPipeline, pickPipelineTarget, submitPipelineInput } from './pipeline.js';

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const medusaHook = medusaSkill.triggers[0];

const makeG = () => ({
  vars: { $candidates: ['enemy1'] },
  pipeline: null,
  pendingActions: [],
  highlightCells: [],
  highlightFighters: [],
  targetSelection: null,
  outputVar: null,
  log: [],
  players: [
    { id: '0', fighters: [{ id: 'medusa', name: 'Medusa', position: '1', hp: 10 }] },
    { id: '1', fighters: [{ id: 'enemy1', name: 'Враг', position: '2', hp: 5 }] },
  ],
});

const ctx = { currentPlayer: '0', phase: 'TURN_START' };
const actions = medusaHook.actions;

{
  const G = makeG();
  const events = { endPhase: () => { events.ended = true } };
  const playCtx = { G, ctx, events };

  startPipeline(G, ctx, events, actions, 'medusa');
  assert(G.pendingActions.length === 2, 'prompt');

  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'apply' }] });
  assert(G.outputVar === '$targets', 'pending targets');
  assert(G.targetSelection?.kind === 'effect', 'target selection');
  assert(G.targetSelection.candidates.includes('enemy1'), 'candidates');

  assert(pickPipelineTarget(playCtx, 'enemy1'), 'pick target');
  assert(events.ended, 'pipeline ended');
  assert(G.players[1].fighters[0].hp === 4, 'damage/end');
}

{
  const G = makeG();
  const events = { endPhase: () => { events.ended = true } };
  const playCtx = { G, ctx, events };

  startPipeline(G, ctx, events, actions, 'medusa');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(events.ended, 'skip');
}

console.log('medusa skill schema: ok');
