import { ITEM_STATES } from '../shared/constants/items.js';
import { EFFECT_TRIGGERS } from '../shared/constants/triggers.js';
import { evaluateCardTrigger, evaluateTrigger, pickPipelineCell, pickPipelineTarget, startPipeline, submitPipelineInput } from '../shared/utils/rules/pipeline.js';
import { runFact } from '../shared/utils/rules/facts.js';
import { getAttackerPower } from '../shared/utils/combat.js';
import { assert, makeCtx, makeMap, mockEvents, withCurrentHp } from './fixtures.mjs';
import { loadHeroCards } from './packLoader.mjs';

const teslaCards = loadHeroCards('tesla');
const tesla01 = teslaCards.find(c => c.id === 'tesla_01');
const tesla02 = teslaCards.find(c => c.id === 'tesla_02');
const tesla03 = teslaCards.find(c => c.id === 'tesla_03');
const tesla04 = teslaCards.find(c => c.id === 'tesla_04');
const tesla05 = teslaCards.find(c => c.id === 'tesla_05');
const tesla06 = teslaCards.find(c => c.id === 'tesla_06');
const tesla07 = teslaCards.find(c => c.id === 'tesla_07');
const tesla08 = teslaCards.find(c => c.id === 'tesla_08');
const tesla09 = teslaCards.find(c => c.id === 'tesla_09');
const tesla10 = teslaCards.find(c => c.id === 'tesla_10');
const tesla11 = teslaCards.find(c => c.id === 'tesla_11');
const energyFlow = tesla01.triggers[0];
const lowFrequency = tesla02.triggers[0];
const focusedDischarge = tesla03.triggers[0];
const scientificBreakthrough = tesla04.triggers[0];
const xray = tesla05.triggers[0];
const stormBarrage = tesla06.triggers[0];
const phaseResonance = tesla07.triggers[0];
const energyImpulse = tesla08.triggers[0];
const inertialCharge = tesla09.triggers[0];
const waveImpact = tesla10.triggers[0];
const maxPower = tesla11.triggers[0];

const makeCoils = (states = [ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]) =>
  states.map((state, i) => ({
    id: `coil_${i + 1}`,
    type: 'coil',
    state,
  }));

const playedCard = card => ({
  id: card.id,
  type: card.type,
  value: card.value,
  fighter: card.fighter,
  bonus: card.bonus,
  phase: card.phase,
});

const makeCombatG = (card, overrides = {}) => {
  const G = {
    map: makeMap(),
    combat: {
      attackerPlayerId: '0',
      attackerId: 'tesla',
      defenderId: 'enemy1',
      cardId: card.id,
      card: playedCard(card),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        actionsPoints: 2,
        actionsUsed: 1,
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', name: 'Tesla', type: 'hero', position: 1, hp: 10, currentHp: 6 }],
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
  G.players = G.players.map(p => ({
    ...p,
    fighters: p.fighters?.map(withCurrentHp),
  }));
  return G;
};

const deckCards = (prefix, count = 5) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    instanceId: `${prefix}${i + 1}_0`,
    title: `${prefix}${i + 1}`,
    type: 'attack',
  }));

const makeTesla04G = (overrides = {}) =>
  makeCombatG(tesla04, {
    combat: {
      attackerPlayerId: '0',
      attackerId: 'enemy1',
      defenderId: 'tesla',
      cardId: tesla04.id,
      card: playedCard(tesla04),
    },
    players: [
      {
        id: '0',
        hand: [],
        deck: deckCards('d'),
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', name: 'Tesla', type: 'hero', position: 1, hp: 10, currentHp: 5 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: 2, hp: 5 }] },
    ],
    ...overrides,
  });

const oppDeckTop = {
  id: 'opp_top',
  instanceId: 'opp_top_0',
  title: 'Top Card',
  type: 'attack',
  bonus: 2,
};

const makeTesla05G = (overrides = {}) =>
  makeCombatG(tesla05, {
    combat: {
      attackerPlayerId: '0',
      attackerId: 'tesla',
      defenderId: 'enemy1',
      cardId: tesla05.id,
      card: playedCard(tesla05),
      attackBonus: 0,
    },
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', name: 'Tesla', type: 'hero', position: 1, hp: 10, currentHp: 6 }],
      },
      {
        id: '1',
        hand: [],
        discard: [],
        deck: [
          { id: 'opp_bottom', instanceId: 'opp_bottom_0', title: 'Bottom', type: 'defense', bonus: 0 },
          oppDeckTop,
        ],
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', position: 2, hp: 5 }],
      },
    ],
    ...overrides,
  });

const ctx = makeCtx('ATTACK', '0');

assert(tesla01, 'tesla_01 loaded');
assert(energyFlow.trigger === EFFECT_TRIGGERS.AFTER_COMBAT, 'after_combat trigger');

{
  const G = makeCombatG(tesla01);
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyFlow, G, ctx);
  assert(hook?.actions?.length === 4, 'energy flow triggers');
}

