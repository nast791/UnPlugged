import { medusaSkill, teslaSkill } from '../test/skillFixtures.mjs';
import { EFFECT_TRIGGERS } from '../../constants/triggers.js';
import { ITEM_STATES } from '../../constants/items.js';
import { runHeroSkills, turnStart } from '../phases/turnstart.js';
import { startGame } from '../phases/startgame.js';
import { turnEnd } from '../phases/turnend.js';
import { evaluateTrigger, pickPipelineTarget, submitPipelineInput } from './pipeline.js';
import { runFact } from './facts.js';
import { game } from '../game.js';
import { assert, makeCtx, makeMap, mockEvents, playCtx } from '../test/fixtures.mjs';

const medusaHook = medusaSkill.triggers[0];
const teslaInitHook = teslaSkill.triggers.find(h => h.id === 'init_coils');
const teslaChargeHook = teslaSkill.triggers.find(h => h.id === 'charge_coil');
const teslaDischargeHook = teslaSkill.triggers.find(h => h.id === 'discharge');

const makeCoils = (states = [ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]) =>
  states.map((state, i) => ({
    id: `coil_${i + 1}`,
    type: 'coil',
    state,
    color: '#FACC15',
    icon: 'bi:lightning-fill',
    name: 'Катушка Теслы',
  }));

const makeMedusaG = (overrides = {}) => ({
  map: makeMap(),
  players: [
    {
      id: '0',
      name: 'P0',
      skill: medusaSkill,
      fighters: [
        {
          id: 'medusa',
          name: 'Medusa',
          type: 'hero',
          role: 'any',
          position: 1,
          startPosition: 1,
          hp: 10,
          attackRange: 1,
          rangeType: 'melee',
        },
      ],
    },
    {
      id: '1',
      name: 'P1',
      fighters: [
        {
          id: 'enemy1',
          name: 'Enemy',
          type: 'hero',
          role: 'any',
          position: 2,
          startPosition: 2,
          hp: 5,
        },
      ],
    },
  ],
  bonus: 0,
  bonusCards: [],
  log: [],
  pendingActions: [],
  highlightCells: [],
  highlightFighters: [],
  targetSelection: null,
  vars: {},
  outputVar: null,
  pipeline: null,
  turn: 0,
  selectedAction: null,
  ...overrides,
});

const makeTeslaG = (overrides = {}) => ({
  map: makeMap(),
  players: [
    {
      id: '0',
      name: 'P0',
      hand: [],
      skill: teslaSkill,
      items: makeCoils(),
      fighters: [
        {
          id: 'tesla',
          name: 'Tesla',
          type: 'hero',
          role: 'any',
          position: 1,
          startPosition: 1,
          hp: 10,
          attackRange: 1,
          rangeType: 'melee',
        },
      ],
    },
    {
      id: '1',
      name: 'P1',
      hand: [],
      fighters: [
        {
          id: 'enemy1',
          name: 'Enemy',
          type: 'hero',
          role: 'any',
          position: 2,
          startPosition: 2,
          hp: 5,
        },
      ],
    },
  ],
  bonus: 0,
  bonusCards: [],
  log: [],
  pendingActions: [],
  highlightCells: [],
  highlightFighters: [],
  targetSelection: null,
  vars: {},
  outputVar: null,
  pipeline: null,
  turn: 0,
  selectedAction: null,
  ...overrides,
});

const ctx = makeCtx('TURN_START', '0');

// --- medusa: FIGHTERS_IN_RANGE ---
{
  const G = makeMedusaG();
  const candidates = runFact(
    'FIGHTERS_IN_RANGE',
    { sourceId: 'medusa', side: 'opponent', kind: 'fighter' },
    { G, ctx },
  );
  assert(candidates.includes('enemy1'), 'medusa can reach enemy1');
}

// --- medusa: evaluateTrigger ---
{
  const G = makeMedusaG();
  const triggered = evaluateTrigger(EFFECT_TRIGGERS.START_TURN, medusaHook, G, ctx);
  assert(triggered?.actions?.length === 3, 'evaluateTrigger returns hook with actions');
  assert(Array.isArray(G.vars.$candidates) && G.vars.$candidates.includes('enemy1'), '$candidates set');
}

{
  const G = makeMedusaG();
  G.players[1].fighters[0].position = 4;
  G.players[1].fighters[0].startPosition = 4;
  const triggered = evaluateTrigger(EFFECT_TRIGGERS.START_TURN, medusaHook, G, ctx);
  assert(triggered === null, 'evaluateTrigger fails out of range');
}

// --- medusa: runHeroSkills + turnStart ---
{
  const G = makeMedusaG();
  const events = mockEvents();
  assert(runHeroSkills({ G, ctx, events }, EFFECT_TRIGGERS.START_TURN), 'runHeroSkills starts pipeline');
  assert(G.pipeline?.id === 'medusa_skill', 'pipeline id');
  assert(G.pendingActions.some(a => a.action === 'setVariables'), 'prompt pending');
}

