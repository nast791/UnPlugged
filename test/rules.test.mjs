import { runFact } from '../shared/utils/rules/facts.js';
import { runEvent } from '../shared/utils/rules/events.js';
import { runMove } from '../shared/utils/rules/moves.js';
import { applyOwnFighterPhaseCells } from '../shared/utils/rules/moves.js';
import { finishPipeline, pickPipelineCard, pickPipelineOpponentPlayer } from '../shared/utils/rules/pipeline.js';
import { getAttackerPower, getDefenderPower, resolveCombatPowers } from '../shared/utils/combat.js';
import { assert, makeG, makeCtx, makePlayer, withCurrentHp } from './fixtures.mjs';

const ctx = makeCtx;

// --- smoke: circular imports ---
applyOwnFighterPhaseCells({ G: makeG(), ctx: ctx('MOVEMENT') });

// --- ATTACK_CELLS ---
{
  const G = makeG();
  const cells = runFact('ATTACK_CELLS', { startPos: '1', maxSteps: 2 }, { G, ctx: ctx() });
  assert(cells.includes('1') && cells.includes('2') && cells.includes('3'), 'ATTACK_CELLS reach');
}

// --- PLACEMENT_CELLS / CAN_PLACE_FIGHTER ---
{
  const G = makeG();
  const c = ctx('UNIT_PLACEMENT', '0');
  const cells = runFact('PLACEMENT_CELLS', { fighterId: 'hero1' }, { G, ctx: c });
  assert(cells.hero[0] === 1, 'PLACEMENT_CELLS hero node');
  assert(cells.assistant.includes(2), 'PLACEMENT_CELLS assistant zone');
  assert(
    runFact('CAN_PLACE_FIGHTER', { fighterId: 'hero1', cellId: 1 }, { G, ctx: c }),
    'CAN_PLACE_FIGHTER hero on start',
  );
  assert(
    !runFact('CAN_PLACE_FIGHTER', { fighterId: 'hero1', cellId: 4 }, { G, ctx: c }),
    'CAN_PLACE_FIGHTER rejects invalid cell for hero',
  );
}

// --- SET_FIGHTER_POSITION + PLACE_FIGHTER move ---
{
  const G = makeG();
  const c = ctx('UNIT_PLACEMENT', '0');
  const events = { endTurn: () => {} };
  assert(runMove('PLACE_FIGHTER', { G, ctx: c, events }, { unitId: 'hero1', circleId: 1 }), 'PLACE_FIGHTER');
  assert(G.players[0].fighters[0].position === 1, 'fighter placed');
  assert(G.players[0].fighters[0].startPosition === 1, 'startPosition set');
  assert(G.log.length === 1, 'placement log once');
}

// --- PLACE_FIGHTER rejects occupied ---
{
  const G = makeG();
  G.players[0].fighters[0].position = 1;
  G.players[0].fighters[0].startPosition = 1;
  const c = ctx('UNIT_PLACEMENT', '0');
  assert(
    !runMove('PLACE_FIGHTER', { G, ctx: c, events: {} }, { unitId: 'asst1', circleId: 1 }),
    'PLACE_FIGHTER rejects occupied hero cell',
  );
}

// --- MOVEMENT_CELLS / MOVE_FIGHTER ---
{
  const G = makeG();
  const hero = G.players[0].fighters[0];
  hero.move = 1;
  hero.position = 1;
  hero.startPosition = 1;
  const c = ctx('MOVEMENT', '0');
  const cells = runFact('MOVEMENT_CELLS', { fighterId: 'hero1' }, { G, ctx: c });
  assert(cells.includes('1') && cells.includes('2'), 'MOVEMENT_CELLS from start');
  assert(
    runEvent(G, c, 'MOVE_FIGHTER', {
      params: { fighterId: 'hero1', cellId: '2', validate: true },
      raw: true,
    }),
    'MOVE_FIGHTER event',
  );
  assert(String(hero.position) === '2', 'fighter moved');
  assert(
    !runEvent(G, c, 'MOVE_FIGHTER', {
      params: { fighterId: 'hero1', cellId: '4', validate: true },
      raw: true,
    }),
    'MOVE_FIGHTER rejects out of range',
  );
}

// --- ADD_BONUS movement / clear ---
{
  const G = makeG();
  const c = ctx('MOVEMENT', '0');
  runEvent(G, c, 'ADD_BONUS', { params: { scope: 'movement', value: 2, cardId: 'c1' }, raw: true });
  assert(G.bonus === 2 && G.bonusCards.length === 1, 'ADD_BONUS movement');
  runEvent(G, c, 'ADD_BONUS', { params: { scope: 'movement', clear: true }, raw: true });
  assert(G.bonus === 0 && G.bonusCards.length === 0, 'ADD_BONUS movement clear');
}

