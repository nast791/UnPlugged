import { assert } from './fixtures.mjs';
import { getPlayerSidebarRole } from '../shared/utils/rules/helpers.js';
import { PLAYER_SIDEBAR_ROLES, PLAYER_TYPES } from '../shared/constants/playerTypes.js';
import { runEvent } from '../shared/utils/rules/events.js';
import { runFact } from '../shared/utils/rules/facts.js';

const players = [
  { id: '0', type: PLAYER_TYPES.HUMAN.id, teamId: 0 },
  { id: '1', type: PLAYER_TYPES.AI.id, teamId: 1 },
];

assert(
  getPlayerSidebarRole(players[0], '0', players) === PLAYER_SIDEBAR_ROLES.SELF,
  'self label',
);
assert(
  getPlayerSidebarRole(players[1], '0', players) === PLAYER_SIDEBAR_ROLES.AI,
  'ai label',
);

const teamPlayers = [
  { id: '0', type: PLAYER_TYPES.HUMAN.id, teamId: 0 },
  { id: '1', type: PLAYER_TYPES.HUMAN.id, teamId: 0 },
  { id: '2', type: PLAYER_TYPES.HUMAN.id, teamId: 1 },
  { id: '3', type: PLAYER_TYPES.AI.id, teamId: 1 },
];

assert(
  getPlayerSidebarRole(teamPlayers[1], '0', teamPlayers) === PLAYER_SIDEBAR_ROLES.TEAMMATE,
  'teammate label',
);
assert(
  getPlayerSidebarRole(teamPlayers[2], '0', teamPlayers) === PLAYER_SIDEBAR_ROLES.HUMAN,
  'opponent human label',
);
assert(
  getPlayerSidebarRole(teamPlayers[3], '0', teamPlayers) === PLAYER_SIDEBAR_ROLES.AI,
  'opponent ai label',
);

const G = { players: [{ id: '0' }, { id: '1' }, { id: '2' }, { id: '3' }] };
runEvent(G, { currentPlayer: '0' }, 'ASSIGN_TEAMS', { params: { playerCount: 4 }, raw: true });
assert(G.players[0].teamId === 0 && G.players[1].teamId === 0, 'ASSIGN_TEAMS pair 0');
assert(G.players[2].teamId === 1 && G.players[3].teamId === 1, 'ASSIGN_TEAMS pair 1');

assert(
  runFact('IS_TEAMMATE', { playerId: '1', viewerId: '0' }, { G: { players: teamPlayers }, ctx: { currentPlayer: '0' } }),
  'IS_TEAMMATE fact',
);
assert(
  runFact('PLAYER_SIDEBAR_ROLE', { playerId: '1', viewerId: '0' }, { G: { players: teamPlayers }, ctx: { currentPlayer: '0' } }) ===
    PLAYER_SIDEBAR_ROLES.TEAMMATE,
  'PLAYER_SIDEBAR_ROLE fact',
);

console.log('playerLabels: ok');