{
  const G = makeCombatG(tesla01, { combat: { ...makeCombatG(tesla01).combat, attackerId: 'enemy1' } });
  assert(
    evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyFlow, G, ctx) === null,
    'CARD_MATCHES_FIGHTER mismatch',
  );
}

// --- tesla_01: activate both coils ---
{
  const G = makeCombatG(tesla01);
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyFlow, G, ctx);
  startPipeline(G, ctx, playCtx.events, energyFlow.actions, 'tesla_01');
  assert(G.pendingActions.length === 2, 'two mandatory options');

  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'activate' }] });
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.ACTIVE), 'both coils active');
  assert(G.players[0].fighters[0].currentHp === 6, 'hp unchanged on activate');
  assert(G.pipeline === null, 'energy flow pipeline done');
}

// --- tesla_01: deactivate both coils and heal 2 ---
{
  const G = makeCombatG(tesla01, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', name: 'Tesla', type: 'hero', position: 1, hp: 10, currentHp: 7 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyFlow, G, ctx);
  startPipeline(G, ctx, playCtx.events, energyFlow.actions, 'tesla_01');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'heal' }] });
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'both coils inactive');
  assert(G.players[0].fighters[0].currentHp === 9, 'tesla healed by 2');
  assert(G.pipeline === null, 'energy flow heal pipeline done');
}

// --- tesla_01: heal when coils already inactive (skip deactivate) ---
{
  const G = makeCombatG(tesla01, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', name: 'Tesla', type: 'hero', position: 1, hp: 10, currentHp: 5 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyFlow, G, ctx);
  startPipeline(G, ctx, playCtx.events, energyFlow.actions, 'tesla_01');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'heal' }] });
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'coils stay inactive');
  assert(G.players[0].fighters[0].currentHp === 7, 'tesla healed without deactivate step');
  assert(G.pipeline === null, 'heal pipeline done with inactive coils');
}

// --- tesla_01: shuffled actions still resolve by conditions ---
{
  const shuffled = [...energyFlow.actions].reverse();
  const playCtx = { G: makeCombatG(tesla01), ctx, events: mockEvents() };

  startPipeline(playCtx.G, ctx, playCtx.events, shuffled, 'tesla_01');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'activate' }] });
  assert(playCtx.G.players[0].items.every(i => i.state === ITEM_STATES.ACTIVE), 'shuffled: both coils active');
  assert(playCtx.G.pipeline === null, 'shuffled activate pipeline done');
}

{
  const shuffled = [...energyFlow.actions].reverse();
  const G = makeCombatG(tesla01, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', name: 'Tesla', type: 'hero', position: 1, hp: 10, currentHp: 7 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, shuffled, 'tesla_01');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'heal' }] });
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'shuffled heal: coils inactive');
  assert(G.players[0].fighters[0].currentHp === 9, 'shuffled heal: +2 hp');
  assert(G.pipeline === null, 'shuffled heal pipeline done');
}

assert(tesla02, 'tesla_02 loaded');

// --- tesla_02: skip deactivation ---
{
  const G = makeCombatG(tesla02);
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, lowFrequency.actions, 'tesla_02');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(G.players[0].items.some(i => i.state === ITEM_STATES.ACTIVE), 'coils unchanged on skip');
  assert(G.players[0].actionsPoints === 2, 'no bonus action on skip');
  assert(G.pipeline === null, 'low frequency skipped');
}

// --- tesla_02: deactivate 1 of 2 active coils → +1 action ---
{
  const G = makeCombatG(tesla02, {
    players: [
      {
        id: '0',
        actionsPoints: 2,
        actionsUsed: 1,
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        deck: [],
        hand: [],
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, lowFrequency.actions, 'tesla_02');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '1' }] });
  assert(G.players[0].items.filter(i => i.state === ITEM_STATES.INACTIVE).length === 1, 'one coil off');
  assert(G.players[0].actionsPoints === 3, '+1 action for 1 coil');
  assert(G.players[0].hand.length === 0, 'no draw for 1 coil');
  assert(G.pipeline === null, 'low frequency one coil done');
}