// --- RESET_FIGHTERS_POSITIONS ---
{
  const G = makeG();
  const hero = G.players[0].fighters[0];
  hero.position = 2;
  hero.startPosition = 1;
  const c = ctx('MOVEMENT', '0');
  runEvent(G, c, 'RESET_FIGHTERS_POSITIONS', { params: { playerId: '0', log: false }, raw: true });
  assert(hero.position === 1, 'RESET_FIGHTERS_POSITIONS');
}

// --- SET_FIGHTER_POSITION log: false ---
{
  const G = makeG();
  const c = ctx('UNIT_PLACEMENT', '0');
  const len = G.log.length;
  runEvent(G, c, 'SET_FIGHTER_POSITION', {
    params: { fighterId: 'hero1', cellId: 1, setStartPosition: true, log: false },
    raw: true,
  });
  assert(G.log.length === len, 'SET_FIGHTER_POSITION silent log');
}

// --- CARDS_IN_HAND ---
{
  const G = makeG();
  G.players[0].hand = [{ id: 'c1', type: 'effect', role: 'any' }];
  const c = ctx('ACTION_SELECTION', '0');
  assert(
    runFact('CARDS_IN_HAND', { types: ['effect'], phase: 'EFFECT' }, { G, ctx: c }).length === 1,
    'CARDS_IN_HAND effect in EFFECT phase',
  );
  assert(!runFact('CARDS_IN_HAND', { types: ['attack'], phase: 'ATTACK' }, { G, ctx: c }).length, 'CARDS_IN_HAND no attack card');
}

// --- CARDS_IN_HAND filters ---
{
  const G = makeG();
  G.players[0].hand = [
    { id: 'a1', instanceId: 'a1_0', type: 'attack', bonus: 2, fighter: 'medusa' },
    { id: 'a2', instanceId: 'a2_0', type: 'defense', bonus: 1, fighter: 'any' },
    { id: 'a3', instanceId: 'a3_0', type: 'hybrid', bonus: 2, fighter: 'harpies' },
  ];
  G.players[0].fighters.push(
    withCurrentHp({
      id: 'medusa',
      type: 'hero',
      hp: 10,
      position: 1,
    }),
  );
  G.players[0].fighters.push(
    withCurrentHp({
      id: 'harpies_1',
      group: 'harpies',
      type: 'assistant',
      hp: 1,
      position: 2,
    }),
  );
  const c = ctx('ATTACK', '0');
  const all = runFact('CARDS_IN_HAND', { phase: 'ATTACK' }, { G, ctx: c });
  assert(all.length === 2 && all.includes('a1_0') && all.includes('a3_0'), 'CARDS_IN_HAND attack phase');
  const attacks = runFact('CARDS_IN_HAND', { types: ['attack'], phase: 'ATTACK' }, { G, ctx: c });
  assert(attacks.length === 1 && attacks[0] === 'a1_0', 'CARDS_IN_HAND types filter');
  const minBonus = runFact('CARDS_IN_HAND', { minBonus: 2, phase: 'ATTACK' }, { G, ctx: c });
  assert(minBonus.length === 2, 'CARDS_IN_HAND minBonus filter');
  const excluded = runFact('CARDS_IN_HAND', { excludeIds: ['a1_0'], phase: 'ATTACK' }, { G, ctx: c });
  assert(excluded.length === 1 && excluded[0] === 'a3_0', 'CARDS_IN_HAND excludeIds filter');
  const medusaCards = runFact('CARDS_IN_HAND', { fighterId: 'medusa', phase: 'ATTACK' }, { G, ctx: c });
  assert(medusaCards.length === 1 && medusaCards[0] === 'a1_0', 'CARDS_IN_HAND medusa in ATTACK');
  const harpyCards = runFact('CARDS_IN_HAND', { fighterId: 'harpies_1', phase: 'ATTACK' }, { G, ctx: c });
  assert(harpyCards.length === 1 && harpyCards[0] === 'a3_0', 'CARDS_IN_HAND harpy in ATTACK');
}

// --- ACTIVE_FIGHTER ---
{
  const G = makeG();
  G.players[0].fighters.push(withCurrentHp({ id: 'medusa', type: 'hero', hp: 10, position: 1 }));
  G.combat = { attackerId: 'medusa' };
  const c = ctx('ATTACK', '0');
  assert(runFact('ACTIVE_FIGHTER', {}, { G, ctx: c }) === 'medusa', 'ACTIVE_FIGHTER id');
  assert(runFact('ACTIVE_FIGHTER', { fighterId: 'medusa' }, { G, ctx: c }), 'ACTIVE_FIGHTER is medusa');
  assert(!runFact('ACTIVE_FIGHTER', { fighterId: 'harpies' }, { G, ctx: c }), 'ACTIVE_FIGHTER not harpies');
}

