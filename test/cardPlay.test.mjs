import { resolveCardPlayContext, findFullPlayedCard } from '../shared/utils/combat.js';
import { isCardPlayActionPhase } from '../shared/constants/cardPlay.js';
import { GAME_PHASES } from '../shared/constants/phases.js';
import { assert, makeCtx, makeG } from './fixtures.mjs';

const attackCard = {
  id: 'atk1',
  instanceId: 'atk1_0',
  type: 'attack',
  title: 'Удар',
  value: 5,
};

const defenseCard = {
  id: 'def1',
  instanceId: 'def1_0',
  type: 'defense',
  title: 'Блок',
  value: 3,
};

assert(isCardPlayActionPhase(GAME_PHASES.ATTACK), 'attack is card play phase');
assert(!isCardPlayActionPhase(GAME_PHASES.MOVEMENT), 'movement is not card play phase');

// --- EFFECT context ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  G.selectedCardId = 'eff_0';
  G.pipeline = { actions: [] };
  G.combat = { card: { id: 'eff', type: 'effect', title: 'Stub' } };
  G.players[0].discard = [{ id: 'eff', instanceId: 'eff_0', type: 'effect', title: 'Полный' }];

  const ctxResolved = resolveCardPlayContext(G, ctx);
  assert(ctxResolved?.phase === GAME_PHASES.EFFECT, 'effect context phase');
  assert(ctxResolved?.card?.title === 'Полный', 'effect: full card from discard');
}

// --- ATTACK context ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.ATTACK, '0');
  G.combat = {
    attackerPlayerId: '0',
    cardId: 'atk1_0',
    card: attackCard,
  };
  G.players[0].discard = [attackCard];

  const ctxResolved = resolveCardPlayContext(G, ctx);
  assert(ctxResolved?.phase === GAME_PHASES.ATTACK, 'attack context');
  assert(ctxResolved?.card?.title === 'Удар', 'attack card resolved');
}

// --- DEFENSE context (response card) ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.DEFENSE, '1');
  G.combat = {
    defenderPlayerId: '1',
    card: attackCard,
    responseCard: defenseCard,
  };
  G.players[1].discard = [defenseCard];

  const ctxResolved = resolveCardPlayContext(G, ctx);
  assert(ctxResolved?.phase === GAME_PHASES.DEFENSE, 'defense context');
  assert(ctxResolved?.card?.title === 'Блок', 'defense response card');
  assert(String(ctxResolved?.ownerId) === '1', 'defense owner');
}

// --- no context outside card play phases ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.MOVEMENT, '0');
  assert(resolveCardPlayContext(G, ctx) === null, 'no context in movement');
}

// --- findFullPlayedCard fallback to stub ---
{
  const G = makeG();
  const stub = { id: 'x', type: 'effect', title: 'Stub only' };
  const card = findFullPlayedCard(G, '0', 'missing', stub);
  assert(card?.title === 'Stub only', 'stub fallback');
}

console.log('cardPlay: ok');
