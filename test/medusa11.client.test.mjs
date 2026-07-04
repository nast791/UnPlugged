import { Client } from '#boardgame/client';
import { Local } from '#boardgame/multiplayer';
import { game } from '../shared/utils/game.js';
import { GAME_PHASES } from '../shared/constants/phases.js';
import { assert, makeSetupData, playCtx, makeCtx } from './fixtures.mjs';
import { loadHeroCards } from './packLoader.mjs';
import { runMove } from '../shared/utils/rules/moves.js';

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

const medusa11 = loadHeroCards('medusa').find(c => c.id === 'medusa_11');
const setupData = makeSetupData();
setupData.players[0].fighters = [
  {
    id: 'medusa',
    name: 'Medusa',
    type: 'hero',
    role: 'any',
    move: 2,
    position: null,
    startPosition: null,
    hp: 10,
    currentHp: 10,
    bonusMovement: 0,
    canPassThroughEnemies: false,
    attackRange: 1,
    rangeType: 'ranged',
  },
  {
    id: 'harpies_1',
    name: 'Harpy',
    group: 'harpies',
    type: 'assistant',
    role: 'any',
    move: 1,
    position: null,
    startPosition: null,
    hp: 1,
    currentHp: 0,
    bonusMovement: 0,
  },
];
setupData.players[0].hand = [{ ...medusa11, instanceId: 'medusa_11_0' }];

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
p0.moves.placeUnit({ unitId: 'medusa', circleId: 1 });
p0.moves.placeUnit({ unitId: 'harpies_1', circleId: 3 });
p0.moves.finishUnitPlacement();
await waitFor('all placed', () => st().G.players.every(p => p.fighters.every(f => f.position != null)));
await waitFor('actions', () => st().ctx.phase === GAME_PHASES.ACTION_SELECTION);

p0.moves.selectAction('effect');
await waitFor('effect', () => st().ctx.phase === GAME_PHASES.EFFECT);

p0.moves.selectCard({ cardId: 'medusa_11_0' });
await sleep(50);

const G = st().G;
assert(G.players[0].discard.length === 1, 'card discarded');
assert(G.pipeline?.id === 'medusa_11', 'pipeline active');
assert(Array.isArray(G.pipeline?.done), 'pipeline.done is array');
assert(G.pendingActions.length === 2, 'move prompt pending');
JSON.stringify(G);

// selectCell move must work when outputVar was cleared after pickTarget
{
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  const pc = playCtx(JSON.parse(JSON.stringify(G)), ctx);
  pc.G.outputVar = null;
  pc.G.vars.$answer = 'move';
  pc.G.vars.$fighterId = 'medusa';
  pc.G.targetSelection = {
    kind: 'cell',
    returnKey: '$moveCell',
    candidates: ['2', '3'],
    selection: 1,
    fighterId: 'medusa',
  };
  pc.G.vars.$moveCell = '';
  assert(runMove('SELECT_CELL', pc, { cellId: '2' }) !== false, 'selectCell with null outputVar');
  assert(pc.G.targetSelection === null, 'cell selection cleared after pick');
}

p0.stop();
p1.stop();
console.log('medusa11 client: ok');