// --- tesla_02: deactivate 2 coils → +1 action and draw ---
{
  const G = makeCombatG(tesla02, {
    players: [
      {
        id: '0',
        actionsPoints: 2,
        actionsUsed: 1,
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        deck: [{ id: 'd1', instanceId: 'd1_0', title: 'Deck', type: 'attack' }],
        hand: [],
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, lowFrequency.actions, 'tesla_02');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'both coils off');
  assert(G.players[0].actionsPoints === 3, '+1 action for 2 coils');
  assert(G.players[0].hand.length === 1, 'drew 1 for 2 coils');
  assert(G.pipeline === null, 'low frequency two coils done');
}

// --- tesla_02: only 1 active coil → auto deactivate without second prompt ---
{
  const G = makeCombatG(tesla02, {
    players: [
      {
        id: '0',
        actionsPoints: 2,
        actionsUsed: 1,
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        deck: [],
        hand: [],
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, lowFrequency.actions, 'tesla_02');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  assert(G.players[0].items.filter(i => i.state === ITEM_STATES.ACTIVE).length === 0, 'active coil deactivated');
  assert(G.players[0].actionsPoints === 3, '+1 action for single active coil');
  assert(G.pipeline === null, 'low frequency single active coil done');
}

// --- tesla_02: no active coils → trigger does not fire ---
{
  const G = makeCombatG(tesla02, {
    players: [
      {
        id: '0',
        actionsPoints: 2,
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });

  assert(
    evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, lowFrequency, G, ctx) === null,
    'low frequency does not trigger without active coils',
  );
}

// --- tesla_02: shuffled actions still resolve by conditions ---
{
  const shuffled = [...lowFrequency.actions].reverse();
  const G = makeCombatG(tesla02, {
    players: [
      {
        id: '0',
        actionsPoints: 2,
        actionsUsed: 1,
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        deck: [{ id: 'd1', instanceId: 'd1_0', title: 'Deck', type: 'attack' }],
        hand: [],
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, shuffled, 'tesla_02');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'shuffled: coils off');
  assert(G.players[0].actionsPoints === 3, 'shuffled: +1 action');
  assert(G.players[0].hand.length === 1, 'shuffled: draw');
  assert(G.pipeline === null, 'shuffled pipeline done');
}

assert(tesla03, 'tesla_03 loaded');
assert(focusedDischarge.trigger === EFFECT_TRIGGERS.DURING_COMBAT, 'during_combat trigger');

{
  const G = makeCombatG(tesla03);
  const hook = evaluateTrigger(EFFECT_TRIGGERS.DURING_COMBAT, focusedDischarge, G, ctx);
  assert(hook?.actions?.length === 7, 'focused discharge triggers');
  assert(G.combat.card.value === 3, 'card snapshot value unchanged');
}

// --- tesla_03: skip deactivation ---
{
  const G = makeCombatG(tesla03);
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, focusedDischarge.actions, 'tesla_03');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(G.combat.card.value === 3, 'skip: card snapshot unchanged');
  assert(G.combat.attackValue == null, 'skip: no attack value override');
  assert(getAttackerPower(G) === 7, 'skip: power from value+bonus (3+4)');
  assert(G.pipeline === null, 'focused discharge skipped');
}

// --- tesla_03: deactivate 1 coil → value 5 ---
{
  const G = makeCombatG(tesla03, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, focusedDischarge.actions, 'tesla_03');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '1' }] });
  assert(G.combat.card.value === 5, 'one coil: card value set to 5');
  assert(G.combat.attackValue == null, 'one coil: no attackValue override');
  assert(getAttackerPower(G) === 9, 'one coil: value+bonus (5+4)');
  assert(G.pipeline === null, 'focused discharge one coil done');
}

// --- tesla_03: deactivate 2 coils → value 7 ---
{
  const G = makeCombatG(tesla03, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, focusedDischarge.actions, 'tesla_03');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.combat.card.value === 7, 'two coils: card value set to 7');
  assert(G.combat.attackValue == null, 'two coils: no attackValue override');
  assert(getAttackerPower(G) === 11, 'two coils: value+bonus (7+4)');
  assert(G.pipeline === null, 'focused discharge two coils done');
}

// --- tesla_03: only 1 active coil → auto count ---
{
  const G = makeCombatG(tesla03, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, focusedDischarge.actions, 'tesla_03');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  assert(G.combat.card.value === 5, 'single active coil: card value set to 5');
  assert(G.combat.attackValue == null, 'single active coil: no attackValue override');
  assert(getAttackerPower(G) === 9, 'single active coil: value+bonus (5+4)');
  assert(G.pipeline === null, 'focused discharge single active coil done');
}

// --- tesla_03: no active coils → trigger does not fire ---
{
  const G = makeCombatG(tesla03, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });

  assert(
    evaluateTrigger(EFFECT_TRIGGERS.DURING_COMBAT, focusedDischarge, G, ctx) === null,
    'focused discharge does not trigger without active coils',
  );
}

// --- tesla_03: shuffled actions ---
{
  const shuffled = [...focusedDischarge.actions].reverse();
  const G = makeCombatG(tesla03, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, shuffled, 'tesla_03');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.combat.card.value === 7, 'shuffled: card value set to 7');
  assert(G.combat.attackValue == null, 'shuffled: no attackValue override');
  assert(getAttackerPower(G) === 11, 'shuffled: value+bonus (7+4)');
  assert(G.pipeline === null, 'shuffled focused discharge done');
}

assert(tesla04, 'tesla_04 loaded');

{
  const G = makeTesla04G();
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, scientificBreakthrough, G, ctx);
  assert(hook?.actions?.length === 10, 'scientific breakthrough triggers');
}