// --- CARDS_IN_HAND forActiveFighter ---
{
  const G = makeG();
  G.combat = { attackerId: 'harpies_1' };
  G.players[0].fighters.push(
    withCurrentHp({ id: 'harpies_1', group: 'harpies', type: 'assistant', hp: 1, position: 2 }),
  );
  G.players[0].hand = [
    { id: 'm1', instanceId: 'm1_0', type: 'attack', fighter: 'medusa' },
    { id: 'h1', instanceId: 'h1_0', type: 'attack', fighter: 'harpies' },
    { id: 'a1', instanceId: 'a1_0', type: 'attack', fighter: 'any' },
  ];
  const cards = runFact('CARDS_IN_HAND', { forActiveFighter: true, types: ['attack'], phase: 'ATTACK' }, {
    G,
    ctx: ctx('ATTACK', '0'),
  });
  assert(cards.length === 2 && cards.includes('h1_0') && cards.includes('a1_0'), 'forActiveFighter harpies');
}

// --- CARDS_IN_HAND phase filter (explicit phase param) ---
{
  const G = makeG();
  G.players[0].hand = [
    { id: 'atk', instanceId: 'atk_0', type: 'attack', bonus: 2 },
    { id: 'def', instanceId: 'def_0', type: 'defense', bonus: 2 },
    { id: 'hyb', instanceId: 'hyb_0', type: 'hybrid', bonus: 1 },
    { id: 'eff', instanceId: 'eff_0', type: 'effect', bonus: 3 },
  ];
  const attackPhase = runFact('CARDS_IN_HAND', { phase: 'ATTACK' }, { G, ctx: ctx('MOVEMENT', '0') });
  assert(attackPhase.length === 2 && attackPhase.includes('atk_0') && attackPhase.includes('hyb_0'), 'phase: ATTACK');
  const defensePhase = runFact('CARDS_IN_HAND', { phase: 'DEFENSE' }, { G, ctx: ctx('MOVEMENT', '0') });
  assert(defensePhase.length === 2 && defensePhase.includes('def_0') && defensePhase.includes('hyb_0'), 'phase: DEFENSE');
  const effectPhase = runFact('CARDS_IN_HAND', { phase: 'EFFECT' }, { G, ctx: ctx('MOVEMENT', '0') });
  assert(effectPhase.length === 1 && effectPhase[0] === 'eff_0', 'phase: EFFECT');
  const noPhase = runFact('CARDS_IN_HAND', {}, { G, ctx: ctx('MOVEMENT', '0') });
  assert(noPhase.length === 4, 'without phase param — all cards in hand');
}

