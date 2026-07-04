import { CARD_PLAY_PHASES } from '../../constants/cardTypes.js';
export const getHandCardId = card => String(card.instanceId ?? card.id);

export const fighterMatchesRef = (fighter, ref) => {
  if (!fighter || ref == null) return false;
  const target = String(ref);
  if (target === 'any') return true;
  if (String(fighter.id) === target) return true;
  if (fighter.group && String(fighter.group) === target) return true;
  return false;
};

export const cardMatchesFighter = (card, fighter) => {
  const cardFighter = card.role ?? card.fighter ?? 'any';
  if (cardFighter === 'any') return true;
  return fighterMatchesRef(fighter, cardFighter);
};

export const cardMatchesPhase = (card, phase) => {
  if (!phase) return true;
  const allowed = CARD_PLAY_PHASES[card.type];
  if (!allowed) return true;
  return allowed.includes(phase);
};

export const findFighter = (G, fighterId) => {
  if (fighterId == null || !G?.players) return null;
  for (const p of G.players) {
    const f = p.fighters.find(x => String(x.id) === String(fighterId));
    if (f) return f;
  }
  return null;
};

export const getOwnPickedId = G => {
  const sel = G.targetSelection;
  if (sel?.kind !== 'own' || !sel.picked?.length) return null;
  return String(sel.picked[0]);
};

export const getActiveFighterId = (G, ctx) => {
  if (G.combat?.attackerId != null) return String(G.combat.attackerId);
  const picked = getOwnPickedId(G);
  if (picked) return picked;
  if (G.selectedUnitId != null) return String(G.selectedUnitId);
  return null;
};

/** Боец, от имени которого сыграна карта в текущем бою. */
export const getPlayedCardFighterId = (G, ctx) => {
  const card = getPlayedCard(G, ctx);
  if (!G.combat || !card) return getActiveFighterId(G, ctx);

  if (card.type === 'defense') return String(G.combat.defenderId ?? '');
  if (card.type === 'attack') return String(G.combat.attackerId ?? '');
  if (card.type === 'hybrid') {
    if (ctx?.phase === 'DEFENSE') return String(G.combat.defenderId ?? '');
    return String(G.combat.attackerId ?? '');
  }
  return getActiveFighterId(G, ctx);
};

export const getPlayedCard = (G, ctx) => {
  if (G.combat?.responseCard) return G.combat.responseCard;
  if (G.combat?.card) return G.combat.card;
  const cardId = G.combat?.cardId;
  if (cardId == null) return null;
  const player = getActivePlayer(G, ctx);
  if (!player) return null;
  const ref = String(cardId);
  const pools = [...(player.discard ?? []), ...(player.hand ?? [])];
  return pools.find(c => getHandCardId(c) === ref || String(c.id) === ref) ?? null;
};

export const findHandCard = (player, cardRef) => {
  if (!player?.hand || cardRef == null) return null;
  const ref = String(cardRef);
  return (
    player.hand.find(c => getHandCardId(c) === ref || String(c.id) === ref) ?? null
  );
};

export const filterHandCards = (player, params = {}, context = {}) => {
  if (!player?.hand?.length) return [];

  const types = [].concat(params.types ?? params.type ?? []).filter(Boolean);
  const minBonus = params.minBonus != null ? Number(params.minBonus) : null;
  const excludeIds = new Set([].concat(params.excludeIds ?? params.exclude ?? []).map(String));

  let fighterId = params.fighterId ?? params.fighter;
  if (params.forActiveFighter && !fighterId) {
    const { G, ctx } = context;
    fighterId = G && ctx ? getActiveFighterId(G, ctx) : null;
    if (!fighterId) return [];
  }

  const phase = params.phase;

  return player.hand.filter(card => {
    const cardKey = getHandCardId(card);
    if (excludeIds.has(cardKey) || excludeIds.has(String(card.id))) return false;
    if (types.length && !types.includes(card.type)) return false;
    if (minBonus != null && (Number(card.bonus) || 0) < minBonus) return false;
    if (phase && !cardMatchesPhase(card, phase)) return false;

    if (fighterId) {
      const fighter =
        player.fighters.find(f => String(f.id) === String(fighterId)) ??
        findFighter(context.G, fighterId);
      if (!fighter || !canFighterPlayCard(card, fighter)) return false;
    }

    return true;
  });
};