// --- tesla_04: initial draw only on skip ---
{
  const G = makeTesla04G();
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, scientificBreakthrough.actions, 'tesla_04');
  assert(G.players[0].hand.length === 1, 'initial draw before prompt');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(G.players[0].hand.length === 1, 'skip: only initial draw');
  assert(G.pipeline === null, 'scientific breakthrough skipped');
}

// --- tesla_04: no active coils → initial draw only ---
{
  const G = makeTesla04G({
    players: [
      {
        id: '0',
        hand: [],
        deck: deckCards('d'),
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, currentHp: 5, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, scientificBreakthrough.actions, 'tesla_04');
  assert(G.pendingActions.length === 0, 'no coil prompt without active coils');
  assert(G.players[0].hand.length === 1, 'initial draw without coils');
  assert(G.pipeline === null, 'scientific breakthrough no coils done');
}

// --- tesla_04: deactivate 1 coil → +1 card ---
{
  const G = makeTesla04G({
    players: [
      {
        id: '0',
        hand: [],
        deck: deckCards('d'),
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, currentHp: 5, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, scientificBreakthrough.actions, 'tesla_04');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '1' }] });
  assert(G.players[0].hand.length === 2, 'initial + 1 coil draw');
  assert(G.players[0].fighters[0].currentHp === 5, 'one coil: no heal');
  assert(G.pipeline === null, 'scientific breakthrough one coil done');
}

// --- tesla_04: deactivate 2 coils → +2 cards and heal 1 ---
{
  const G = makeTesla04G({
    players: [
      {
        id: '0',
        hand: [],
        deck: deckCards('d', 6),
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, currentHp: 5, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, scientificBreakthrough.actions, 'tesla_04');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.players[0].hand.length === 3, 'initial + 2 coil draws');
  assert(G.players[0].fighters[0].currentHp === 6, 'two coils: heal 1');
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'both coils off');
  assert(G.pipeline === null, 'scientific breakthrough two coils done');
}

// --- tesla_04: single active coil auto count ---
{
  const G = makeTesla04G({
    players: [
      {
        id: '0',
        hand: [],
        deck: deckCards('d'),
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, currentHp: 5, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, scientificBreakthrough.actions, 'tesla_04');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  assert(G.players[0].hand.length === 2, 'single active coil: 2 cards total');
  assert(G.pipeline === null, 'scientific breakthrough single active coil done');
}

// --- tesla_04: shuffled actions ---
{
  const shuffled = [...scientificBreakthrough.actions].reverse();
  const G = makeTesla04G({
    players: [
      {
        id: '0',
        hand: [],
        deck: deckCards('d', 6),
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, currentHp: 5, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, shuffled, 'tesla_04');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.players[0].hand.length === 3, 'shuffled: 3 cards drawn');
  assert(G.players[0].fighters[0].currentHp === 6, 'shuffled: heal 1');
  assert(G.pipeline === null, 'shuffled scientific breakthrough done');
}

assert(tesla05, 'tesla_05 loaded');

{
  const G = makeTesla05G();
  const hook = evaluateTrigger(EFFECT_TRIGGERS.DURING_COMBAT, xray, G, ctx);
  assert(hook?.actions?.length === 10, 'xray triggers');
}

// --- tesla_05: reveal opponent top card ---
{
  const G = makeTesla05G();
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, xray.actions, 'tesla_05');
  assert(G.vars.$revealedCards?.includes('opp_top_0'), 'revealed top card id');
  assert(G.combat.revealedDeckCards?.length === 1, 'revealed cards stored for display');
  assert(G.players[1].deck.length === 2, 'reveal does not remove from deck');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(G.players[1].deck.length === 2, 'skip: card stays in opponent deck');
  assert(!G.combat.revealedDeckCards?.length, 'skip: revealed card hidden');
  assert(G.pipeline === null, 'xray skipped');
}

// --- tesla_05: 1 coil discards revealed card ---
{
  const G = makeTesla05G({
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      {
        id: '1',
        hand: [],
        discard: [],
        deck: [
          { id: 'opp_bottom', instanceId: 'opp_bottom_0', title: 'Bottom', type: 'defense', bonus: 0 },
          oppDeckTop,
        ],
        fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, xray.actions, 'tesla_05');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '1' }] });
  assert(G.players[1].deck.length === 1, 'one coil: top card discarded from deck');
  assert(G.players[1].discard.some(c => c.instanceId === 'opp_top_0'), 'revealed card in discard');
  assert((G.combat.attackBonus ?? 0) === 0, 'one coil: no attack bonus');
  assert(G.pipeline === null, 'xray one coil done');
}

// --- tesla_05: 2 coils add revealed bonus ---
{
  const G = makeTesla05G({
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      {
        id: '1',
        hand: [],
        discard: [],
        deck: [
          { id: 'opp_bottom', instanceId: 'opp_bottom_0', title: 'Bottom', type: 'defense', bonus: 0 },
          oppDeckTop,
        ],
        fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };

  startPipeline(G, ctx, playCtx.events, xray.actions, 'tesla_05');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.players[1].deck.length === 1, 'two coils: card discarded from deck');
  assert(G.players[1].discard.some(c => c.instanceId === 'opp_top_0'), 'two coils: card in discard');
  assert(G.combat.attackBonus === 2, 'two coils: +revealed bonus');
  assert(getAttackerPower(G) === 7, 'two coils: 4+1+2 attack power');
  assert(G.pipeline === null, 'xray two coils done');
}

// --- tesla_05: empty opponent deck ---
{
  const G = makeTesla05G({
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', hand: [], discard: [], deck: [], fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });

  const hook = evaluateTrigger(EFFECT_TRIGGERS.DURING_COMBAT, xray, G, ctx);
  assert(!hook, 'xray does not trigger on empty opponent deck');
}

// --- tesla_05: no active coils → trigger does not fire ---
{
  const G = makeTesla05G({
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1 }],
      },
      {
        id: '1',
        deck: [oppDeckTop],
        fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }],
      },
    ],
  });

  assert(
    evaluateTrigger(EFFECT_TRIGGERS.DURING_COMBAT, xray, G, ctx) === null,
    'xray does not trigger without active coils',
  );
}

// --- tesla_05: dead combat opponent hero → trigger does not fire ---
{
  const G = makeTesla05G({
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      {
        id: '1',
        deck: [oppDeckTop],
        fighters: [{ id: 'enemy1', type: 'hero', hp: 5, currentHp: 0, position: 2 }],
      },
    ],
  });

  assert(
    evaluateTrigger(EFFECT_TRIGGERS.DURING_COMBAT, xray, G, ctx) === null,
    'xray does not trigger when combat opponent hero is dead',
  );
}

assert(tesla06, 'tesla_06 loaded');

{
  const G = makeCombatG(tesla06);
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, stormBarrage, G, ctx);
  assert(hook?.actions?.length === 8, 'storm barrage triggers');
}