// --- CARD_MATCHES_FIGHTER / CARD_MATCHES_PHASE ---
{
  const G = makeG();
  G.players[0].fighters.push(withCurrentHp({ id: 'medusa', type: 'hero', hp: 10, position: 1 }));
  G.combat = {
    attackerId: 'medusa',
    card: { id: 'medusa_01', type: 'attack', fighter: 'medusa' },
  };
  const c = ctx('ATTACK', '0');
  assert(runFact('PLAYED_CARD', {}, { G, ctx: c }) === 'medusa_01', 'PLAYED_CARD id');
  assert(runFact('CARD_MATCHES_FIGHTER', {}, { G, ctx: c }), 'CARD_MATCHES_FIGHTER ok');
  assert(runFact('CARD_MATCHES_PHASE', {}, { G, ctx: c }), 'attack card in ATTACK phase');
  G.combat.attackerId = 'harpies_1';
  G.players[0].fighters.push(withCurrentHp({ id: 'harpies_1', group: 'harpies', type: 'assistant', hp: 1, position: 2 }));
  assert(!runFact('CARD_MATCHES_FIGHTER', {}, { G, ctx: c }), 'CARD_MATCHES_FIGHTER mismatch');
  G.combat.card = { id: 'm04', type: 'hybrid', fighter: 'harpies' };
  assert(runFact('CARD_MATCHES_FIGHTER', {}, { G, ctx: c }), 'CARD_MATCHES_FIGHTER harpy card');
  assert(runFact('CARD_MATCHES_PHASE', {}, { G, ctx: ctx('DEFENSE', '0') }), 'hybrid in DEFENSE');
  assert(!runFact('CARD_MATCHES_PHASE', {}, { G, ctx: ctx('EFFECT', '0') }), 'hybrid not in EFFECT');
  G.combat = {
    attackerId: 'enemy1',
    defenderId: 'medusa',
    card: { id: 'medusa_03', type: 'defense', fighter: 'medusa' },
  };
  G.players[0].fighters.push(withCurrentHp({ id: 'medusa', type: 'hero', hp: 10, position: 1 }));
  assert(runFact('CARD_MATCHES_FIGHTER', {}, { G, ctx: ctx('DEFENSE', '0') }), 'defense card matches defender');
  assert(!runFact('CARD_MATCHES_PHASE', {}, { G, ctx: ctx('ATTACK', '0') }), 'defense card not in ATTACK phase');
  G.players[0].fighters.find(f => f.id === 'medusa').position = null;
  assert(!runFact('CARD_MATCHES_FIGHTER', {}, { G, ctx: ctx('DEFENSE', '0') }), 'defense card fails when fighter off board');
  G.players[0].fighters.find(f => f.id === 'medusa').position = 1;
  G.combat = {
    card: { id: 'medusa_11', type: 'effect', fighter: 'any', phase: 'instant' },
  };
  G.selectedUnitId = 'harpies_1';
  assert(runFact('CARD_MATCHES_FIGHTER', {}, { G, ctx: ctx('EFFECT', '0') }), 'any-fighter card with harpy on board');
  G.selectedUnitId = 'medusa';
  G.players[0].fighters.find(f => f.id === 'medusa').position = null;
  assert(!runFact('CARD_MATCHES_FIGHTER', {}, { G, ctx: ctx('EFFECT', '0') }), 'declared fighter must be on board');
}

// --- OPPONENT_PLAYER ---
{
  const G = makeG();
  const opponent = runFact('OPPONENT_PLAYER', {}, { G, ctx: ctx('MOVEMENT', '0') });
  assert(opponent === '1', 'OPPONENT_PLAYER id');
  const cards = runFact(
    'CARDS_IN_HAND',
    { playerId: opponent },
    { G, ctx: ctx('MOVEMENT', '0') },
  );
  assert(cards.length === G.players[1].hand.length, 'CARDS_IN_HAND for opponent');
}

// --- OWN_FIGHTERS / MOVEMENT_CELLS fromCurrent ---
{
  const G = makeG();
  G.players[0].fighters.push(
    withCurrentHp({
      id: 'harpies_1',
      group: 'harpies',
      type: 'assistant',
      hp: 1,
      position: '1',
      startPosition: '1',
      move: 1,
    }),
    withCurrentHp({
      id: 'harpies_2',
      group: 'harpies',
      type: 'assistant',
      hp: 1,
      position: '2',
      startPosition: '2',
      move: 1,
    }),
  );
  const harpies = runFact('OWN_FIGHTERS', { group: 'harpies' }, { G, ctx: ctx('ATTACK', '0') });
  assert(harpies.length === 2, 'OWN_FIGHTERS harpies on board');
  const cells = runFact(
    'MOVEMENT_CELLS',
    { fighterId: 'harpies_1', maxSteps: 3, fromCurrent: true },
    { G, ctx: ctx('ATTACK', '0') },
  );
  assert(cells.includes('1') && cells.includes('3'), 'MOVEMENT_CELLS from current up to 3');
}

// --- COMBAT_FIGHTER ---
{
  const G = makeG();
  G.players[0].fighters[0].id = 'medusa';
  G.players[0].fighters[0].position = '1';
  G.combat = {
    attackerPlayerId: '0',
    attackerId: 'medusa',
    defenderId: 'enemy1',
    card: { id: 'medusa_06', type: 'hybrid', fighter: 'any' },
  };
  const id = runFact('COMBAT_FIGHTER', {}, { G, ctx: ctx('ATTACK', '0') });
  assert(id === 'medusa', 'COMBAT_FIGHTER attacker in ATTACK');
  G.combat = {
    attackerPlayerId: '1',
    attackerId: 'enemy1',
    defenderId: 'medusa',
    card: { id: 'medusa_03', type: 'defense', fighter: 'medusa' },
  };
  G.players[0].fighters[0].position = '1';
  assert(
    runFact('COMBAT_FIGHTER', {}, { G, ctx: ctx('DEFENSE', '0') }) === 'medusa',
    'COMBAT_FIGHTER defender for defense card',
  );
}

