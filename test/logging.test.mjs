import { game } from '../shared/utils/game.js';
import {
  applyPlayerView,
  mergeLogsForPlayer,
  pushLog,
  pushPrivateLog,
  pushPublicLog,
} from '../shared/utils/rules/logging.js';
import { runEvent } from '../shared/utils/rules/events.js';
import { assert, makeG, makeCtx } from './fixtures.mjs';

// --- pushLog routes to public / private ---
{
  const G = makeG();
  pushPublicLog(G, 'Tesla нанёс урон', 'danger');
  pushPrivateLog(G, '0', 'Выберите цель');
  assert(G.log.length === 1, 'public log entry');
  assert(G.privateLog.length === 1, 'private log entry');
  assert(G.log[0].id === 1 && G.privateLog[0].id === 2, 'log seq increments');
}

// --- mergeLogsForPlayer interleaves by id ---
{
  const G = makeG();
  pushPublicLog(G, 'public 1');
  pushPrivateLog(G, '0', 'private 1');
  pushPublicLog(G, 'public 2');
  pushPrivateLog(G, '1', 'opponent private');
  const merged = mergeLogsForPlayer(G, '0');
  assert(merged.length === 3, 'player 0 sees public + own private');
  assert(merged.map(e => e.msg).join('|') === 'public 1|private 1|public 2', 'merged order');
}

// --- applyPlayerView hides opponent private state ---
{
  const G = makeG({
    privateLog: [{ id: 1, msg: 'p0 secret', playerId: '0', type: 'info', time: '00:00' }],
    pendingActions: [{ id: 'a', text: 'Да', action: 'setVariables' }],
    targetSelection: { kind: 'target', candidates: ['e1'] },
    pipeline: { actions: [] },
    vars: { $answer: 'skip' },
    highlightCells: ['2'],
    highlightFighters: ['e1'],
  });
  const ctx = makeCtx('TURN_START', '0');

  const view0 = applyPlayerView(G, ctx, '0');
  const view1 = applyPlayerView(G, ctx, '1');

  assert(view0.privateLog.length === 1, 'active player sees own private log');
  assert(view1.privateLog.length === 0, 'opponent does not see private log');
  assert(view0.pendingActions.length === 1, 'active player sees pending actions');
  assert(view1.pendingActions.length === 0, 'opponent does not see pending actions');
  assert(view1.targetSelection === null, 'opponent does not see target selection');
  assert(view1.pipeline === null, 'opponent does not see pipeline');
  assert(Object.keys(view1.vars).length === 0, 'opponent does not see vars');
}

// --- PROMPT writes only to privateLog ---
{
  const G = makeG();
  const ctx = makeCtx('TURN_START', '0');
  runEvent(G, ctx, 'PROMPT', {
    params: {
      message: 'Передвинуть цель?',
      return: '$answer',
      answers: [{ id: 'yes', text: 'Да', value: 'yes' }],
    },
  });
  assert(G.log.length === 0, 'PROMPT not in public log');
  assert(G.privateLog.length === 1, 'PROMPT in private log');
  assert(G.privateLog[0].playerId === '0', 'PROMPT assigned to current player');
}

// --- game definition exposes playerView ---
{
  assert(typeof game.playerView === 'function', 'game.playerView defined');
  const G = makeG();
  const filtered = game.playerView({ G, ctx: makeCtx('ACTION_SELECTION', '0'), playerID: '1' });
  assert(filtered.pendingActions.length === 0, 'playerView clears pending for inactive');
}

console.log('logging: ok');