export const getActivePlayer = (G, ctx) => G.players[ctx.currentPlayer];

export const getOpponentPlayer = (G, ctx) => {
  const opponents = getOpponentPlayers(G, ctx);
  return opponents[0] ?? null;
};

export const getOpponentPlayers = (G, ctx, params = {}) => {
  const active = getActivePlayer(G, ctx);
  if (!active || !G?.players) return [];

  let opponents = G.players.filter(p => String(p.id) !== String(active.id));
  if (params.aliveHeroOnly) {
    opponents = opponents.filter(p =>
      p.fighters?.some(f => f.type === 'hero' && (f.currentHp ?? 0) > 0),
    );
  }
  return opponents;
};

/** Текстовые эффекты карты подавлены для указанных игроков. */
export const isCardTextSuppressed = (G, ctx, cardOwnerId) => {
  if (cardOwnerId == null) return false;
  const ids = G.combat?.ignoreCardTextPlayerIds;
  if (Array.isArray(ids) && ids.length) {
    return ids.map(String).includes(String(cardOwnerId));
  }
  if (G.combat?.ignoreOpponentCardText) {
    const activeId = getActivePlayer(G, ctx)?.id;
    return activeId != null && String(cardOwnerId) !== String(activeId);
  }
  return false;
};

export const isOpponentCardEffectSuppressed = isCardTextSuppressed;

export const resolvePlayer = (G, ctx, params = {}) => {
  if (params.playerId != null) {
    const id = String(params.playerId);
    return G.players[id] ?? G.players.find(p => String(p.id) === id) ?? null;
  }
  return getActivePlayer(G, ctx);
};

/** self | opponent | playerId — для колоды/руки любого игрока. */
export const resolvePlayerTarget = (G, ctx, params = {}) => {
  if (params.playerId != null) {
    return resolvePlayer(G, ctx, params);
  }
  const side = params.side ?? params.target;
  if (side == null || side === 'self' || side === 'own') {
    return getActivePlayer(G, ctx);
  }
  if (side === 'opponent') {
    return getOpponentPlayer(G, ctx);
  }
  const byId = G.players?.find(p => String(p.id) === String(side));
  if (byId) return byId;
  return getActivePlayer(G, ctx);
};

export const findDeckCardIndex = (deck, cardRef) => {
  if (!deck?.length || cardRef == null) return -1;
  const ref = String(cardRef);
  return deck.findIndex(c => getHandCardId(c) === ref || String(c.id) === ref);
};

export const getRevealedDeckEntries = (G, ownerId = null) => {
  const entries = G.combat?.revealedDeckCards ?? [];
  if (ownerId == null) return entries;
  return entries.filter(e => String(e.ownerId) === String(ownerId));
};

export const findRevealedDeckCard = (G, cardRef, ownerId = null) => {
  if (cardRef == null) return null;
  const ref = String(cardRef);
  for (const entry of getRevealedDeckEntries(G, ownerId)) {
    const card = entry.card;
    if (getHandCardId(card) === ref || String(card.id) === ref) {
      return { entry, card };
    }
  }
  return null;
};

/** Карта в руке, колоде или среди раскрытых с колоды. */
export const findPlayerCard = (player, G, cardRef, sources = ['hand', 'deck', 'revealed']) => {
  if (!player || cardRef == null) return null;
  const ref = String(cardRef);
  const list = Array.isArray(sources) ? sources : [sources];

  if (list.includes('hand')) {
    const card = findHandCard(player, ref);
    if (card) return { card, source: 'hand' };
  }
  if (list.includes('deck') && player.deck?.length) {
    const idx = findDeckCardIndex(player.deck, ref);
    if (idx !== -1) return { card: player.deck[idx], source: 'deck' };
  }
  if (list.includes('revealed') && G) {
    const found = findRevealedDeckCard(G, ref, player.id);
    if (found) return { card: found.card, source: 'revealed' };
  }
  return null;
};