// --- COMBAT_OPPONENT_FIGHTER / COMBAT_OPPONENT_PLAYER ---
{
  const G = makeG();
  G.players[0].fighters[0].id = 'tesla';
  G.players[0].fighters[0].position = '1';
  G.players[1].fighters[0].id = 'enemy1';
  G.players[1].fighters[0].position = '2';
  G.combat = {
    attackerPlayerId: '0',
    attackerId: 'tesla',
    defenderId: 'enemy1',
    card: { id: 'tesla_08', type: 'hybrid', fighter: 'tesla' },
  };
  const c = ctx('ATTACK', '0');
  assert(
    runFact('COMBAT_OPPONENT_FIGHTER', {}, { G, ctx: c }) === 'enemy1',
    'COMBAT_OPPONENT_FIGHTER when opponent defends',
  );
  assert(
    runFact('COMBAT_OPPONENT_PLAYER', {}, { G, ctx: c }) === '1',
    'COMBAT_OPPONENT_PLAYER when opponent defends',
  );
  G.combat = {
    attackerPlayerId: '1',
    attackerId: 'enemy1',
    defenderId: 'tesla',
    card: { id: 'tesla_08', type: 'hybrid', fighter: 'tesla' },
  };
  assert(
    runFact('COMBAT_OPPONENT_FIGHTER', {}, { G, ctx: ctx('DEFENSE', '0') }) === 'enemy1',
    'COMBAT_OPPONENT_FIGHTER when opponent attacks',
  );
  G.players[1].fighters[0].currentHp = 0;
  assert(
    runFact('COMBAT_OPPONENT_FIGHTER', {}, { G, ctx: ctx('DEFENSE', '0') }) === 'enemy1',
    'COMBAT_OPPONENT_FIGHTER returns id even when opponent fighter is dead',
  );
  assert(
    runFact(
      'FIGHTER_ALIVE',
      { fighterId: 'enemy1', onBoard: true },
      { G, ctx: ctx('DEFENSE', '0') },
    ) === false,
    'FIGHTER_ALIVE false for dead fighter on board',
  );
}

// --- FIGHTER_ALIVE / PLAYER_ALIVE ---
{
  const G = makeG();
  G.players[1].fighters[0].id = 'enemy1';
  G.players[1].fighters[0].position = '2';
  G.players[1].fighters[0].currentHp = 3;
  assert(
    runFact('FIGHTER_ALIVE', { fighterId: 'enemy1' }, { G, ctx: ctx('EFFECT', '0') }) === true,
    'FIGHTER_ALIVE true for living fighter',
  );
  G.players[1].fighters[0].position = null;
  assert(
    runFact('FIGHTER_ALIVE', { fighterId: 'enemy1', onBoard: true }, { G, ctx: ctx('EFFECT', '0') }) ===
      false,
    'FIGHTER_ALIVE false when fighter off board',
  );
  G.players[1].fighters[0].currentHp = 0;
  assert(
    runFact('PLAYER_ALIVE', { playerId: '1' }, { G, ctx: ctx('EFFECT', '0') }) === false,
    'PLAYER_ALIVE false when hero is dead',
  );
}

// --- FIGHTERS_IN_RANGE side any ---
{
  const G = makeG();
  const medusa = withCurrentHp({
    id: 'medusa',
    type: 'hero',
    rangeType: 'ranged',
    hp: 10,
    position: '1',
  });
  G.players[0].fighters = [
    medusa,
    withCurrentHp({ id: 'harpies_1', type: 'assistant', hp: 1, position: '3' }),
  ];
  G.players[1].fighters[0].position = '2';
  const candidates = runFact(
    'FIGHTERS_IN_RANGE',
    { sourceId: 'medusa', side: 'any', kind: 'fighter' },
    { G, ctx: ctx('EFFECT', '0') },
  );
  assert(candidates.includes('harpies_1') && candidates.includes('hero2'), 'any side includes own and enemy');
}

// --- pipeline state cleanup (no vars/target leak) ---
{
  const G = makeG({
    vars: { $x: 1 },
    outputVar: '$x',
    targetSelection: { kind: 'target', returnKey: '$x', candidates: ['a'], selection: 1, picked: [] },
    pipeline: { actions: [], id: 't' },
    pendingActions: [{ id: 'a' }],
  });
  const events = { endPhase: () => {} };
  finishPipeline({ G, ctx: ctx(), events });
  assert(Object.keys(G.vars).length === 0, 'vars cleared');
  assert(G.pipeline === null, 'pipeline cleared');
  assert(G.targetSelection === null, 'targetSelection cleared');
  assert(G.outputVar === null, 'outputVar cleared');
  assert(G.pendingActions.length === 0, 'pendingActions cleared');
}

