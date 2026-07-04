import { EFFECT_TRIGGERS } from '../shared/constants/triggers.js';
import { evaluateCardTrigger, evaluateTrigger, pickPipelineCard, pickPipelineCell, pickPipelineTarget, startPipeline, submitPipelineInput } from '../shared/utils/rules/pipeline.js';
import { runFact } from '../shared/utils/rules/facts.js';
import { assert, makeCtx, makeMap, mockEvents, withCurrentHp } from './fixtures.mjs';
import { loadHeroCards } from './packLoader.mjs';

const medusaCards = loadHeroCards('medusa');
const medusa01 = medusaCards.find(c => c.id === 'medusa_01');
const medusa02 = medusaCards.find(c => c.id === 'medusa_02');
const medusa03 = medusaCards.find(c => c.id === 'medusa_03');
const medusa04 = medusaCards.find(c => c.id === 'medusa_04');
const medusa05 = medusaCards.find(c => c.id === 'medusa_05');
const medusa06 = medusaCards.find(c => c.id === 'medusa_06');
const medusa07 = medusaCards.find(c => c.id === 'medusa_07');
const medusa08 = medusaCards.find(c => c.id === 'medusa_08');
const medusa09 = medusaCards.find(c => c.id === 'medusa_09');
const medusa10 = medusaCards.find(c => c.id === 'medusa_10');
const medusa11 = medusaCards.find(c => c.id === 'medusa_11');
const deathGaze = medusa01.triggers[0];
const arrowVolley = medusa02.triggers[0];
const snakeWhisper = medusa03.triggers[0];
const flockCall = medusa04.triggers[0];
const snare = medusa05.triggers[0];
const acceleration = medusa06.triggers[0];
const poisonArrow = medusa07.triggers[0];
const deceptiveManeuver = medusa08.triggers[0];
const secondWind = medusa09.triggers[0];
const fatefulMeeting = medusa10.triggers[0];
const flockRebirth = medusa11.triggers[0];

const playedCard = card => ({
  id: card.id,
  type: card.type,
  fighter: card.fighter,
  bonus: card.bonus,
  phase: card.phase,
});

const normalizePlayers = players =>
  players.map(p => ({
    ...p,
    fighters: p.fighters?.map(withCurrentHp),
  }));

const makeCombatG = (overrides = {}) => {
  const G = {
    map: makeMap(),
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      defenderId: 'enemy1',
      winner: 'attacker',
      cardId: 'medusa_01',
      card: playedCard(medusa01),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [{ id: 'medusa', name: 'Medusa', type: 'hero', position: 1, hp: 10 }],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: 2, hp: 5 }],
      },
    ],
    vars: {},
    pipeline: null,
    pendingActions: [],
    highlightCells: [],
    highlightFighters: [],
    targetSelection: null,
    outputVar: null,
    log: [],
    ...overrides,
  };
  G.players = normalizePlayers(G.players);
  return G;
};

const ctx = makeCtx('ATTACK', '0');

assert(medusa01, 'medusa_01 loaded');
assert(deathGaze.trigger === EFFECT_TRIGGERS.AFTER_COMBAT, 'effect trigger');

{
  const G = makeCombatG();
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, deathGaze, G, ctx);
  assert(hook?.actions?.length === 1, 'death gaze triggers on win');
  assert(G.vars.$defender === 'enemy1', '$defender set');
}

{
  const G = makeCombatG({ combat: { ...makeCombatG().combat, winner: 'defender' } });
  assert(evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, deathGaze, G, ctx) === null, 'no effect on loss');
}

{
  const G = makeCombatG({ combat: { ...makeCombatG().combat, attackerId: 'harpies_1' } });
  assert(evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, deathGaze, G, ctx) === null, 'CARD_MATCHES_FIGHTER mismatch');
}