/** top = верх колоды (как DRAW_CARDS.pop), bottom = низ. */
export const peekDeckCards = (deck, count = 1, from = 'top') => {
  if (!deck?.length || count <= 0) return [];
  const n = Math.min(Number(count) || 1, deck.length);
  if (from === 'bottom') return deck.slice(0, n);
  return deck.slice(-n).reverse();
};

export const parseCardDestination = to => {
  const raw = String(to ?? 'discard');
  if (raw === 'hand') return { zone: 'hand' };
  if (raw === 'discard') return { zone: 'discard' };
  if (raw === 'revealed' || raw === 'display') return { zone: 'revealed' };
  if (raw === 'deck' || raw === 'deck:top' || raw === 'top') {
    return { zone: 'deck', position: 'top' };
  }
  if (raw === 'deck:bottom' || raw === 'bottom') {
    return { zone: 'deck', position: 'bottom' };
  }
  return { zone: 'discard' };
};

export const resolvePickMode = params => {
  if (params.pick === 'random' || params.random) return 'random';
  if (params.pick === 'auto') return 'auto';
  return 'user';
};

export const pickRandomItems = (items, count = 1) => {
  const pool = [...items];
  const picked = [];
  const n = Math.min(Number(count) || 1, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
};

export const addRevealedDeckCards = (G, player, cards, from = 'top') => {
  if (!cards.length) return;
  if (!G.combat) G.combat = {};
  const ownerId = String(player.id);
  G.combat.revealedDeckCards = [
    ...(G.combat.revealedDeckCards ?? []),
    ...cards.map(card => ({ ownerId, card, from })),
  ];
};

export const resolveCardZoneLabel = dest => {
  if (dest.zone === 'discard') return 'в сброс';
  if (dest.zone === 'hand') return 'в руку';
  if (dest.zone === 'revealed') return 'на показ';
  if (dest.position === 'bottom') return 'в низ колоды';
  return 'на верх колоды';
};

export const resolveRefList = (params, vars = {}, listKeys = ['targets', 'target']) => {
  let refs;
  for (const key of listKeys) {
    if (params[key] != null) {
      refs = params[key];
      break;
    }
  }

  if (typeof refs === 'string' && refs.startsWith('$')) refs = vars[refs];

  return (Array.isArray(refs) ? refs : refs != null ? [refs] : []).map(String).filter(Boolean);
};

export const resolveCardRefs = (params, vars = {}) =>
  resolveRefList(params, vars, ['targets', 'target', 'cardId', 'cardIds']);

export const clearRevealedDeckCards = (G, cards) => {
  if (!G.combat?.revealedDeckCards?.length || !cards?.length) return;
  const drop = new Set(cards.flatMap(c => [getHandCardId(c), String(c.id)]));
  G.combat.revealedDeckCards = G.combat.revealedDeckCards.filter(
    e => !drop.has(getHandCardId(e.card)) && !drop.has(String(e.card.id)),
  );
};

export const pullPlayerCard = (player, G, ref, from) => {
  const zones = from === 'auto' ? ['hand', 'deck', 'revealed'] : [from];
  for (const zone of zones) {
    if (zone === 'hand') {
      const card = findHandCard(player, ref);
      if (!card) continue;
      const idx = player.hand.indexOf(card);
      if (idx !== -1) return player.hand.splice(idx, 1)[0];
    }
    if (zone === 'deck') {
      const idx = findDeckCardIndex(player.deck, ref);
      if (idx !== -1) return player.deck.splice(idx, 1)[0];
    }
    if (zone === 'revealed') {
      const found = findRevealedDeckCard(G, ref, player.id);
      if (!found) continue;
      const idx = findDeckCardIndex(player.deck, ref);
      if (idx !== -1) return player.deck.splice(idx, 1)[0];
      return found.card;
    }
    if (zone === 'discard') {
      const idx = player.discard?.findIndex(
        c => getHandCardId(c) === ref || String(c.id) === ref,
      );
      if (idx != null && idx !== -1) return player.discard.splice(idx, 1)[0];
    }
  }
  return null;
};

export const collectMoveCards = (player, G, params) => {
  const from = params.from ?? params.source ?? 'hand';
  const refs = resolveCardRefs(params, G.vars);
  const limit = params.count != null ? Number(params.count) : null;

  if (refs.length) {
    const cards = [];
    refs.forEach(ref => {
      const card = pullPlayerCard(player, G, ref, from);
      if (card) cards.push(card);
    });
    return limit != null && limit > 0 ? cards.slice(0, limit) : cards;
  }

  if (from === 'reversed') {
    const cards = player.hand?.filter(c => c.isReversed) ?? [];
    cards.forEach(card => {
      const idx = player.hand.indexOf(card);
      if (idx !== -1) player.hand.splice(idx, 1);
    });
    return limit != null && limit > 0 ? cards.slice(0, limit) : cards;
  }

  if (from === 'selected') {
    const cards = player.hand?.filter(c => c.isSelected) ?? [];
    cards.forEach(card => {
      const idx = player.hand.indexOf(card);
      if (idx !== -1) player.hand.splice(idx, 1);
    });
    return limit != null && limit > 0 ? cards.slice(0, limit) : cards;
  }

  if (from === 'deck') {
    const fromPos = params.fromPosition ?? params.position ?? 'top';
    const n = limit ?? 1;
    const picked = peekDeckCards(player.deck, n, fromPos);
    const cards = [];
    picked.forEach(card => {
      const idx = findDeckCardIndex(player.deck, getHandCardId(card));
      if (idx !== -1) cards.push(...player.deck.splice(idx, 1));
    });
    return cards;
  }

  return [];
};

export const placePlayerCards = (player, cards, dest) => {
  if (!cards.length) return;
  if (dest.zone === 'discard') {
    if (!player.discard) player.discard = [];
    cards.forEach(card => {
      card.isReversed = false;
      card.isSelected = false;
      player.discard.push(card);
    });
    return;
  }
  if (dest.zone === 'hand') {
    if (!player.hand) player.hand = [];
    cards.forEach(card => {
      card.isReversed = false;
      card.isSelected = false;
      player.hand.push(card);
    });
    return;
  }
  if (dest.zone === 'deck') {
    if (!player.deck) player.deck = [];
    if (dest.position === 'bottom') player.deck.unshift(...cards);
    else player.deck.push(...cards);
  }
};

export { mergeLogsForPlayer, pushLog, pushPrivateLog, pushPublicLog } from './logging.js';

export const applyTemplate = (message, template = {}) => {
  let msg = message || '';
  for (const [placeholder, value] of Object.entries(template)) {
    if (value != null) msg = msg.split(placeholder).join(String(value));
  }
  return msg;
};

export const getAliveHeroPlayers = G =>
  G.players.filter(p => p.fighters.some(f => f.type === 'hero' && (f.currentHp ?? 0) > 0));

export const getFighterPositions = fighter => {
  if (fighter?.position == null) return [];
  return (Array.isArray(fighter.position) ? fighter.position : [fighter.position])
    .map(String)
    .filter(Boolean);
};

export const isFighterPlayable = fighter =>
  !!fighter && (fighter.currentHp ?? 0) > 0 && getFighterPositions(fighter).length > 0;

export const canFighterPlayCard = (card, fighter) =>
  isFighterPlayable(fighter) && cardMatchesFighter(card, fighter);

export const getMapCircle = (G, id) =>
  G.map?.circles?.find(n => String(n.id) === String(id));

export const getCircleNeighbors = circle => circle?.neighbors || circle?.connections || [];

export const getFighterOwner = (G, fighterId) => {
  const fighter = findFighter(G, fighterId);
  if (!fighter) return null;
  const owner = G.players.find(p => p.fighters.includes(fighter));
  return owner ? { fighter, owner } : null;
};

export const bfsReachable = (G, startPos, maxSteps) => {
  const start = String(startPos ?? '');
  if (!start || !G.map?.circles) return [];

  const distances = {};
  G.map.circles.forEach(n => {
    distances[String(n.id)] = Infinity;
  });
  distances[start] = 0;

  const queue = [{ id: start, dist: 0 }];
  const reachable = new Set();

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const { id, dist } = queue.shift();
    if (dist > distances[id]) continue;

    reachable.add(id);
    if (dist >= maxSteps) continue;

    const node = getMapCircle(G, id);
    if (!node) continue;

    for (const neighborId of getCircleNeighbors(node)) {
      const nId = String(neighborId);
      const nextDist = dist + 1;
      if (nextDist < distances[nId]) {
        distances[nId] = nextDist;
        queue.push({ id: nId, dist: nextDist });
      }
    }
  }

  return Array.from(reachable);
};