// --- stress: repeated moves do not leak vars/highlight state ---
{
  const G = makeG();
  const hero = G.players[0].fighters[0];
  hero.position = 1;
  hero.startPosition = 1;
  const c = ctx('MOVEMENT', '0');
  for (let i = 0; i < 50; i++) {
    runMove('MOVE_FIGHTER', { G, ctx: c, events: {} }, { fighterId: 'hero1', targetId: i % 2 ? '1' : '2' });
    runMove('CLEAR_HIGHLIGHTS', { G, ctx: c, events: {} });
  }
  assert(G.vars && Object.keys(G.vars).length === 0, 'no vars leak after moves');
  assert(!G.outputVar, 'no outputVar leak');
}

// --- REFRESH_MOVEMENT_UI does not log ---
{
  const G = makeG();
  const hero = G.players[0].fighters[0];
  hero.position = 1;
  hero.startPosition = 1;
  const c = ctx('MOVEMENT', '0');
  G.log.push({ msg: 'phase hint', type: 'info' });
  const len = G.log.length;
  runMove('REFRESH_MOVEMENT_UI', { G, ctx: c, events: {} });
  runMove('REFRESH_MOVEMENT_UI', { G, ctx: c, events: {} });
  assert(G.log.length === len, 'REFRESH_MOVEMENT_UI silent');
  assert(G.pendingActions.some(a => a.action === 'confirmMovement'), 'movement actions set');
}

// --- CANCEL_MOVEMENT_BONUS ---
{
  const G = makeG();
  const c = ctx('MOVEMENT', '0');
  const player = G.players[0];
  const hero = player.fighters[0];
  hero.position = 2;
  hero.startPosition = 1;
  const card = { id: 'bonus1', name: 'Boost', type: 'movement', bonus: 1, role: 'any' };
  player.discard.push(card);
  G.bonus = 1;
  G.bonusCards = ['bonus1'];

  assert(runMove('CANCEL_MOVEMENT_BONUS', { G, ctx: c, events: {} }), 'CANCEL_MOVEMENT_BONUS');
  assert(player.hand.some(c => c.id === 'bonus1'), 'card restored to hand');
  assert(G.bonus === 0 && G.bonusCards.length === 0, 'bonus cleared');
  assert(hero.position === 1, 'positions reset after cancel');
}

// --- FINISH_PLACEMENT move ---
{
  const G = makeG();
  G.players[0].fighters.forEach(f => {
    f.position = 1;
    f.startPosition = 1;
  });
  const c = ctx('UNIT_PLACEMENT', '0');
  const events = { endTurn: () => { events.called = true; }, called: false };

  runMove('FINISH_PLACEMENT', { G, ctx: c, events });
  assert(events.called, 'FINISH_PLACEMENT endTurn');
  assert(G.pendingActions.length === 0, 'pendingActions cleared');
}

// --- AUTO_PLACE_AI move ---
{
  const G = makeG();
  const c = ctx('UNIT_PLACEMENT', '1');
  const events = { endTurn: () => { events.called = true; }, called: false };

  assert(runMove('AUTO_PLACE_AI', { G, ctx: c, events }), 'AUTO_PLACE_AI');
  assert(G.players[1].fighters.every(f => f.position != null), 'AI all placed');
  assert(events.called, 'AUTO_PLACE_AI endTurn');
}

// --- HEAL_FIGHTERS ---
{
  const G = makeG();
  const hero = G.players[0].fighters[0];
  hero.hp = 10;
  hero.currentHp = 5;
  const c = ctx('ATTACK', '0');

  runEvent(G, c, 'HEAL_FIGHTERS', { params: { targets: 'hero1', heal: 2 } });
  assert(hero.currentHp === 7, 'HEAL_FIGHTERS restores hp');

  runEvent(G, c, 'HEAL_FIGHTERS', { params: { targets: 'hero1', heal: 10 } });
  assert(hero.currentHp === 10, 'HEAL_FIGHTERS capped at hp');
}

// --- GRANT_ACTIONS ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.players[0].actionsPoints = 2;
  G.players[0].actionsUsed = 2;

  runEvent(G, c, 'GRANT_ACTIONS', { params: { count: 1 } });
  assert(G.players[0].actionsPoints === 3, 'GRANT_ACTIONS adds action point');
}

// --- SET_VARIABLES combat.attackValue ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.combat = {
    card: { id: 'tesla_03', type: 'attack', value: 3, bonus: 4 },
    attackBonus: 0,
  };

  runEvent(G, c, 'SET_VARIABLES', {
    params: { vars: [{ var: 'combat.attackValue', value: 5 }] },
  });
  assert(G.combat.card.value === 3, 'SET_VARIABLES does not mutate card snapshot');
  assert(G.combat.attackValue === 5, 'SET_VARIABLES sets attackValue');
  assert(getAttackerPower(G) === 5, 'attackValue overrides value+bonus+attackBonus');
}