{
  const G = makeCombatG();
  const events = mockEvents();
  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, deathGaze, G, ctx);
  startPipeline(G, ctx, events, deathGaze.actions, 'medusa_01');
  assert(G.players[1].fighters[0].currentHp === 0, '8 damage kills defender (5 hp)');
  assert(G.pipeline === null, 'pipeline finished');
}

// --- medusa_02: during combat bonus from hand ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      cardId: 'medusa_02',
      card: playedCard(medusa02),
      attackBonus: 0,
    },
    players: [
      {
        id: '0',
        name: 'P0',
        hand: [
          {
            id: 'medusa_03',
            instanceId: 'medusa_03_0',
            title: 'Шепот змей',
            type: 'defense',
            bonus: 3,
          },
        ],
        fighters: [{ id: 'medusa', name: 'Medusa', type: 'hero', position: 1, hp: 10 }],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: 2, hp: 5 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  assert(
    evaluateTrigger(EFFECT_TRIGGERS.DURING_COMBAT, arrowVolley, G, ctx)?.actions?.length === 4,
    'arrow volley triggers with cards in hand',
  );

  startPipeline(G, ctx, playCtx.events, arrowVolley.actions, 'medusa_02');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'apply' }] });
  assert(G.targetSelection?.kind === 'card', 'hand card selection pending');

  assert(pickPipelineCard(playCtx, 'medusa_03_0'), 'pick bonus card');
  assert(G.combat.attackBonus === 3, 'combat attack bonus added');
  assert(G.players[0].hand.length === 0, 'bonus card discarded from hand');
  assert(G.players[0].discard.some(c => c.instanceId === 'medusa_03_0'), 'bonus card in discard');
  assert(G.pipeline === null, 'arrow volley pipeline done');
}

{
  const G = makeCombatG({
    players: [{ id: '0', name: 'P0', hand: [], fighters: [{ id: 'medusa', hp: 10, position: 1 }] }],
  });
  assert(
    evaluateTrigger(EFFECT_TRIGGERS.DURING_COMBAT, arrowVolley, G, ctx) === null,
    'arrow volley skipped with empty hand',
  );
}

// --- medusa_03: after combat opponent discard ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '1',
      attackerId: 'enemy1',
      defenderId: 'medusa',
      cardId: 'medusa_03',
      card: playedCard(medusa03),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        hand: [],
        discard: [],
        fighters: [{ id: 'medusa', name: 'Medusa', type: 'hero', position: 1, hp: 10 }],
      },
      {
        id: '1',
        name: 'P1',
        hand: [
          { id: 'p1_a', instanceId: 'p1_a_0', title: 'Карта A', type: 'attack' },
          { id: 'p1_b', instanceId: 'p1_b_0', title: 'Карта B', type: 'defense' },
        ],
        discard: [],
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: 2, hp: 5 }],
      },
    ],
  });
  const defCtx = makeCtx('DEFENSE', '0');
  const playCtx = { G, ctx: defCtx, events: mockEvents() };

  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, snakeWhisper, G, defCtx);
  assert(hook?.actions?.length === 2, 'snake whisper triggers with opponent hand');
  assert(G.vars.$combatOpponentId === '1', '$combatOpponentId set');
  assert(G.vars.$candidates?.length === 2, 'opponent hand candidates');

  startPipeline(G, defCtx, playCtx.events, snakeWhisper.actions, 'medusa_03');
  assert(G.targetSelection?.kind === 'card', 'opponent hand selection pending');
  assert(G.targetSelection?.playerId === '1', 'selection targets opponent');

  assert(pickPipelineCard(playCtx, 'p1_b_0'), 'opponent card picked');
  assert(G.players[1].hand.length === 1, 'one card left in opponent hand');
  assert(G.players[1].discard.some(c => c.instanceId === 'p1_b_0'), 'discarded card in opponent discard');
  assert(G.pipeline === null, 'snake whisper pipeline done');
}

