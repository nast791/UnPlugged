import { Client } from '#boardgame/client';
import { Local } from '#boardgame/multiplayer';
import { game } from '../shared/utils/game.js';
import { GAME_PHASES } from '../shared/constants/phases.js';
import { assert, makeSetupData } from './fixtures.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const waitFor = async (label, fn, { timeout = 3000, interval = 20 } = {}) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = fn();
    if (result) return result;
    await sleep(interval);
  }
  throw new Error(`timeout: ${label}`);
};

const makeGameConfig = () => {
  const setupData = makeSetupData();
  setupData.players.forEach(p => {
    p.deck = [{ id: `deck-${p.id}`, name: 'Move', type: 'movement', role: 'any', bonus: 1 }];
  });
  return {
    ...game,
    setup: ctx => game.setup(ctx, setupData),
  };
};

const createClients = () => {
  const spec = {
    game: makeGameConfig(),
    numPlayers: 2,
    multiplayer: Local(),
    debug: false,
  };
  const p0 = Client({ ...spec, playerID: '0' });
  const p1 = Client({ ...spec, playerID: '1' });
  p0.start();
  p1.start();
  return { p0, p1 };
};

const clientFor = (p0, p1, playerId) => (playerId === '0' ? p0 : p1);

const state = client => client.getState();

const playPlacement = async (p0, p1) => {
  await waitFor('initial sync', () => state(p0)?.ctx?.phase === GAME_PHASES.UNIT_PLACEMENT);

  p0.moves.placeUnit({ unitId: 'hero1', circleId: 1 });
  p0.moves.placeUnit({ unitId: 'asst1', circleId: 2 });
  p0.moves.finishUnitPlacement();

  await waitFor('P1 placement done', () =>
    state(p0).G.players.every(p => p.fighters.every(f => f.position != null)),
  );

  await waitFor('game started', () =>
    state(p0).ctx.phase === GAME_PHASES.ACTION_SELECTION,
  );
};

const playMovementAction = async (client) => {
  client.moves.selectAction('movement');
  await waitFor('movement phase', () => state(client).ctx.phase === GAME_PHASES.MOVEMENT);
  client.moves.confirmMovement();
};

const playFullTurn = async (p0, p1) => {
  const active = () => clientFor(p0, p1, state(p0).ctx.currentPlayer);
  const playerAtStart = state(p0).ctx.currentPlayer;

  await waitFor('ready for actions', () => {
    const phase = state(p0).ctx.phase;
    return phase === GAME_PHASES.ACTION_SELECTION || phase === GAME_PHASES.TURN_START;
  });
  if (state(p0).ctx.phase === GAME_PHASES.TURN_START) {
    await waitFor('action selection', () => state(p0).ctx.phase === GAME_PHASES.ACTION_SELECTION);
  }

  await playMovementAction(active());
  await waitFor('after 1st action', () => {
    const phase = state(p0).ctx.phase;
    return phase === GAME_PHASES.ACTION_SELECTION || phase === GAME_PHASES.TURN_END;
  });

  if (state(p0).ctx.phase === GAME_PHASES.ACTION_SELECTION) {
    await playMovementAction(active());
  }

  await waitFor('turn ended', () => state(p0).ctx.currentPlayer !== playerAtStart);
};

// --- placement via boardgame.io master ---
{
  const { p0, p1 } = createClients();
  await playPlacement(p0, p1);
  assert(state(p0).ctx.phase === GAME_PHASES.ACTION_SELECTION, 'after placement → ACTION_SELECTION');
  assert(state(p0).ctx.currentPlayer === '0', 'first active player');
  assert(state(p0).G.turn === 1, 'turn counter started');
  p0.stop();
  p1.stop();
}

// --- full round: P0 turn + P1 turn ---
{
  const { p0, p1 } = createClients();
  await playPlacement(p0, p1);

  const turnBefore = state(p0).G.turn;
  await playFullTurn(p0, p1);
  assert(state(p0).ctx.currentPlayer === '1', 'after P0 → P1');

  await playFullTurn(p0, p1);
  assert(state(p0).ctx.currentPlayer === '0', 'after P1 → P0 again');
  assert(state(p0).G.turn > turnBefore, 'turn counter advanced');

  const round = Math.floor(state(p0).G.turn / state(p0).ctx.numPlayers) + 1;
  assert(round >= 2, 'completed at least one full round');

  p0.stop();
  p1.stop();
}

console.log('game integration: ok');
