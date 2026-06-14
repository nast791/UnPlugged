import { runFact } from './facts.js';
import { runEvent } from './events.js';
import { runMove } from './moves.js';
import { applyOwnFighterPhaseCells } from './helpers.js';
import { finishPipeline } from './pipeline.js';
import { assert, makeG, makeCtx } from '../test/fixtures.mjs';

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

// --- SET_MOVEMENT_BONUS / clear ---
{
  const G = makeG();
  const c = ctx('MOVEMENT', '0');
  runEvent(G, c, 'SET_MOVEMENT_BONUS', { params: { value: 2, cardId: 'c1' }, raw: true });
  assert(G.bonus === 2 && G.bonusCards.length === 1, 'SET_MOVEMENT_BONUS');
  runEvent(G, c, 'SET_MOVEMENT_BONUS', { params: { clear: true }, raw: true });
  assert(G.bonus === 0 && G.bonusCards.length === 0, 'SET_MOVEMENT_BONUS clear');
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

// --- HAS_CARD_IN_HAND ---
{
  const G = makeG();
  G.players[0].hand = [{ id: 'c1', type: 'effect', role: 'any' }];
  const c = ctx('ACTION_SELECTION', '0');
  assert(runFact('HAS_CARD_IN_HAND', { types: ['effect'] }, { G, ctx: c }), 'HAS_CARD_IN_HAND effect');
  assert(!runFact('HAS_CARD_IN_HAND', { types: ['attack'] }, { G, ctx: c }), 'HAS_CARD_IN_HAND no attack');
}

// --- pipeline state cleanup (no vars/target leak) ---
{
  const G = makeG({
    vars: { $x: 1 },
    outputVar: '$x',
    targetSelection: { kind: 'effect', returnKey: '$x', candidates: ['a'], selection: 1, picked: [] },
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

console.log('rules layer: ok');
