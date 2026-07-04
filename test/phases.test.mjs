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
  G.players[0].hand = [
    {
      id: 'c1',
      instanceId: 'c1_0',
      type: 'effect',
      role: 'any',
      phase: 'instant',
      triggers: [{ trigger: 'instant', conditions: { all: [] }, actions: [] }],
    },
  ];
  const ctx = makeCtx(GAME_PHASES.ACTION_SELECTION, '0');

  actionSelection.onBegin({ G, ctx });
  const ids = G.pendingActions.map(a => a.id);
  assert(ids.includes('movement'), 'menu: movement');
  assert(ids.includes('effect'), 'menu: effect');
}

// --- actionSelection: no effect cards → no effect action ---
{
  const G = makeG();
  G.players[0].hand = [{ id: 'c1', type: 'attack' }];
  const ctx = makeCtx(GAME_PHASES.ACTION_SELECTION, '0');

  actionSelection.onBegin({ G, ctx });
  const ids = G.pendingActions.map(a => a.id);
  assert(!ids.includes('effect'), 'menu: no effect without effect cards');
}

// --- actionSelection: effect card in hand but trigger conditions fail → no effect action ---
{
  const G = makeG();
  G.players[0].fighters = [
    {
      id: 'medusa',
      name: 'Medusa',
      type: 'hero',
      hp: 10,
      currentHp: 10,
      position: 1,
      rangeType: 'ranged',
      attackRange: 1,
    },
  ];
  G.players[1].fighters[0].position = null;
  G.players[0].hand = [
    {
      id: 'eff_need_enemy',
      instanceId: 'eff_need_enemy_0',
      type: 'effect',
      fighter: 'medusa',
      phase: 'instant',
      triggers: [
        {
          trigger: 'instant',
          conditions: {
            all: [
              { fact: 'CARD_MATCHES_FIGHTER' },
              { fact: 'CARD_MATCHES_PHASE' },
              {
                fact: 'FIGHTERS_IN_RANGE',
                params: { sourceId: 'medusa', side: 'opponent', kind: 'fighter' },
                check: { var: '$candidates', operator: 'isNonEmpty' },
                return: '$candidates',
              },
            ],
          },
          actions: [],
        },
      ],
    },
  ];
  const ctx = makeCtx(GAME_PHASES.ACTION_SELECTION, '0');

  actionSelection.onBegin({ G, ctx });
  const ids = G.pendingActions.map(a => a.id);
  assert(!ids.includes('effect'), 'menu: no effect when trigger conditions fail');
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
  assert(attack.next({ G, ctx }) === GAME_PHASES.ACTION_SELECTION, 'attack → ACTION_SELECTION');
}

// --- attack.onEnd: actions exhausted → TURN_END ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.ATTACK, '0');
  const events = mockEvents();
  G.players[0].actionsUsed = 1;
  G.players[0].actionsPoints = 2;

  attack.onEnd({ G, ctx, events });
  assert(attack.next({ G, ctx }) === GAME_PHASES.TURN_END, 'attack → TURN_END');
}

// --- effect.onEnd: same routing as attack ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  const events = mockEvents();
  G.players[0].actionsUsed = 0;
  G.players[0].actionsPoints = 2;

  effect.onEnd({ G, ctx, events });
  assert(effect.next({ G, ctx }) === GAME_PHASES.ACTION_SELECTION, 'effect → ACTION_SELECTION');

  G.players[0].actionsUsed = 1;
  effect.onEnd({ G, ctx, events });
  assert(effect.next({ G, ctx }) === GAME_PHASES.TURN_END, 'effect → TURN_END');
}

console.log('phases: ok');