{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '1',
      attackerId: 'enemy1',
      defenderId: 'medusa',
      cardId: 'medusa_03',
      card: playedCard(medusa03),
    },
    players: [
      { id: '0', name: 'P0', hand: [], fighters: [{ id: 'medusa', hp: 10, position: 1 }] },
      { id: '1', name: 'P1', hand: [], fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  assert(
    evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, snakeWhisper, G, makeCtx('DEFENSE', '0')) === null,
    'snake whisper skipped when opponent hand empty',
  );
}

// --- medusa_03: dead combat opponent hero → trigger does not fire ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '1',
      attackerId: 'enemy1',
      defenderId: 'medusa',
      cardId: 'medusa_03',
      card: playedCard(medusa03),
    },
    players: [
      { id: '0', name: 'P0', hand: [], fighters: [{ id: 'medusa', type: 'hero', hp: 10, position: 1 }] },
      {
        id: '1',
        name: 'P1',
        hand: [{ id: 'p1_a', instanceId: 'p1_a_0', title: 'Карта A', type: 'attack' }],
        fighters: [{ id: 'enemy1', type: 'hero', hp: 5, currentHp: 0, position: 2 }],
      },
    ],
  });
  assert(
    evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, snakeWhisper, G, makeCtx('DEFENSE', '0')) === null,
    'snake whisper skipped when combat opponent hero is dead',
  );
}

// --- medusa_05: after combat opponent discard (harpies hybrid) ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'harpies_1',
      defenderId: 'enemy1',
      cardId: 'medusa_05',
      card: playedCard(medusa05),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'harpies_1',
            name: 'Harpy 1',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            position: '1',
          },
        ],
      },
      {
        id: '1',
        name: 'P1',
        hand: [
          { id: 'p1_a', instanceId: 'p1_a_0', title: 'Карта A', type: 'attack' },
          { id: 'p1_b', instanceId: 'p1_b_0', title: 'Карта B', type: 'defense' },
        ],
        discard: [],
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: '2', hp: 5 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, snare, G, ctx);
  assert(hook?.actions?.length === 2, 'snare triggers with opponent hand');
  assert(G.vars.$combatOpponentId === '1', '$combatOpponentId set');

  startPipeline(G, ctx, playCtx.events, snare.actions, 'medusa_05');
  assert(G.targetSelection?.playerId === '1', 'opponent discards');

  assert(pickPipelineCard(playCtx, 'p1_a_0'), 'opponent card discarded');
  assert(G.players[1].hand.length === 1, 'one card left');
  assert(G.pipeline === null, 'snare pipeline done');
}

// --- medusa_05: dead combat opponent hero → trigger does not fire ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'harpies_1',
      defenderId: 'enemy1',
      cardId: 'medusa_05',
      card: playedCard(medusa05),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'harpies_1',
            name: 'Harpy 1',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            position: '1',
          },
        ],
      },
      {
        id: '1',
        name: 'P1',
        hand: [{ id: 'p1_a', instanceId: 'p1_a_0', title: 'Карта A', type: 'attack' }],
        fighters: [{ id: 'enemy1', type: 'hero', hp: 5, currentHp: 0, position: '2' }],
      },
    ],
  });
  assert(
    evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, snare, G, ctx) === null,
    'snare skipped when combat opponent hero is dead',
  );
}

// --- medusa_06: after combat optional move for combat fighter ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      defenderId: 'enemy1',
      cardId: 'medusa_06',
      card: playedCard(medusa06),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'medusa',
            name: 'Medusa',
            type: 'hero',
            hp: 10,
            move: 1,
            position: '1',
            startPosition: '1',
            canPassThroughEnemies: false,
          },
        ],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: '4', hp: 5 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, acceleration, G, ctx);
  assert(G.vars.$combatFighterId === 'medusa', 'combat fighter is card owner');

  startPipeline(G, ctx, playCtx.events, acceleration.actions, 'medusa_06');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  assert(G.targetSelection?.kind === 'cell', 'cell selection pending');

  assert(pickPipelineCell(playCtx, '3'), 'medusa moved to cell 3');
  assert(String(G.players[0].fighters[0].position) === '3', 'combat fighter moved');
  assert(G.pipeline === null, 'acceleration pipeline done');
}