// --- tesla_06: no active coils → trigger does not fire ---
{
  const G = makeCombatG(tesla06, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });

  assert(
    evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, stormBarrage, G, ctx) === null,
    'storm barrage does not trigger without active coils',
  );
}

// --- tesla_06: skip deactivation ---
{
  const G = makeCombatG(tesla06);
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, stormBarrage, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_06');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(G.players[1].fighters[0].currentHp === 5, 'skip: no damage');
  assert(G.players[0].items.some(i => i.state === ITEM_STATES.ACTIVE), 'skip: coils unchanged');
  assert(G.pipeline === null, 'storm barrage skipped');
}

// --- tesla_06: 1 coil → 1 damage in zone ---
{
  const G = makeCombatG(tesla06, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, stormBarrage, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_06');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '1' }] });
  assert(G.players[1].fighters[0].currentHp === 4, 'one coil: 1 damage in zone');
  assert(G.pipeline === null, 'storm barrage one coil done');
}

// --- tesla_06: 2 coils → 2 damage in zone ---
{
  const G = makeCombatG(tesla06, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, stormBarrage, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_06');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.players[1].fighters[0].currentHp === 3, 'two coils: 2 damage in zone');
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'two coils deactivated');
  assert(G.pipeline === null, 'storm barrage two coils done');
}

// --- tesla_06: no enemies in zone → trigger does not fire ---
{
  const G = makeCombatG(tesla06, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: null }] },
    ],
  });

  assert(
    evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, stormBarrage, G, ctx) === null,
    'storm barrage does not trigger without targets in zone',
  );
}

