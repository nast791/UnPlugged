import { EFFECT_TRIGGERS } from '../shared/constants/triggers.js';
import { effect } from '../shared/utils/phases/effect.js';
import { runMove } from '../shared/utils/rules/moves.js';
import { pickPipelineTarget } from '../shared/utils/rules/pipeline.js';
import { assert, makeCtx, makeG, mockEvents, playCtx } from './fixtures.mjs';
import { GAME_PHASES } from '../shared/constants/phases.js';
import { loadHeroCards } from './packLoader.mjs';

const logEffectCard = {
  id: 'eff_log',
  instanceId: 'eff_log_0',
  type: 'effect',
  phase: 'instant',
  fighter: 'any',
  title: 'Test Log',
  triggers: [
    {
      trigger: 'instant',
      conditions: { all: [] },
      actions: [
        {
          id: 'say',
          type: 'LOG',
          start: true,
          end: true,
          params: { message: 'Effect fired' },
        },
      ],
    },
  ],
};

// --- effect.onBegin: pending card selection ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  G.players[0].fighters[0].position = 1;
  G.players[0].hand = [logEffectCard];

  effect.onBegin({ G, ctx, events: mockEvents() });

  assert(G.targetSelection?.kind === 'card', 'onBegin: card targetSelection');
  assert(G.targetSelection.candidates.includes('eff_log_0'), 'onBegin: effect card candidate');
  assert(G.outputVar === '$effectCardId', 'onBegin: outputVar set');
}

// --- play simple effect card → pipeline LOG → end phase ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  const events = mockEvents();
  G.players[0].fighters[0].position = 1;
  G.players[0].hand = [logEffectCard];
  G.players[0].actionsUsed = 0;
  G.players[0].actionsPoints = 2;

  effect.onBegin({ G, ctx, events });

  const pc = playCtx(G, ctx, events);
  assert(runMove('SELECT_CARD', pc, { cardId: 'eff_log_0' }) !== false, 'select effect card');

  assert(G.players[0].hand.length === 0, 'card removed from hand');
  assert(G.players[0].discard.length === 1, 'card in discard');
  assert(G.pipeline === null, 'pipeline finished');
  assert(events.endPhaseCalled, 'effect phase ended after play');
  assert(
    G.log.some(e => e.msg === 'Effect fired') ||
      G.privateLog.some(e => e.msg === 'Effect fired'),
    'effect LOG action ran',
  );
  assert(G.selectedCardId === 'eff_log_0', 'selectedCardId set during play');
}

// --- effect.onEnd still routes phases after card play ---
{
  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  const events = mockEvents();
  G.players[0].actionsUsed = 0;
  G.players[0].actionsPoints = 2;
  G.combat = { cardId: 'x' };
  G.selectedCardId = 'x';

  effect.onEnd({ G, ctx, events });

  assert(G.combat === null, 'onEnd clears combat');
  assert(G.players[0].actionsUsed === 1, 'onEnd increments actionsUsed');
  assert(effect.next({ G, ctx }) === GAME_PHASES.ACTION_SELECTION, 'next → ACTION_SELECTION');
}

// --- medusa_10: pick target and deal damage ---
{
  const medusa10 = loadHeroCards('medusa').find(c => c.id === 'medusa_10');
  const cardInHand = { ...medusa10, instanceId: 'medusa_10_0' };

  const G = makeG();
  const ctx = makeCtx(GAME_PHASES.EFFECT, '0');
  const events = mockEvents();
  G.players[0].hand = [cardInHand];
  G.players[0].fighters = [
    {
      id: 'medusa',
      name: 'Medusa',
      type: 'hero',
      rangeType: 'ranged',
      hp: 10,
      currentHp: 10,
      position: 1,
      move: 2,
      attackRange: 1,
      rangeType: 'ranged',
    },
  ];
  G.players[1].fighters[0].position = 2;
  G.players[1].fighters[0].currentHp = 5;

  effect.onBegin({ G, ctx, events });

  const pc = playCtx(G, ctx, events);
  assert(runMove('SELECT_CARD', pc, { cardId: 'medusa_10_0' }) !== false, 'play medusa_10');
  assert(G.pipeline !== null, 'pipeline started for medusa_10');

  assert(pickPipelineTarget(pc, 'hero2'), 'pick enemy fighter');
  assert(G.players[1].fighters[0].currentHp === 3, 'medusa_10 dealt 2 damage');
  assert(G.pipeline === null, 'medusa_10 pipeline done');
  assert(events.endPhaseCalled, 'effect phase ended');
}

console.log('effect: ok');