{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      cardId: 'medusa_06',
      card: playedCard(medusa06),
    },
    players: [{ id: '0', fighters: [{ id: 'medusa', hp: 10, position: 1 }] }],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, acceleration, G, ctx);
  startPipeline(G, ctx, playCtx.events, acceleration.actions, 'medusa_06');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(G.pipeline === null, 'acceleration skipped');
  assert(String(G.players[0].fighters[0].position) === '1', 'fighter not moved on skip');
}

// --- medusa_07: after combat draw 1 ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      cardId: 'medusa_07',
      card: playedCard(medusa07),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        hand: [],
        deck: [{ id: 'd1', instanceId: 'd1_0', title: 'Deck card', type: 'attack' }],
        fighters: [{ id: 'medusa', name: 'Medusa', type: 'hero', position: '1', hp: 10 }],
      },
      { id: '1', name: 'P1', fighters: [{ id: 'enemy1', hp: 5, position: '2' }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, poisonArrow, G, ctx);
  assert(hook?.actions?.length === 1, 'poison arrow triggers');

  startPipeline(G, ctx, playCtx.events, poisonArrow.actions, 'medusa_07');
  assert(G.players[0].hand.length === 1, 'drew 1 card');
  assert(G.players[0].hand[0].instanceId === 'd1_0', 'drew from deck');
  assert(G.players[0].deck.length === 0, 'deck empty after draw');
  assert(G.pipeline === null, 'poison arrow pipeline done');
}

// --- medusa_08: instant ignore opponent card text ---
{
  const opponentCard = {
    id: 'opp_01',
    type: 'attack',
    fighter: 'enemy1',
    phase: 'after_combat',
    triggers: [{ id: 'opp_effect', trigger: 'after_combat', conditions: { all: [] }, actions: [] }],
  };
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '1',
      attackerId: 'enemy1',
      defenderId: 'medusa',
      card: opponentCard,
      cardPlayerId: '1',
      responseCard: playedCard(medusa08),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [{ id: 'medusa', name: 'Medusa', type: 'hero', position: '1', hp: 10 }],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: '2', hp: 5 }],
      },
    ],
  });
  const defCtx = makeCtx('DEFENSE', '0');
  const playCtx = { G, ctx: defCtx, events: mockEvents() };

  const hook = evaluateTrigger(EFFECT_TRIGGERS.INSTANT, deceptiveManeuver, G, defCtx);
  assert(hook?.actions?.length === 1, 'deceptive maneuver triggers in combat');

  startPipeline(G, defCtx, playCtx.events, deceptiveManeuver.actions, 'medusa_08');
  assert(G.combat.ignoreOpponentCardText === true, 'opponent card text suppressed');
  assert(G.pipeline === null, 'deceptive maneuver pipeline done');

  assert(
    evaluateCardTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, opponentCard.triggers[0], G, defCtx, '1') === null,
    'opponent card trigger suppressed',
  );
}

// --- medusa_09: after combat draw 1 or 2 on win ---
{
  const deck = [
    { id: 'd1', instanceId: 'd1_0', title: 'C1', type: 'attack' },
    { id: 'd2', instanceId: 'd2_0', title: 'C2', type: 'attack' },
    { id: 'd3', instanceId: 'd3_0', title: 'C3', type: 'attack' },
  ];
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      winner: 'attacker',
      cardId: 'medusa_09',
      card: playedCard(medusa09),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        hand: [],
        deck: [...deck],
        fighters: [{ id: 'medusa', hp: 10, position: '1' }],
      },
      { id: '1', name: 'P1', fighters: [{ id: 'enemy1', hp: 5, position: '2' }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, secondWind, G, ctx);
  assert(G.vars.$won === true, '$won on victory');
  startPipeline(G, ctx, playCtx.events, secondWind.actions, 'medusa_09');
  assert(G.players[0].hand.length === 2, 'drew 2 on win');
  assert(G.players[0].deck.length === 1, 'one card left in deck');
}