// --- tesla_06: hero and assistant in zone both damaged ---
{
  const G = makeCombatG(tesla06, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      {
        id: '1',
        fighters: [
          { id: 'enemy_hero', type: 'hero', hp: 5, position: 2 },
          { id: 'enemy_asst', type: 'assistant', hp: 3, position: 3 },
        ],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const candidates = runFact(
    'FIGHTERS_IN_RANGE',
    { sourceId: 'tesla', side: 'opponent' },
    { G, ctx },
  );
  assert(candidates.includes('enemy_hero') && candidates.includes('enemy_asst'), 'all opponent fighters in zone');

  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, stormBarrage, G, ctx);
  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_06');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  assert(G.players[1].fighters[0].currentHp === 4, 'hero damaged');
  assert(G.players[1].fighters[1].currentHp === 2, 'assistant damaged');
  assert(G.pipeline === null, 'storm barrage auto one coil done');
}

assert(tesla07, 'tesla_07 loaded');

const makeTesla07DefenseG = (overrides = {}) => {
  const opponentCard = {
    id: 'opp_attack',
    type: 'attack',
    value: 5,
    bonus: 2,
    fighter: 'enemy1',
    phase: 'after_combat',
    triggers: [{ id: 'opp_effect', trigger: 'after_combat', conditions: { all: [] }, actions: [] }],
  };
  return makeCombatG(tesla07, {
    combat: {
      attackerPlayerId: '1',
      attackerId: 'enemy1',
      defenderId: 'tesla',
      card: opponentCard,
      cardPlayerId: '1',
      responseCard: playedCard(tesla07),
    },
    ...overrides,
  });
};

// --- tesla_07: no active coils → trigger does not fire ---
{
  const G = makeTesla07DefenseG({
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const defCtx = makeCtx('DEFENSE', '0');

  assert(
    evaluateTrigger(EFFECT_TRIGGERS.INSTANT, phaseResonance, G, defCtx) === null,
    'phase resonance does not trigger without active coils',
  );
}

// --- tesla_07: 1 coil → ignore opponent card text ---
{
  const G = makeTesla07DefenseG({
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const defCtx = makeCtx('DEFENSE', '0');
  const playCtx = { G, ctx: defCtx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.INSTANT, phaseResonance, G, defCtx);

  startPipeline(G, defCtx, playCtx.events, hook.actions, 'tesla_07');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  assert(G.combat.ignoreOpponentCardText === true, 'one coil: opponent text suppressed');
  assert(G.combat.attackValue == null, 'one coil: no power override');
  assert(getAttackerPower(G) === 7, 'one coil: opponent attack power unchanged');
  assert(
    evaluateCardTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, G.combat.card.triggers[0], G, defCtx, '1') === null,
    'one coil: opponent card trigger suppressed',
  );
  assert(G.pipeline === null, 'phase resonance one coil done');
}

// --- tesla_07: 2 coils → ignore text, zero card value, skill bonus still applies ---
{
  const G = makeTesla07DefenseG({
    combat: {
      attackerPlayerId: '1',
      attackerId: 'enemy1',
      defenderId: 'tesla',
      card: {
        id: 'opp_attack',
        type: 'attack',
        value: 5,
        bonus: 2,
        fighter: 'enemy1',
        phase: 'after_combat',
        triggers: [{ id: 'opp_effect', trigger: 'after_combat', conditions: { all: [] }, actions: [] }],
      },
      cardPlayerId: '1',
      responseCard: playedCard(tesla07),
      attackBonus: 1,
    },
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const defCtx = makeCtx('DEFENSE', '0');
  const playCtx = { G, ctx: defCtx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.INSTANT, phaseResonance, G, defCtx);

  startPipeline(G, defCtx, playCtx.events, hook.actions, 'tesla_07');
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(G.combat.ignoreOpponentCardText === true, 'two coils: opponent text suppressed');
  assert(G.combat.card.value === 0, 'two coils: opponent card value zeroed');
  assert(G.combat.attackValue == null, 'two coils: no attackValue override');
  assert(getAttackerPower(G) === 3, 'two coils: value+bonus+attackBonus (0+2+1)');
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'two coils deactivated');
  assert(G.pipeline === null, 'phase resonance two coils done');
}

assert(tesla08, 'tesla_08 loaded');

const runEnergyImpulseOpponentMove = playCtx => {
  submitPipelineInput(playCtx, { vars: [{ var: '$moveAnswer', value: 'move' }] });
  assert(pickPipelineCell(playCtx, '4'), 'move combat opponent to cell 4');
};

// --- tesla_08: combat opponent off board → skip move prompt ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: null }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
  assert(G.pendingActions.length === 0, 'no move prompt without combat opponent on board');
  assert(G.pipeline === null, 'energy impulse done without combat opponent on board');
}

// --- tesla_08: dead combat opponent → skip move prompt ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, currentHp: 0, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
  assert(G.pendingActions.length === 0, 'no move prompt when combat opponent is dead');
  assert(G.pipeline === null, 'energy impulse done when combat opponent is dead');
}

// --- tesla_08: skip move, no active coils ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
  submitPipelineInput(playCtx, { vars: [{ var: '$moveAnswer', value: 'skip' }] });
  assert(String(G.players[1].fighters[0].position) === '2', 'skip move: opponent unchanged');
  assert(G.pipeline === null, 'energy impulse skip move no coils done');
}

// --- tesla_08: move opponent, no active coils ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
  runEnergyImpulseOpponentMove(playCtx);
  assert(String(G.players[1].fighters[0].position) === '4', 'opponent moved without coils');
  assert(String(G.players[0].fighters[0].position) === '1', 'tesla unchanged without coils');
  assert(G.pipeline === null, 'energy impulse no coils done');
}

// --- tesla_08: skip move, skip coil deactivation ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
  submitPipelineInput(playCtx, { vars: [{ var: '$moveAnswer', value: 'skip' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(String(G.players[1].fighters[0].position) === '2', 'skip move: opponent unchanged');
  assert(G.players[0].items.some(i => i.state === ITEM_STATES.ACTIVE), 'skip coils: coils unchanged');
  assert(G.pipeline === null, 'energy impulse skip move and coils done');
}

// --- tesla_08: skip coil deactivation after opponent move ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
  runEnergyImpulseOpponentMove(playCtx);
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'skip' }] });
  assert(String(G.players[1].fighters[0].position) === '4', 'skip: opponent still moved');
  assert(G.players[0].items.some(i => i.state === ITEM_STATES.ACTIVE), 'skip: coils unchanged');
  assert(G.pipeline === null, 'energy impulse skip coils done');
}