// --- REMOVE_VARIABLES ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.combat = { attackValue: 5 };
  G.vars = { $foo: 1, $bar: 2 };

  runEvent(G, c, 'REMOVE_VARIABLES', {
    params: { vars: [{ var: 'combat.attackValue' }, { var: '$foo' }] },
  });
  assert(G.combat.attackValue === undefined, 'REMOVE_VARIABLES clears G path');
  assert(G.vars.$foo === undefined && G.vars.$bar === 2, 'REMOVE_VARIABLES clears $ vars');
}

// --- combat power ---
{
  const G = makeG();
  G.combat = {
    card: { id: 'a1', type: 'attack', value: 3, bonus: 4 },
    attackBonus: 2,
  };
  assert(getAttackerPower(G) === 9, 'attacker power = value + bonus + attackBonus');

  G.combat.attackValue = 5;
  assert(getAttackerPower(G) === 5, 'attackValue replaces auxiliary fields');

  G.combat = {
    responseCard: { id: 'd1', type: 'defense', value: 2, bonus: 1 },
    defenseBonus: 3,
  };
  assert(getDefenderPower(G) === 6, 'defender power = value + bonus + defenseBonus');

  G.combat.defenseValue = 4;
  assert(getDefenderPower(G) === 4, 'defenseValue replaces auxiliary fields');

  G.combat = {
    card: { id: 'a1', type: 'attack', value: 3, bonus: 4 },
    responseCard: { id: 'd1', type: 'defense', value: 2, bonus: 1 },
    attackValue: 5,
    defenseValue: 4,
  };
  resolveCombatPowers(G);
  assert(G.combat.attackerPower === 5, 'resolveCombatPowers writes attackerPower');
  assert(G.combat.defenderPower === 4, 'resolveCombatPowers writes defenderPower');
}

// --- MOVE_CARDS reveal / discard ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.players[1].deck = [
    { id: 'b', instanceId: 'b_0', title: 'Bottom', bonus: 1 },
    { id: 't', instanceId: 't_0', title: 'Top', bonus: 3 },
  ];

  runEvent(G, c, 'MOVE_CARDS', {
    params: { playerId: '1', count: 1, from: 'deck', fromPosition: 'top', to: 'revealed' },
    return: '$revealed',
  });
  assert(G.vars.$revealed?.[0] === 't_0', 'MOVE_CARDS reveal top card');
  assert(G.players[1].deck.length === 2, 'reveal keeps cards in deck');
  assert(G.combat.revealedDeckCards?.length === 1, 'revealedDeckCards stored');

  runEvent(G, c, 'MOVE_CARDS', {
    params: { playerId: '1', from: 'deck', targets: '$revealed', count: 1, to: 'discard' },
  });
  assert(G.players[1].deck.length === 1, 'MOVE_CARDS removes from deck');
  assert(G.players[1].discard[0].instanceId === 't_0', 'MOVE_CARDS to discard pile');
}

// --- MOVE_CARDS reveal: partial deck (count > deck size) ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.players[1].deck = [
    { id: 'a', instanceId: 'a_0', title: 'A', bonus: 1 },
    { id: 'b', instanceId: 'b_0', title: 'B', bonus: 2 },
  ];

  runEvent(G, c, 'MOVE_CARDS', {
    params: { playerId: '1', count: 3, from: 'deck', fromPosition: 'top', to: 'revealed' },
    return: '$revealed',
  });
  assert(G.vars.$revealed?.length === 2, 'reveal takes all cards when deck is smaller than count');
  assert(G.players[1].deck.length === 2, 'reveal does not remove cards from deck');
}

// --- DECK_COUNT ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.players[1].deck = [{ id: 't', instanceId: 't_0' }];
  assert(
    runFact('DECK_COUNT', { side: 'opponent' }, { G, ctx: c }) === 1,
    'DECK_COUNT opponent deck',
  );
  G.players[1].deck = [];
  assert(
    runFact('DECK_COUNT', { side: 'opponent' }, { G, ctx: c }) === 0,
    'DECK_COUNT empty deck',
  );
}