{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      winner: 'defender',
      cardId: 'medusa_09',
      card: playedCard(medusa09),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        hand: [],
        deck: [{ id: 'd1', instanceId: 'd1_0', title: 'C1', type: 'attack' }],
        fighters: [{ id: 'medusa', hp: 10, position: '1' }],
      },
      { id: '1', name: 'P1', fighters: [{ id: 'enemy1', hp: 5, position: '2' }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, secondWind, G, ctx);
  assert(G.vars.$won === false, '$won false on loss');
  startPipeline(G, ctx, playCtx.events, secondWind.actions, 'medusa_09');
  assert(G.players[0].hand.length === 1, 'drew 1 on loss');
  assert(G.pipeline === null, 'second wind pipeline done');
}

// --- medusa_10: instant damage in medusa zone ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      cardId: 'medusa_10',
      card: playedCard(medusa10),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'medusa',
            name: 'Medusa',
            type: 'hero',
            rangeType: 'ranged',
            hp: 10,
            position: '1',
          },
        ],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', hp: 5, position: '2' }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  const hook = evaluateTrigger(EFFECT_TRIGGERS.INSTANT, fatefulMeeting, G, ctx);
  assert(hook?.actions?.length === 2, 'fateful meeting triggers');
  assert(G.vars.$candidates?.includes('enemy1'), 'enemy in medusa zone');

  startPipeline(G, ctx, playCtx.events, fatefulMeeting.actions, 'medusa_10');
  assert(pickPipelineTarget(playCtx, 'enemy1'), 'pick target');
  assert(G.players[1].fighters[0].currentHp === 3, '2 damage dealt');
  assert(G.pipeline === null, 'fateful meeting pipeline done');
}

// --- medusa_04: after combat move each harpy ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'harpies_1',
      defenderId: 'enemy1',
      cardId: 'medusa_04',
      card: playedCard(medusa04),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'harpies_1',
            name: 'Harpy 1',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            move: 1,
            position: '1',
            startPosition: '1',
            canPassThroughEnemies: false,
          },
          {
            id: 'harpies_2',
            name: 'Harpy 2',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            move: 1,
            position: '2',
            startPosition: '2',
            canPassThroughEnemies: false,
          },
        ],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: '4', hp: 5 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, flockCall, G, ctx);
  assert(hook?.actions?.length === 7, 'flock call triggers with harpies on board');
  assert(G.vars.$harpies?.length === 2, '$harpies set');

  startPipeline(G, ctx, playCtx.events, flockCall.actions, 'medusa_04');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  assert(G.targetSelection?.kind === 'target', 'harpy selection pending');

  assert(pickPipelineTarget(playCtx, 'harpies_1'), 'pick harpy 1');
  assert(G.vars.$harpyId === 'harpies_1', '$harpyId set');
  assert(G.targetSelection?.kind === 'cell', 'cell selection pending');

  assert(pickPipelineCell(playCtx, '3'), 'move harpy 1 to cell 3');
  assert(String(G.players[0].fighters[0].position) === '3', 'harpy 1 moved');
  assert(G.vars.$harpies?.length === 1, 'one harpy left');
  assert(G.pendingActions.length === 2, 'prompt for next harpy');

  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(G.pipeline === null, 'flock call pipeline done after skip');
  assert(String(G.players[0].fighters[1].position) === '2', 'harpy 2 not moved');
}