// --- tesla_08: 1 coil → move tesla ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
  runEnergyImpulseOpponentMove(playCtx);
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  assert(pickPipelineCell(playCtx, '3'), 'one coil: move tesla to cell 3');
  assert(String(G.players[0].fighters[0].position) === '3', 'one coil: tesla moved');
  assert(G.players[0].items.filter(i => i.state === ITEM_STATES.ACTIVE).length === 0, 'one coil off');
  assert(G.pipeline === null, 'energy impulse one coil done');
}

// --- tesla_08: 2 coils → move tesla and random opponent discard ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      {
        id: '1',
        hand: [
          { id: 'h1', instanceId: 'h1_0', title: 'Hand 1', type: 'attack' },
          { id: 'h2', instanceId: 'h2_0', title: 'Hand 2', type: 'defense' },
        ],
        fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);
  const random = Math.random;
  Math.random = () => 0;

  try {
    startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
    runEnergyImpulseOpponentMove(playCtx);
    submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
    submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
    assert(pickPipelineCell(playCtx, '3'), 'two coils: move tesla');
    assert(String(G.players[0].fighters[0].position) === '3', 'two coils: tesla moved');
    assert(G.players[0].items.every(i => i.state === ITEM_STATES.INACTIVE), 'two coils off');
    assert(G.players[1].hand.length === 1, 'two coils: one card left in hand');
    assert(G.players[1].discard.length === 1, 'two coils: one card discarded');
    assert(G.players[1].discard[0].instanceId === 'h1_0', 'two coils: first card discarded');
    assert(G.pipeline === null, 'energy impulse two coils done');
  } finally {
    Math.random = random;
  }
}

