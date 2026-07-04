const formatLogTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const nextLogSeq = G => {
  G.logSeq = (G.logSeq ?? 0) + 1;
  return G.logSeq;
};

export const makeLogEntry = (G, msg, type = 'info', extra = {}) => ({
  id: nextLogSeq(G),
  msg,
  type,
  time: formatLogTime(),
  ...extra,
});

export const pushPublicLog = (G, msg, type = 'info') => {
  if (!G.log) G.log = [];
  G.log.push(makeLogEntry(G, msg, type));
};

export const pushPrivateLog = (G, playerId, msg, type = 'info') => {
  if (playerId == null) return;
  if (!G.privateLog) G.privateLog = [];
  G.privateLog.push(makeLogEntry(G, msg, type, { playerId: String(playerId) }));
};

export const pushLog = (G, msg, options = 'info') => {
  let type = 'info';
  let audience = 'public';
  let playerId;
  let ctx;

  if (typeof options === 'string') {
    type = options;
  } else if (options && typeof options === 'object') {
    type = options.type ?? 'info';
    audience = options.audience ?? 'public';
    playerId = options.playerId;
    ctx = options.ctx;
  }

  if (audience === 'private') {
    pushPrivateLog(G, playerId ?? ctx?.currentPlayer, msg, type);
    return;
  }

  pushPublicLog(G, msg, type);
};

export const mergeLogsForPlayer = (G, playerID) => {
  const pub = G.log ?? [];
  const priv = (G.privateLog ?? []).filter(e => String(e.playerId) === String(playerID));
  return [...pub, ...priv].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
};

export const applyPlayerView = (G, ctx, playerID) => {
  if (playerID == null || !G) return G;

  const isActive = String(ctx.currentPlayer) === String(playerID);

  return {
    ...G,
    privateLog: (G.privateLog ?? []).filter(e => String(e.playerId) === String(playerID)),
    pendingActions: isActive ? (G.pendingActions ?? []) : [],
    targetSelection: isActive ? G.targetSelection : null,
    outputVar: isActive ? G.outputVar : null,
    pipeline: isActive ? G.pipeline : null,
    vars: isActive ? G.vars : {},
    highlightCells: isActive ? G.highlightCells : [],
    highlightFighters: isActive ? G.highlightFighters : [],
    selectedUnitId: isActive ? G.selectedUnitId : null,
    selectedCardId: isActive ? G.selectedCardId : null,
  };
};