export const bfsDistance = (G, fromId, toId) => {
  if (!G.map?.circles || fromId == null || toId == null) return Infinity;

  const start = String(fromId);
  const goal = String(toId);
  if (start === goal) return 0;

  const distances = {};
  G.map.circles.forEach(n => {
    distances[String(n.id)] = Infinity;
  });
  distances[start] = 0;

  const queue = [start];
  while (queue.length) {
    const id = queue.shift();
    const node = getMapCircle(G, id);
    if (!node) continue;

    for (const neighborId of getCircleNeighbors(node)) {
      const nId = String(neighborId);
      if (distances[nId] !== Infinity) continue;
      distances[nId] = distances[id] + 1;
      if (nId === goal) return distances[nId];
      queue.push(nId);
    }
  }

  return Infinity;
};

export const getSourceZoneCells = (G, sourceId) => {
  const fighter = findFighter(G, sourceId);
  if (!fighter || !G.map?.circles) return [];
  const positions = getFighterPositions(fighter);
  if (!positions.length) return [];

  const circles = new Set();
  positions.forEach(pos => {
    const node = getMapCircle(G, pos);
    if (!node) return;
    const sourceZones = node.zones || [];
    G.map.circles.forEach(c => {
      if (c.zones?.some(z => sourceZones.includes(z))) {
        circles.add(String(c.id));
      }
    });
  });
  return Array.from(circles);
};