// --- SELECT_CARDS / ADD_BONUS from deck ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.combat = { attackBonus: 0 };
  G.players[1].deck = [{ id: 't', instanceId: 't_0', title: 'Top', bonus: 3 }];

  runEvent(G, c, 'MOVE_CARDS', {
    params: { playerId: '1', count: 1, from: 'deck', fromPosition: 'top', to: 'revealed' },
    return: '$revealed',
  });

  const pending = runEvent(G, c, 'SELECT_CARDS', {
    params: { playerId: '1', source: 'revealed', candidates: '$revealed', pick: 'auto' },
    return: '$picked',
  });
  assert(pending.status === 'pending', 'SELECT_CARDS auto pending');
  assert(G.targetSelection?.kind === 'card', 'card targetSelection');
  assert(G.targetSelection?.autoPick?.cardId === 't_0', 'autoPick for single revealed card');

  assert(pickPipelineCard({ G, ctx: c }, 't_0'), 'pick revealed card');
  assert(G.vars.$picked === 't_0', 'selected card stored');

  runEvent(G, c, 'ADD_BONUS', {
    params: { playerId: '1', cardId: '$picked' },
  });
  assert(G.combat.attackBonus === 3, 'ADD_BONUS reads bonus from deck card');
  assert(G.players[1].deck.length === 1, 'deck card unchanged until MOVE_CARDS');
}

// --- SELECT_OPPONENT_PLAYER ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');

  const auto = runEvent(G, c, 'SELECT_OPPONENT_PLAYER', { return: '$opponentId' });
  assert(auto.status === 'done', 'single opponent auto-selected');
  assert(G.vars.$opponentId === '1', 'opponent id stored');
  assert(G.targetSelection === null, 'no selection pending for single opponent');
}

{
  const G = makeG({ players: [makePlayer('0'), makePlayer('1'), makePlayer('2')] });
  const c = ctx('ATTACK', '0');

  const pending = runEvent(G, c, 'SELECT_OPPONENT_PLAYER', { return: '$opponentId' });
  assert(pending.status === 'pending', 'multiple opponents pending');
  assert(G.targetSelection?.kind === 'opponent', 'opponent targetSelection');
  assert(G.targetSelection?.candidates.join(',') === '1,2', 'opponent candidates');

  assert(pickPipelineOpponentPlayer({ G, ctx: c }, '2'), 'pick opponent player');
  assert(G.vars.$opponentId === '2', 'selected opponent stored');
  assert(G.targetSelection === null, 'opponent selection cleared');
}

// --- MOVE_CARDS (deck reorder / hand) ---
{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.combat = {};
  G.players[1].deck = [
    { id: 'b', instanceId: 'b_0', title: 'Bottom', bonus: 0 },
    { id: 't', instanceId: 't_0', title: 'Top', bonus: 3 },
  ];
  G.combat.revealedDeckCards = [{ ownerId: '1', card: G.players[1].deck[1], from: 'top' }];

  runEvent(G, c, 'MOVE_CARDS', {
    params: { playerId: '1', from: 'deck', targets: 't_0', count: 1, to: 'deck:top' },
    raw: true,
  });
  assert(G.players[1].deck[1].instanceId === 't_0', 'MOVE_CARDS keeps card on top');
  assert(!G.combat.revealedDeckCards?.length, 'MOVE_CARDS clears revealed display');

  runEvent(G, c, 'MOVE_CARDS', {
    params: { playerId: '1', from: 'deck', targets: 'b_0', count: 1, to: 'deck:top' },
    raw: true,
  });
  assert(G.players[1].deck[1].instanceId === 'b_0', 'MOVE_CARDS moves bottom card to top');
}

{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.players[0].hand = [{ id: 'h1', instanceId: 'h1_0', title: 'Hand', type: 'attack' }];

  runEvent(G, c, 'MOVE_CARDS', {
    params: { playerId: '0', from: 'hand', targets: 'h1_0', count: 1, to: 'discard' },
    raw: true,
  });
  assert(G.players[0].hand.length === 0, 'MOVE_CARDS removes from hand');
  assert(G.players[0].discard[0].instanceId === 'h1_0', 'MOVE_CARDS hand to discard');
}

{
  const G = makeG();
  const c = ctx('ATTACK', '0');
  G.players[0].deck = [
    { id: 'b', instanceId: 'b_0', title: 'Bottom', bonus: 0 },
    { id: 't', instanceId: 't_0', title: 'Top', bonus: 0 },
  ];

  runEvent(G, c, 'MOVE_CARDS', {
    params: { side: 'self', count: 2, from: 'deck', fromPosition: 'bottom', to: 'revealed' },
    return: '$bottomTwo',
  });
  assert(G.vars.$bottomTwo?.join(',') === 'b_0,t_0', 'MOVE_CARDS reveal bottom slice order');
}

console.log('rules layer: ok');
