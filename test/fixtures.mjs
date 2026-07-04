import { assignTeamId } from '../shared/utils/rules/helpers.js';

export const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

export const makeMap = () => ({
  circles: [
    { id: 1, position: 1, zones: ['red'], neighbors: [2, 3] },
    { id: 2, position: 2, zones: ['red'], neighbors: [1, 4] },
    { id: 3, position: 3, zones: ['red'], neighbors: [1] },
    { id: 4, position: 4, zones: ['red'], neighbors: [2] },
  ],
});

export const withCurrentHp = fighter => ({
  ...fighter,
  currentHp: fighter.currentHp ?? fighter.hp ?? 0,
});

export const makePlayer = (id, overrides = {}) => {
  const suffix = String(Number(id) + 1);
  const playerCount = overrides.playerCount ?? 2;
  return {
    id,
    name: `P${id}`,
    type: 'human',
    teamId: assignTeamId(Number(id), playerCount),
    hand: [],
    discard: [],
    deck: [],
    visibility: { deck: false, hand: false, discard: false },
    fighters: [
      withCurrentHp({
        id: `hero${suffix}`,
        name: 'Hero',
        type: 'hero',
        role: 'any',
        move: 2,
        position: null,
        startPosition: null,
        hp: 10,
        currentHp: 10,
        bonusMovement: 0,
        canPassThroughEnemies: false,
        attackRange: 1,
        rangeType: 'melee',
      }),
      withCurrentHp({
        id: `asst${suffix}`,
        name: 'Assistant',
        type: 'assistant',
        role: 'any',
        move: 1,
        position: null,
        startPosition: null,
        hp: 5,
        currentHp: 5,
        bonusMovement: 0,
      }),
    ],
    ...overrides,
  };
};

export const makeG = (overrides = {}) => ({
  map: makeMap(),
  players: [makePlayer('0'), makePlayer('1')],
  bonus: 0,
  bonusCards: [],
  log: [],
  privateLog: [],
  logSeq: 0,
  pendingActions: [],
  highlightCells: [],
  highlightFighters: [],
  recentDamage: [],
  targetSelection: null,
  vars: {},
  outputVar: null,
  pipeline: null,
  zoneVisibilityGrants: [],
  cardZoneUI: {},
  cardZoneCounts: {},
  handCardUI: { selectableIds: null, disabledIds: [] },
  turn: 0,
  selectedAction: null,
  ...overrides,
});

export const makeCtx = (phase = 'UNIT_PLACEMENT', currentPlayer = '0') => ({
  phase,
  currentPlayer,
  numPlayers: 2,
});

export const makeSetupData = () => ({
  id: 'test-game',
  players: [makePlayer('0'), makePlayer('1', { type: 'ai', name: 'AI' })],
  map: makeMap(),
});

export const mockEvents = () => {
  const events = {
    nextPhase: null,
    endPhaseCalled: false,
    endTurnCalled: false,
  };
  events.endPhase = () => {
    events.endPhaseCalled = true;
  };
  events.endTurn = () => {
    events.endTurnCalled = true;
  };
  events.setPhase = phase => {
    events.nextPhase = phase;
  };
  return events;
};

export const playCtx = (G, ctx, events = mockEvents()) => ({ G, ctx, events });