export const getPlacementCells = (G, ctx, fighterId) => {
  const player = getActivePlayer(G, ctx);
  const fighter = player?.fighters?.find(f => String(f.id) === String(fighterId));
  if (!fighter) return { hero: [], assistant: [] };

  const heroStartNode = G.map.circles.find(i => i.position === Number(ctx.currentPlayer) + 1);
  if (!heroStartNode) return { hero: [], assistant: [] };

  const zoneColors = heroStartNode.zones || [];
  const assistantsNodes = G.map.circles
    .filter(i => {
      const hasZone = i.zones.some(color => zoneColors.includes(color));
      const isNotHeroNode = i.id !== heroStartNode.id;
      const isOccupied = G.players.some(p =>
        p.fighters.some(f => f.position === i.id && String(f.id) !== String(fighterId)),
      );
      return hasZone && isNotHeroNode && !isOccupied;
    })
    .map(i => i.id);

  return { hero: [heroStartNode.id], assistant: assistantsNodes };
};

export const getMovementCells = (G, fighter, ownerPlayer, params = {}) => {
  const fromCurrent = !!params.fromCurrent;
  const startPos = fromCurrent
    ? String(getFighterPositions(fighter)[0] ?? '')
    : String(fighter.startPosition ?? '');
  if (!startPos) return [];

  const totalRange =
    params.maxSteps != null
      ? Number(params.maxSteps) || 0
      : (Number(fighter.move) || 0) +
        (Number(fighter.bonusMovement) || 0) +
        (Number(G.bonus) || 0);

  const distances = {};
  G.map.circles.forEach(n => {
    distances[String(n.id)] = Infinity;
  });
  distances[startPos] = 0;

  const queue = [{ id: startPos, dist: 0 }];
  const available = new Set();

  const enemyPositions = G.players
    .filter(p => String(p.id) !== String(ownerPlayer.id))
    .flatMap(p => p.fighters.filter(f => (f.currentHp ?? 0) > 0).map(f => String(f.position)));

  const allOccupied = G.players
    .flatMap(p => p.fighters.filter(f => (f.currentHp ?? 0) > 0).map(f => String(f.position)))
    .filter(pos => pos !== startPos);

  const canPassThrough = params.passThroughEnemies ?? fighter.canPassThroughEnemies;

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const { id, dist } = queue.shift();

    if (dist > distances[id]) continue;

    if (dist > 0 && !allOccupied.includes(id)) {
      available.add(id);
    }

    if (dist >= totalRange) continue;

    const node = getMapCircle(G, id);
    if (!node) continue;

    for (const neighborId of getCircleNeighbors(node)) {
      const nId = String(neighborId);
      const isEnemy = enemyPositions.includes(nId);

      if (!isEnemy || canPassThrough) {
        const nextDist = dist + 1;
        if (nextDist < distances[nId]) {
          distances[nId] = nextDist;
          queue.push({ id: nId, dist: nextDist });
        }
      }
    }
  }

  const result = Array.from(available);
  if (!result.includes(startPos)) {
    result.push(startPos);
  }
  return result;
};

