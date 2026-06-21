import { medusaSkill } from './skillFixtures.mjs';
import {
  pickNextPipelineStep,
  startPipeline,
  pickPipelineTarget,
  submitPipelineInput,
} from '../shared/utils/rules/pipeline.js';

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
    { id: '0', fighters: [{ id: 'medusa', name: 'Medusa', position: '1', hp: 10, currentHp: 10 }] },
    { id: '1', fighters: [{ id: 'enemy1', name: 'Враг', position: '2', hp: 5, currentHp: 5 }] },
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
  assert(G.targetSelection?.kind === 'target', 'target selection');
  assert(G.targetSelection.candidates.includes('enemy1'), 'candidates');

  assert(pickPipelineTarget(playCtx, 'enemy1'), 'pick target');
  assert(events.ended, 'pipeline ended');
  assert(G.players[1].fighters[0].currentHp === 4, 'damage/end');
}

{
  const G = makeG();
  const events = { endPhase: () => { events.ended = true } };
  const playCtx = { G, ctx, events };

  startPipeline(G, ctx, events, actions, 'medusa');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(events.ended, 'skip');
}

{
  const G = makeG();
  G.vars = {};
  const events = { endPhase: () => { events.ended = true } };
  const playCtx = { G, ctx, events };
  const outOfOrder = [
    {
      id: 'side_effect',
      type: 'LOG',
      params: { message: 'must not run first' },
    },
    {
      id: 'ask_apply',
      type: 'PROMPT',
      start: true,
      return: '$answer',
      conditions: { all: [{ var: '$answer', operator: 'isEmpty' }] },
      params: {
        message: 'Start here?',
        answers: [
          { id: 'skip', text: 'Нет', value: 'skip' },
        ],
      },
    },
    {
      id: 'finish',
      type: 'LOG',
      end: true,
      conditions: { all: [{ var: '$answer', operator: 'equal', value: 'skip' }] },
      params: { message: 'done' },
    },
  ];

  startPipeline(G, ctx, events, outOfOrder, 'start-test');
  assert(G.log.every(e => e.msg !== 'must not run first'), 'start:true skips earlier actions');
  assert(G.pendingActions.length === 1, 'prompt from start action');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(events.ended, 'pipeline finished after start action');
}

{
  const actions = [
    {
      id: 'effect',
      type: 'LOG',
      conditions: {
        all: [
          { var: '$answer', operator: 'equal', value: 'go' },
          { fact: 'HERO_ON_BOARD', params: { fighterId: 'medusa' } },
        ],
      },
      params: { message: 'effect' },
    },
    {
      id: 'ask',
      type: 'PROMPT',
      start: true,
      return: '$answer',
      conditions: { all: [{ var: '$answer', operator: 'isEmpty' }] },
      params: {
        message: 'Go?',
        answers: [{ id: 'go', text: 'Go', value: 'go' }],
      },
    },
  ];
  const G = makeG();
  const done = new Set();
  const next = pickNextPipelineStep(actions, done, G, ctx, true);
  assert(next?.step.id === 'ask', 'input step wins over effect regardless of json order');
}

console.log('medusa skill schema: ok');