{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'harpies_1',
      defenderId: 'enemy1',
      cardId: 'medusa_04',
      card: playedCard(medusa04),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'harpies_1',
            name: 'Harpy 1',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            move: 1,
            position: '1',
            startPosition: '1',
            canPassThroughEnemies: false,
          },
          {
            id: 'harpies_2',
            name: 'Harpy 2',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            move: 1,
            position: '2',
            startPosition: '2',
            canPassThroughEnemies: false,
          },
        ],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: '4', hp: 5 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, flockCall, G, ctx);
  startPipeline(G, ctx, playCtx.events, flockCall.actions, 'medusa_04');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  pickPipelineTarget(playCtx, 'harpies_1');
  pickPipelineCell(playCtx, '3');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  pickPipelineTarget(playCtx, 'harpies_2');
  pickPipelineCell(playCtx, '1');
  assert(G.pipeline === null, 'both harpies moved');
  assert(String(G.players[0].fighters[0].position) === '3', 'harpy 1 at 3');
  assert(String(G.players[0].fighters[1].position) === '1', 'harpy 2 at 1');
}

{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'harpies_1',
      cardId: 'medusa_04',
      card: playedCard(medusa04),
    },
    players: [{ id: '0', name: 'P0', fighters: [{ id: 'medusa', hp: 10, position: 1 }] }],
  });
  assert(
    evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, flockCall, G, ctx) === null,
    'flock call skipped without harpies',
  );
}

// --- medusa_11: optional move each fighter then resurrect harpy ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      cardId: 'medusa_11',
      card: playedCard(medusa11),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'medusa',
            name: 'Medusa',
            type: 'hero',
            rangeType: 'ranged',
            hp: 10,
            position: '1',
            canPassThroughEnemies: false,
          },
          {
            id: 'harpies_1',
            name: 'Harpy 1',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            currentHp: 0,
            position: null,
          },
          {
            id: 'harpies_2',
            name: 'Harpy 2',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            position: '3',
            canPassThroughEnemies: false,
          },
        ],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', hp: 5, position: '2' }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.INSTANT, flockRebirth, G, ctx);
  assert(G.vars.$fighters?.includes('medusa') && G.vars.$fighters?.includes('harpies_2'), 'fighters to move');
  assert(G.vars.$deadHarpies?.includes('harpies_1'), 'dead harpy listed');

  startPipeline(G, ctx, playCtx.events, flockRebirth.actions, 'medusa_11');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  assert(pickPipelineTarget(playCtx, 'harpies_2'), 'pick harpy 2 to move first');
  assert(pickPipelineCell(playCtx, '4'), 'harpy 2 moves off cell 3');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  assert(pickPipelineTarget(playCtx, 'medusa'), 'pick medusa');
  assert(pickPipelineCell(playCtx, '3'), 'medusa moves through enemy to cell 3');
  assert(pickPipelineCell(playCtx, '1'), 'resurrect harpy on free zone cell');

  const harpy1 = G.players[0].fighters.find(f => f.id === 'harpies_1');
  assert(String(G.players[0].fighters.find(f => f.id === 'medusa').position) === '3', 'medusa moved');
  assert(String(G.players[0].fighters.find(f => f.id === 'harpies_2').position) === '4', 'harpy 2 moved');
  assert(harpy1.currentHp === 1 && String(harpy1.position) === '1', 'harpy 1 resurrected with max hp');
  assert(G.pipeline === null, 'flock rebirth pipeline done');
}

{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      cardId: 'medusa_11',
      card: playedCard(medusa11),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          { id: 'medusa', name: 'Medusa', type: 'hero', hp: 10, position: '1' },
          {
            id: 'harpies_1',
            name: 'Harpy 1',
            group: 'harpies',
            type: 'assistant',
            hp: 3,
            currentHp: 0,
            position: null,
          },
        ],
      },
      { id: '1', name: 'P1', fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: '2' }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.INSTANT, flockRebirth, G, ctx);
  startPipeline(G, ctx, playCtx.events, flockRebirth.actions, 'medusa_11');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(pickPipelineCell(playCtx, '4'), 'pick resurrection cell after skipping moves');
  const harpy1 = G.players[0].fighters.find(f => f.id === 'harpies_1');
  assert(harpy1.currentHp === 3 && String(harpy1.position) === '4', 'harpy restored to max hp');
  assert(String(G.players[0].fighters.find(f => f.id === 'medusa').position) === '1', 'medusa not moved');
  assert(G.pipeline === null, 'flock rebirth done after skip');
}

