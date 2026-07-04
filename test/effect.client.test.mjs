import { Client } from '#boardgame/client';
import { Local } from '#boardgame/multiplayer';
import { game } from '../shared/utils/game.js';
import { GAME_PHASES } from '../shared/constants/phases.js';
import { assert, makeSetupData } from './fixtures.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (label, fn, timeout = 8000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const r = fn();
    if (r) return r;
    await sleep(20);
  }
  throw new Error(`timeout: ${label}`);
};

const setupData = makeSetupData();
setupData.players[0].hand = [
  {
    id: 'eff1',
    instanceId: 'eff1_0',
    type: 'effect',
    phase: 'instant',
    fighter: 'any',
    title: 'Test',
    triggers: [
      {
        trigger: 'instant',
        conditions: { all: [] },
        actions: [
          { id: 'log', type: 'LOG', start: true, end: true, params: { message: 'ok' } },
        ],
      },
    ],
  },
];

const spec = {
  game: { ...game, setup: ctx => game.setup(ctx, setupData) },
  numPlayers: 2,
  multiplayer: Local(),
};
const p0 = Client({ ...spec, playerID: '0' });
const p1 = Client({ ...spec, playerID: '1' });
p0.start();
p1.start();

const st = () => p0.getState();

await waitFor('placement', () => st()?.ctx?.phase === GAME_PHASES.UNIT_PLACEMENT);
p0.moves.placeUnit({ unitId: 'hero1', circleId: 1 });
p0.moves.placeUnit({ unitId: 'asst1', circleId: 2 });
p0.moves.finishUnitPlacement();
await waitFor('all placed', () => st().G.players.every(p => p.fighters.every(f => f.position != null)));
await waitFor('actions', () => st().ctx.phase === GAME_PHASES.ACTION_SELECTION);

p0.moves.selectAction('effect');
await waitFor('effect', () => st().ctx.phase === GAME_PHASES.EFFECT);
assert(st().G.targetSelection?.kind === 'card', 'card selection pending');

p0.moves.selectCard({ cardId: 'eff1_0' });
await sleep(100);

assert(st().G.players[0].discard.length === 1, 'card discarded');
assert(
  st().ctx.phase === GAME_PHASES.ACTION_SELECTION,
  'back to action selection after effect',
);

p0.stop();
p1.stop();
console.log('effect client: ok');