export const filterOwnFighters = (player, params) => {
  const group = params.group ?? params.fighter ?? params.fighterId;
  const wantDead = !!params.dead;

  return player.fighters.filter(f => {
    const alive = (f.currentHp ?? 0) > 0;
    if (alive === wantDead) return false;
    if (!wantDead && params.onBoard !== false && !getFighterPositions(f).length) return false;
    if (group != null && !fighterMatchesRef(f, group)) return false;
    if (params.type && f.type !== params.type) return false;
    return true;
  });
};

export const getCardPlayableFighters = (card, G, ctx) => {
  const player = getActivePlayer(G, ctx);
  if (!player || !card) return [];
  return filterOwnFighters(player, { onBoard: true }).filter(f => cardMatchesFighter(card, f));
};

/** Карту может активировать объявленный боец или любой подходящий свой боец на поле (для «any»). */
export const cardMatchesActiveFighter = (card, G, ctx) => {
  if (!card) return false;
  const fighterId = getPlayedCardFighterId(G, ctx);
  if (fighterId) {
    const fighter = findFighter(G, fighterId);
    const owner = fighter ? getFighterOwner(G, fighter.id) : null;
    if (!owner || String(owner.owner.id) !== String(ctx.currentPlayer)) return false;
    return canFighterPlayCard(card, fighter);
  }
  return getCardPlayableFighters(card, G, ctx).length > 0;
};

export const filterFightersInRange = (G, ownerPlayer, reachable, params) => {
  const side = params.side ?? 'opponent';
  const kind = params.kind ?? 'fighter';

  return G.players.flatMap(p => {
    const isOwn = String(p.id) === String(ownerPlayer.id);
    if (side === 'opponent' && isOwn) return [];
    if (side === 'allied' && !isOwn) return [];

    return p.fighters
      .filter(f => {
        if ((f.currentHp ?? 0) <= 0) return false;
        if (!getFighterPositions(f).some(pos => reachable.has(pos))) return false;
        if (kind === 'hero' && f.type !== 'hero') return false;
        if (kind === 'assistant' && f.type !== 'assistant') return false;
        return true;
      })
      .map(f => f.id);
  });
};