// --- medusa: shuffled actions resolve by conditions ---
{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'harpies_1',
      defenderId: 'enemy1',
      cardId: 'medusa_04',
      card: playedCard(medusa04),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'harpies_1',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            move: 1,
            position: '1',
            startPosition: '1',
            canPassThroughEnemies: false,
          },
          {
            id: 'harpies_2',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            move: 1,
            position: '2',
            startPosition: '2',
            canPassThroughEnemies: false,
          },
        ],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: '4' }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, flockCall, G, ctx);
  startPipeline(G, ctx, playCtx.events, [...flockCall.actions].reverse(), 'medusa_04');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  pickPipelineTarget(playCtx, 'harpies_1');
  pickPipelineCell(playCtx, '3');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(String(G.players[0].fighters[0].position) === '3', 'm04 shuffled: harpy 1 moved');
  assert(String(G.players[0].fighters[1].position) === '2', 'm04 shuffled: harpy 2 not moved');
  assert(G.pipeline === null, 'm04 shuffled pipeline done');
}

{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      defenderId: 'enemy1',
      cardId: 'medusa_06',
      card: playedCard(medusa06),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'medusa',
            type: 'hero',
            hp: 10,
            move: 1,
            position: '1',
            startPosition: '1',
            canPassThroughEnemies: false,
          },
        ],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: '4' }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, acceleration, G, ctx);
  startPipeline(G, ctx, playCtx.events, [...acceleration.actions].reverse(), 'medusa_06');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  pickPipelineCell(playCtx, '3');
  assert(String(G.players[0].fighters[0].position) === '3', 'm06 shuffled: fighter moved');
  assert(G.pipeline === null, 'm06 shuffled pipeline done');
}

{
  const G = makeCombatG({
    combat: {
      attackerPlayerId: '0',
      attackerId: 'medusa',
      cardId: 'medusa_11',
      card: playedCard(medusa11),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        fighters: [
          {
            id: 'medusa',
            type: 'hero',
            rangeType: 'ranged',
            hp: 10,
            position: '1',
            canPassThroughEnemies: false,
          },
          {
            id: 'harpies_1',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            currentHp: 0,
            position: null,
          },
          {
            id: 'harpies_2',
            group: 'harpies',
            type: 'assistant',
            hp: 1,
            position: '3',
            canPassThroughEnemies: false,
          },
        ],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: '2' }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.INSTANT, flockRebirth, G, ctx);
  startPipeline(G, ctx, playCtx.events, [...flockRebirth.actions].reverse(), 'medusa_11');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  pickPipelineTarget(playCtx, 'harpies_2');
  pickPipelineCell(playCtx, '4');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'move' }] });
  pickPipelineTarget(playCtx, 'medusa');
  pickPipelineCell(playCtx, '3');
  pickPipelineCell(playCtx, '1');

  const harpy1 = G.players[0].fighters.find(f => f.id === 'harpies_1');
  assert(String(G.players[0].fighters.find(f => f.id === 'medusa').position) === '3', 'm11 shuffled: medusa moved');
  assert(String(G.players[0].fighters.find(f => f.id === 'harpies_2').position) === '4', 'm11 shuffled: harpy 2 moved');
  assert(harpy1.currentHp === 1 && String(harpy1.position) === '1', 'm11 shuffled: harpy 1 resurrected');
  assert(G.pipeline === null, 'm11 shuffled pipeline done');
}

console.log('cards: ok');
