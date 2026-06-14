import { runFact } from './facts.js';

export const getActivePlayer = (G, ctx) => G.players[ctx.currentPlayer];
export const resolvePlayer = (G, ctx, params = {}) => {
  if (params.playerId != null) {
    const id = String(params.playerId);
    return G.players[id] ?? G.players.find(p => String(p.id) === id) ?? null;
  }
  return getActivePlayer(G, ctx);
};

export const pushLog = (G, msg, type = 'info') => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  G.log.push({ msg, type, time });
};

export const applyTemplate = (message, template = {}) => {
  let msg = message || '';
  for (const [placeholder, value] of Object.entries(template)) {
    if (value != null) msg = msg.split(placeholder).join(String(value));
  }
  return msg;
};

export const getAliveHeroPlayers = G =>
  G.players.filter(p => p.fighters.some(f => f.type === 'hero' && f.hp > 0));

export const getAliveHeroPlayerIds = G => getAliveHeroPlayers(G).map(p => p.id);

export const findFighter = (G, fighterId) => {
  if (fighterId == null) return null;
  for (const p of G.players) {
    const f = p.fighters.find(x => String(x.id) === String(fighterId));
    if (f) return f;
  }
  return null;
};

export const getFighterPositions = fighter => {
  if (fighter?.position == null) return [];
  return (Array.isArray(fighter.position) ? fighter.position : [fighter.position])
    .map(String)
    .filter(Boolean);
};

export const getOwnPickedId = G => {
  const sel = G.targetSelection;
  if (sel?.kind !== 'own' || !sel.picked?.length) return null;
  return String(sel.picked[0]);
};

export const isOwnPicked = (G, fighterId) => getOwnPickedId(G) === String(fighterId);

export const applyOwnFighterPhaseCells = ({ G, ctx }) => {
  const pickedId = getOwnPickedId(G);
  if (!pickedId) {
    G.highlightCells = [];
    return;
  }
  if (ctx.phase === 'UNIT_PLACEMENT') {
    G.highlightCells = runFact('PLACEMENT_CELLS', { fighterId: pickedId }, { G, ctx });
  } else if (ctx.phase === 'MOVEMENT') {
    G.highlightCells = runFact('MOVEMENT_CELLS', { fighterId: pickedId }, { G, ctx });
  }
};
