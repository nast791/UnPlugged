import { attack } from '../shared/utils/phases/attack.js';
import { effect } from '../shared/utils/phases/effect.js';
import { actionSelection } from '../shared/utils/phases/actionselection.js';
import { assert, makeG, makeCtx, mockEvents, playCtx } from './fixtures.mjs';
import { GAME_PHASES } from '../shared/constants/phases.js';

// --- actionSelection menu ---
{
  const G = makeG();
  G.players[0].fighters[0].position = 1;
  G.players[0].fighters[0].startPosition = 1;
  G.players[1].fighters[0].position = 2;
  G.players[0].hand = [{ id: 'c1', type: 'effect', role: 'any' }];
  const ctx = makeCtx(GAME_PHASES.ACTION_SELECTION, '0');

  actionSelection.onBegin({ G, ctx });
  const ids = G.pendingActions.map(a => a.id);
  assert(ids.includes('movement'), 'menu: movement');
  assert(ids.includes('effect'), 'menu: effect');
}

// --- attack.onEnd: actions remain → ACTION_SELECTION ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.ATTACK, '0');
  const events = mockEvents();
  G.players[0].actionsUsed = 0;
  G.players[0].actionsPoints = 2;

  attack.onEnd({ G, ctx, events });
  assert(G.players[0].actionsUsed === 1, 'attack actionsUsed++');
  assert(events.nextPhase === GAME_PHASES.ACTION_SELECTION, 'attack → ACTION_SELECTION');
}

// --- attack.onEnd: actions exhausted → TURN_END ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.ATTACK, '0');
  const events = mockEvents();
  G.players[0].actionsUsed = 1;
  G.players[0].actionsPoints = 2;

  attack.onEnd({ G, ctx, events });
  assert(events.nextPhase === GAME_PHASES.TURN_END, 'attack → TURN_END');
}

// --- effect.onEnd: same routing as attack ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  const events = mockEvents();
  G.players[0].actionsUsed = 0;
  G.players[0].actionsPoints = 2;

  effect.onEnd({ G, ctx, events });
  assert(events.nextPhase === GAME_PHASES.ACTION_SELECTION, 'effect → ACTION_SELECTION');

  events.nextPhase = null;
  G.players[0].actionsUsed = 1;
  effect.onEnd({ G, ctx, events });
  assert(events.nextPhase === GAME_PHASES.TURN_END, 'effect → TURN_END');
}

console.log('phases: ok');