{
  const G = makeMedusaG();
  const events = mockEvents();
  turnStart.onBegin({ G, ctx, events });
  assert(G.turn === 1, 'turn incremented');
  assert(G.pipeline !== null, 'turnStart starts medusa pipeline');
  assert(!events.endPhaseCalled, 'turnStart waits on skill');
}

// --- medusa: full apply flow ---
{
  const G = makeMedusaG();
  const events = mockEvents();
  const playCtx = { G, ctx, events };

  runHeroSkills(playCtx, EFFECT_TRIGGERS.START_TURN);
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'apply' }] });

  const moves = game.phases.TURN_START.moves;
  moves.selectOwnFighter(playCtx, { fighterId: 'enemy1' });
  assert(G.players[1].fighters[0].hp === 4, 'medusa skill damage');
  assert(G.pipeline === null, 'pipeline finished');
  assert(events.endPhaseCalled, 'END_PHASE after skill');
}

// --- tesla: START_GAME activates one coil ---
{
  const G = makeTeslaG();
  const events = mockEvents();
  const startCtx = makeCtx('START_GAME', '0');
  startGame.onBegin({ G, ctx: startCtx, events });
  const active = G.players[0].items.filter(i => i.state === ITEM_STATES.ACTIVE).length;
  assert(active === 1, 'START_GAME: one coil active');
  assert(events.endPhaseCalled, 'START_GAME ends phase');
}

// --- tesla: START_GAME when Tesla is player 1 ---
{
  const G = makeTeslaG({
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'enemy1',
            name: 'Enemy',
            type: 'hero',
            role: 'any',
            position: 3,
            startPosition: 3,
            hp: 5,
          },
        ],
      },
      {
        id: '1',
        name: 'P1',
        items: makeCoils(),
        skill: teslaSkill,
        fighters: [
          {
            id: 'tesla',
            name: 'Tesla',
            type: 'hero',
            role: 'any',
            position: 1,
            startPosition: 1,
            hp: 10,
            attackRange: 1,
            rangeType: 'melee',
          },
        ],
      },
    ],
  });
  const events = mockEvents();
  startGame.onBegin({ G, ctx: makeCtx('START_GAME', '0'), events });
  assert(
    G.players[1].items.filter(i => i.state === ITEM_STATES.ACTIVE).length === 1,
    'START_GAME: Tesla coil active on player 1',
  );
  assert(G.players[0].items?.length !== 2, 'START_GAME: opponent has no coils');
}

// --- tesla: END_TURN activates second coil ---
{
  const G = makeTeslaG();
  G.players[0].items = makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]);
  const events = mockEvents();
  const endCtx = makeCtx('TURN_END', '0');
  turnEnd.onBegin({ G, ctx: endCtx, events });
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.ACTIVE), 'END_TURN: both coils active');
  assert(!events.endPhaseCalled, 'END_TURN skill does not end phase early');
  turnEnd.turn.onBegin({ G, ctx: endCtx, events });
  assert(events.endTurnCalled, 'END_TURN ends turn after skill');
  turnEnd.turn.onEnd({ G, ctx: endCtx, events });
  assert(events.endPhaseCalled, 'END_TURN phase ends after turn');
}

// --- tesla: START_TURN discharge (damage + optional push) ---
{
  const G = makeTeslaG();
  G.players[0].items = makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]);
  const events = mockEvents();
  const playCtx = { G, ctx, events };

  assert(runHeroSkills(playCtx, EFFECT_TRIGGERS.START_TURN), 'tesla discharge runs');
  assert(G.players[1].fighters[0].hp === 4, 'tesla discharge damage');
  assert(G.pendingActions.some(a => a.action === 'setVariables'), 'push prompt pending');
  assert(String(G.players[1].fighters[0].position) === '2', 'no push before choice');

  submitPipelineInput(playCtx, { vars: [{ var: '$pushAnswer', value: 'skip' }] });
  assert(String(G.players[1].fighters[0].position) === '2', 'skip push keeps position');
  assert(G.pipeline === null, 'tesla discharge pipeline done');
  assert(events.endPhaseCalled, 'tesla discharge END_PHASE');
}

{
  const G = makeTeslaG();
  G.players[0].items = makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]);
  const events = mockEvents();
  const playCtx = { G, ctx, events };

  runHeroSkills(playCtx, EFFECT_TRIGGERS.START_TURN);
  submitPipelineInput(playCtx, { vars: [{ var: '$pushAnswer', value: 'push' }] });
  assert(String(G.players[1].fighters[0].position) !== '2', 'push moves target');
  assert(G.pipeline === null, 'tesla push pipeline done');
}

// --- tesla: discharge skipped when one coil inactive ---
{
  const G = makeTeslaG();
  G.players[0].items = makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]);
  const triggered = evaluateTrigger(EFFECT_TRIGGERS.START_TURN, teslaDischargeHook, G, ctx);
  assert(triggered === null, 'discharge requires both coils');
}

console.log('skills: ok');
