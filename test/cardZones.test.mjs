import {
  computeCardZoneView,
  computeCardZoneCounts,
  computeHandCardUI,
  canCancelAction,
} from '../shared/utils/rules/helpers.js';
import { grantZoneVisibility, revokeZoneVisibility } from '../shared/utils/rules/events.js';
import { runMove } from '../shared/utils/rules/moves.js';
import { runEvent } from '../shared/utils/rules/events.js';
import { effect } from '../shared/utils/phases/effect.js';
import { assert, makeG, makeCtx, mockEvents, playCtx } from './fixtures.mjs';
import { GAME_PHASES } from '../shared/constants/phases.js';

// --- базовая видимость зон ---
{
  const G = makeG();
  G.players[0].hand = [{ id: 'h1', instanceId: 'h1_0' }];
  G.players[0].discard = [{ id: 'd1', instanceId: 'd1_0' }];
  G.players[0].deck = [{ id: 'k1', instanceId: 'k1_0' }];
  G.players[1].hand = [{ id: 'oh1', instanceId: 'oh1_0' }];
  G.players[1].discard = [{ id: 'od1', instanceId: 'od1_0' }];
  G.players[1].deck = [{ id: 'ok1', instanceId: 'ok1_0' }];
  const ctx = makeCtx(GAME_PHASES.ACTION_SELECTION, '0');

  const view = computeCardZoneView(G, ctx, '0');
  assert(view['0'].hand && view['0'].discard && !view['0'].deck, 'self: hand+discard, no deck');
  assert(!view['1'].hand && !view['1'].deck && view['1'].discard, 'opponent: discard only');
}

// --- счётчики зон: колода видна, рука противника скрыта ---
{
  const G = makeG();
  G.players[0].deck = Array.from({ length: 20 }, (_, i) => ({ id: `d${i}`, instanceId: `d${i}_0` }));
  G.players[0].hand = [{ id: 'h1', instanceId: 'h1_0' }];
  G.players[1].deck = Array.from({ length: 15 }, (_, i) => ({ id: `od${i}`, instanceId: `od${i}_0` }));
  G.players[1].hand = [{ id: 'oh1', instanceId: 'oh1_0' }, { id: 'oh2', instanceId: 'oh2_0' }];
  G.players[1].discard = [{ id: 'od1', instanceId: 'od1_0' }];
  const ctx = makeCtx(GAME_PHASES.ACTION_SELECTION, '0');

  const counts = computeCardZoneCounts(G, ctx, '0');
  assert(counts['0'].deck === 20, 'self deck count');
  assert(counts['0'].hand === 1, 'self hand count');
  assert(counts['1'].deck === 15, 'opponent deck count');
  assert(counts['1'].hand === 0, 'opponent hand count hidden');
  assert(counts['1'].discard === 1, 'opponent discard count');
}

// --- грант: рука противника + подтверждение ---
{
  const G = makeG();
  G.players[1].hand = [{ id: 'oh1', instanceId: 'oh1_0' }];
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');

  grantZoneVisibility(G, ctx, {
    ownerId: '1',
    zone: 'hand',
    requireConfirm: true,
  });

  const view = computeCardZoneView(G, ctx, '0');
  assert(view['1'].hand, 'grant reveals opponent hand');
  assert(G.zoneVisibilityGrants.length === 1, 'grant stored');

  revokeZoneVisibility(G, ctx, { grantId: G.zoneVisibilityGrants[0].id });
  assert(!computeCardZoneView(G, ctx, '0')['1'].hand, 'revoke hides opponent hand');
}

// --- SELECT_CARDS из чужой руки выдаёт грант ---
{
  const G = makeG();
  G.players[1].hand = [{ id: 'c1', instanceId: 'c1_0', type: 'attack' }];
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');

  runEvent(G, ctx, 'SELECT_CARDS', {
    params: {
      playerId: '1',
      source: 'hand',
      candidates: ['c1_0'],
      selection: 1,
      message: 'Выберите карту противника',
    },
    return: '$picked',
  });

  assert(G.zoneVisibilityGrants.some(g => g.ownerId === '1' && g.zone === 'hand'), 'SELECT_CARDS grants hand');
  assert(G.pendingActions.some(a => a.action === 'confirmZoneView'), 'confirm pending added');
}

// --- handCardUI: выбор карты эффекта ---
{
  const G = makeG();
  G.players[0].hand = [
    { id: 'eff', instanceId: 'eff_0', type: 'effect' },
    { id: 'atk', instanceId: 'atk_0', type: 'attack' },
  ];
  G.targetSelection = {
    kind: 'card',
    returnKey: '$effectCardId',
    candidates: ['eff_0'],
    playerId: '0',
  };
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');

  const ui = computeHandCardUI(G, ctx);
  assert(ui.selectableIds.includes('eff_0'), 'effect card selectable');
  assert(ui.disabledIds.includes('atk_0'), 'other cards disabled');
}

// --- handCardUI: бонус движения ---
{
  const G = makeG();
  G.players[0].hand = [
    { id: 'b1', instanceId: 'b1_0', bonus: 2 },
    { id: 'b2', instanceId: 'b2_0', bonus: 0 },
  ];
  const ctx = makeCtx(GAME_PHASES.MOVEMENT, '0');

  const ui = computeHandCardUI(G, ctx);
  assert(ui.selectableIds.includes('b1_0'), 'bonus card selectable');
  assert(ui.disabledIds.includes('b2_0'), 'non-bonus disabled during pick');
}

// --- handCardUI: после выбора бонуса все карты disabled ---
{
  const G = makeG();
  G.players[0].hand = [{ id: 'b1', instanceId: 'b1_0', bonus: 2 }];
  G.bonusCards = ['b1'];
  const ctx = makeCtx(GAME_PHASES.MOVEMENT, '0');

  const ui = computeHandCardUI(G, ctx);
  assert(ui.disabledIds.includes('b1_0'), 'all cards disabled after bonus applied');
}

// --- отмена фазы эффекта до выбора карты ---
{
  const G = makeG();
  G.players[0].hand = [{ id: 'eff', instanceId: 'eff_0', type: 'effect', phase: 'instant', triggers: [] }];
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  const events = mockEvents();

  effect.onBegin({ G, ctx });
  assert(canCancelAction(G, ctx), 'can cancel before card pick');

  runMove('CANCEL_ACTION', playCtx(G, ctx, events));
  assert(events.nextPhase === GAME_PHASES.ACTION_SELECTION, 'returns to action selection');
  assert(!G.targetSelection, 'selection cleared');
  assert(G.pendingActions.some(a => a.id === 'movement'), 'action menu restored');
}

console.log('cardZones.test.mjs: all passed');
