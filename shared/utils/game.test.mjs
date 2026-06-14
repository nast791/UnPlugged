import { game } from './game.js';
import { GAME_PHASES } from '../constants/phases.js';
import { runMove } from './rules/moves.js';
import {
  assert,
  makeG,
  makeCtx,
  makeSetupData,
  mockEvents,
  playCtx,
} from './test/fixtures.mjs';

// --- game.setup ---
{
  const G = game.setup(makeCtx(), makeSetupData());
  assert(G.players.length === 2, 'setup players');
  assert(G.bonus === 0 && G.bonusCards.length === 0, 'setup bonus');
  assert(G.pipeline === null && !G.winner, 'setup initial state');
}

// --- UI contract: moves exposed for Konva / sidebar ---
{
  const moves = name => game.phases[name].moves;
  assert(typeof moves(GAME_PHASES.UNIT_PLACEMENT).placeUnit === 'function', 'UI: placeUnit');
  assert(typeof moves(GAME_PHASES.UNIT_PLACEMENT).getAvailableCells === 'function', 'UI: getAvailableCells');
  assert(typeof moves(GAME_PHASES.MOVEMENT).moveFighter === 'function', 'UI: moveFighter');
  assert(typeof moves(GAME_PHASES.MOVEMENT).applyBonus === 'function', 'UI: applyBonus');
  assert(typeof moves(GAME_PHASES.ACTION_SELECTION).selectAction === 'function', 'UI: selectAction');
  assert(typeof moves(GAME_PHASES.UNIT_PLACEMENT).selectOwnFighter === 'function', 'UI: selectOwnFighter');
}

// --- placement flow (player 0) ---
{
  const setupData = makeSetupData();
  const G = game.setup(makeCtx(), setupData);
  const ctx = makeCtx(GAME_PHASES.UNIT_PLACEMENT, '0');
  const events = mockEvents();
  const phase = game.phases[GAME_PHASES.UNIT_PLACEMENT];

  assert(phase.moves.placeUnit(playCtx(G, ctx, events), { unitId: 'hero1', circleId: 1 }) !== 'INVALID_MOVE');
  assert(phase.moves.placeUnit(playCtx(G, ctx, events), { unitId: 'asst1', circleId: 2 }) !== 'INVALID_MOVE');
  assert(G.players[0].fighters.every(f => f.position != null), 'fighters placed');
  assert(G.pendingActions.some(a => a.action === 'finishUnitPlacement'), 'finish button');

  phase.moves.finishUnitPlacement(playCtx(G, ctx, events));
  assert(events.endTurnCalled, 'FINISH_PLACEMENT via finishUnitPlacement');
}

// --- AUTO_PLACE_AI (player 1) ---
{
  const setupData = makeSetupData();
  const G = game.setup(makeCtx(), setupData);
  const ctx = makeCtx(GAME_PHASES.UNIT_PLACEMENT, '1');
  const events = mockEvents();

  assert(runMove('AUTO_PLACE_AI', playCtx(G, ctx, events)), 'AUTO_PLACE_AI');
  assert(G.players[1].fighters.every(f => f.position != null), 'AI fighters placed');
  assert(events.endTurnCalled, 'AUTO_PLACE_AI endTurn');
}

// --- turn → action → movement → confirm ---
{
  const G = makeG();
  G.players[0].fighters.forEach(f => {
    f.position = 1;
    f.startPosition = 1;
  });
  G.players[0].deck = [{ id: 'd1', name: 'Card', type: 'movement', role: 'any' }];
  const ctx = makeCtx(GAME_PHASES.TURN_START, '0');
  const events = mockEvents();

  game.phases[GAME_PHASES.TURN_START].onBegin({ G, ctx, events });
  assert(G.turn === 1, 'turn incremented');
  assert(events.endPhaseCalled, 'TURN_START → ACTION_SELECTION');

  ctx.phase = GAME_PHASES.ACTION_SELECTION;
  game.phases[GAME_PHASES.ACTION_SELECTION].onBegin({ G, ctx });
  game.phases[GAME_PHASES.ACTION_SELECTION].moves.selectAction(playCtx(G, ctx, events), 'movement');
  assert(G.selectedAction === 'movement', 'action selected');

  ctx.phase = GAME_PHASES.MOVEMENT;
  events.endPhaseCalled = false;
  game.phases[GAME_PHASES.MOVEMENT].onBegin({ G, ctx });
  assert(G.players[0].hand.length >= 1, 'movement draw');

  game.phases[GAME_PHASES.MOVEMENT].moves.confirmMovement(playCtx(G, ctx, events));
  assert(events.endPhaseCalled, 'movement confirmed');
}

// --- shared moves: selectOwnFighter + highlight ---
{
  const G = makeG();
  G.players[0].fighters[0].position = 1;
  G.players[0].fighters[0].startPosition = 1;
  const ctx = makeCtx(GAME_PHASES.MOVEMENT, '0');
  const events = mockEvents();
  const moves = game.phases[GAME_PHASES.MOVEMENT].moves;

  moves.selectOwnFighter(playCtx(G, ctx, events), { fighterId: 'hero1' });
  assert(G.targetSelection?.kind === 'own', 'own selection');
  assert(Array.isArray(G.highlightCells) && G.highlightCells.length > 0, 'movement cells highlighted');
}

console.log('game e2e: ok');