// --- tesla_08: 2 coils → no discard when opponent hero is dead ---
{
  const G = makeCombatG(tesla08, {
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.ACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      {
        id: '1',
        hand: [
          { id: 'h1', instanceId: 'h1_0', title: 'Hand 1', type: 'attack' },
          { id: 'h2', instanceId: 'h2_0', title: 'Hand 2', type: 'defense' },
        ],
        discard: [],
        fighters: [
          { id: 'opponent_hero', type: 'hero', hp: 10, currentHp: 0, position: 3 },
          { id: 'enemy1', type: 'assistant', hp: 5, position: 2 },
        ],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, energyImpulse, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_08');
  runEnergyImpulseOpponentMove(playCtx);
  submitPipelineInput(playCtx, { vars: [{ var: '$answer', value: 'deactivate' }] });
  submitPipelineInput(playCtx, { vars: [{ var: '$coilCount', value: '2' }] });
  assert(pickPipelineCell(playCtx, '3'), 'dead hero: still move tesla with two coils');
  assert(G.players[1].hand.length === 2, 'dead hero: hand unchanged');
  assert(G.players[1].discard.length === 0, 'dead hero: no discard');
  assert(G.pipeline === null, 'energy impulse two coils without alive opponent done');
}

assert(tesla09, 'tesla_09 loaded');

// --- tesla_09: win → activate 2 coils ---
{
  const G = makeCombatG(tesla09, {
    combat: {
      attackerPlayerId: '0',
      attackerId: 'tesla',
      defenderId: 'enemy1',
      winner: 'attacker',
      cardId: tesla09.id,
      card: playedCard(tesla09),
    },
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, inertialCharge, G, ctx);

  assert(hook?.actions?.length === 2, 'inertial charge triggers');
  assert(G.vars.$won === true, 'inertial charge: won');
  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_09');
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.ACTIVE), 'win: both coils active');
  assert(G.pipeline === null, 'inertial charge win done');
}

// --- tesla_09: loss → activate 1 coil ---
{
  const G = makeCombatG(tesla09, {
    combat: {
      attackerPlayerId: '0',
      attackerId: 'tesla',
      defenderId: 'enemy1',
      winner: 'defender',
      cardId: tesla09.id,
      card: playedCard(tesla09),
    },
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, inertialCharge, G, ctx);

  assert(hook?.actions?.length === 2, 'inertial charge triggers on loss');
  assert(G.vars.$won === false, 'inertial charge: lost');
  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_09');
  assert(
    G.players[0].items.filter(i => i.state === ITEM_STATES.ACTIVE).length === 1,
    'loss: one coil active',
  );
  assert(G.pipeline === null, 'inertial charge loss done');
}

// --- tesla_09: defense win → activate 2 coils ---
{
  const defCtx = makeCtx('DEFENSE', '0');
  const G = makeCombatG(tesla09, {
    combat: {
      attackerPlayerId: '1',
      attackerId: 'enemy1',
      defenderId: 'tesla',
      winner: 'defender',
      cardId: tesla09.id,
      card: playedCard(tesla09),
    },
    players: [
      {
        id: '0',
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1, rangeType: 'ranged', attackRange: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx: defCtx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.AFTER_COMBAT, inertialCharge, G, defCtx);

  assert(hook?.actions?.length === 2, 'inertial charge triggers on defense win');
  assert(G.vars.$won === true, 'inertial charge: defense win');
  startPipeline(G, defCtx, playCtx.events, hook.actions, 'tesla_09');
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.ACTIVE), 'defense win: both coils active');
  assert(G.pipeline === null, 'inertial charge defense win done');
}

assert(tesla10, 'tesla_10 loaded');

const makeTesla10G = (overrides = {}) =>
  makeCombatG(tesla10, {
    combat: {
      attackerPlayerId: '0',
      attackerId: 'tesla',
      cardId: tesla10.id,
      card: playedCard(tesla10),
    },
    players: [
      {
        id: '0',
        name: 'P0',
        actionsPoints: 2,
        fighters: [{ id: 'tesla', name: 'Tesla', type: 'hero', position: 1, hp: 10 }],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [
          { id: 'enemy1', name: 'Enemy', type: 'hero', hp: 5, position: 2 },
          { id: 'minion1', name: 'Minion', type: 'assistant', hp: 3, position: 4 },
        ],
      },
    ],
    ...overrides,
  });

// --- tesla_10: skip move → grant 1 action ---
{
  const G = makeTesla10G();
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.INSTANT, waveImpact, G, ctx);

  assert(hook?.actions?.length === 9, 'wave impact triggers');
  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_10');
  submitPipelineInput(playCtx, { vars: [{ var: '$moveAnswer', value: 'skip' }] });
  assert(G.players[0].actionsPoints === 3, 'skip: +1 action');
  assert(G.pipeline === null, 'wave impact skip done');
}

// --- tesla_10: move opponent fighters → grant 1 action ---
{
  const G = makeTesla10G({
    players: [
      {
        id: '0',
        name: 'P0',
        actionsPoints: 2,
        fighters: [{ id: 'tesla', name: 'Tesla', type: 'hero', position: 1, hp: 10 }],
      },
      {
        id: '1',
        name: 'P1',
        fighters: [{ id: 'enemy1', name: 'Enemy', type: 'hero', hp: 5, position: 2 }],
      },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.INSTANT, waveImpact, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_10');
  submitPipelineInput(playCtx, { vars: [{ var: '$moveAnswer', value: 'move' }] });
  assert(G.vars.$opponentId === '1', 'single opponent auto-selected');
  assert(pickPipelineTarget(playCtx, 'enemy1'), 'pick opponent fighter');
  assert(pickPipelineCell(playCtx, '4'), 'move enemy1 to cell 4');
  assert(String(G.players[1].fighters[0].position) === '4', 'enemy1 moved');
  assert(G.players[0].actionsPoints === 3, 'after moves: +1 action');
  assert(G.pipeline === null, 'wave impact move done');
}

assert(tesla11, 'tesla_11 loaded');

// --- tesla_11: activate both coils and grant 1 action ---
{
  const G = makeCombatG(tesla11, {
    combat: {
      attackerPlayerId: '0',
      attackerId: 'tesla',
      cardId: tesla11.id,
      card: playedCard(tesla11),
    },
    players: [
      {
        id: '0',
        actionsPoints: 2,
        items: makeCoils([ITEM_STATES.INACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.INSTANT, maxPower, G, ctx);

  assert(hook?.actions?.length === 2, 'max power triggers');
  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_11');
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.ACTIVE), 'both coils active');
  assert(G.players[0].actionsPoints === 3, 'max power: +1 action');
  assert(G.pipeline === null, 'max power done');
}

// --- tesla_11: one coil already active ---
{
  const G = makeCombatG(tesla11, {
    combat: {
      attackerPlayerId: '0',
      attackerId: 'tesla',
      cardId: tesla11.id,
      card: playedCard(tesla11),
    },
    players: [
      {
        id: '0',
        actionsPoints: 1,
        items: makeCoils([ITEM_STATES.ACTIVE, ITEM_STATES.INACTIVE]),
        fighters: [{ id: 'tesla', hp: 10, position: 1 }],
      },
      { id: '1', fighters: [{ id: 'enemy1', type: 'hero', hp: 5, position: 2 }] },
    ],
  });
  const playCtx = { G, ctx, events: mockEvents() };
  const hook = evaluateTrigger(EFFECT_TRIGGERS.INSTANT, maxPower, G, ctx);

  startPipeline(G, ctx, playCtx.events, hook.actions, 'tesla_11');
  assert(G.players[0].items.every(i => i.state === ITEM_STATES.ACTIVE), 'second coil activated');
  assert(G.players[0].actionsPoints === 2, 'max power: +1 action from one remaining');
  assert(G.pipeline === null, 'max power partial coils done');
}

console.log('tesla cards: ok');
