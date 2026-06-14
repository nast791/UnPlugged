import {
  findFighter,
  getActivePlayer,
  getAliveHeroPlayers,
  getFighterPositions,
  pushLog,
  resolvePlayer,
  applyTemplate,
} from './helpers.js';
import {
  resolveVariables,
  resolveVarValue,
  resolveOutput,
  normalizeOptions,
  resolveReturn,
  storeReturn,
} from './runtime.js';
import { runFact } from './facts.js';

export const EVENTS = {
  LOG: {
    run: (G, ctx, params) => {
      pushLog(G, applyTemplate(params.message, params.template), params.type || 'info');
      return null;
    },
  },
  HIGHLIGHT_TARGETS: {
    run: (G, ctx, params) => {
      const raw = params?.targets ?? params?.candidates ?? params?.cells;
      if (raw == null || (Array.isArray(raw) && raw.length === 0)) {
        G.highlightFighters = [];
        G.highlightCells = [];
        return null;
      }
      const ids = (Array.isArray(raw) ? raw : [raw]).map(String).filter(Boolean);
      G.highlightFighters = ids;
      G.highlightCells = ids
        .map(id => findFighter(G, id)?.position)
        .filter(Boolean)
        .map(String);
      return null;
    },
  },
  DRAW_CARDS: {
    run: (G, ctx, params) => {
      const player = resolvePlayer(G, ctx, params);
      const count = Number(params.count) || 1;
      if (!player) return null;

      for (let i = 0; i < count; i++) {
        if (player.deck.length > 0) {
          player.hand.push(player.deck.pop());
        } else {
          EVENTS.HANDLE_EXHAUSTION.run(G, ctx, { playerId: player.id });
          break;
        }
      }

      EVENTS.LOG.run(G, ctx, { message: `${player.name} берет карты: ${count}` });
      return null;
    },
  },
  DISCARD_CARDS: {
    run: (G, ctx, params) => {
      const player = resolvePlayer(G, ctx, params);
      if (!player) return 0;

      const toDiscard = player.hand.filter(c => c.isReversed);
      toDiscard.forEach(card => {
        const idx = player.hand.findIndex(c => c.id === card.id);
        if (idx !== -1) {
          const [removed] = player.hand.splice(idx, 1);
          removed.isReversed = false;
          player.discard.push(removed);
          EVENTS.LOG.run(G, ctx, {
            message: `${player.name} сбросил ${removed.name || 'карту'}`,
          });
        }
      });
      return toDiscard.length;
    },
  },
  RETURN_FROM_DISCARD: {
    run: (G, ctx, params) => {
      const player = resolvePlayer(G, ctx, params);
      if (!player) return null;

      const ids = Array.isArray(params.cardIds) ? params.cardIds : [params.cardIds];
      ids.forEach(id => {
        const idx = player.discard.findIndex(c => c.id === id);
        if (idx !== -1) {
          const [card] = player.discard.splice(idx, 1);
          card.isReversed = false;
          player.hand.push(card);
        }
      });
      EVENTS.LOG.run(G, ctx, {
        message: `Карты (${ids.length}) вернулись в руку ${player.name}`,
      });
      return null;
    },
  },
  HANDLE_EXHAUSTION: {
    run: (G, ctx, params) => {
      const player = resolvePlayer(G, ctx, params);
      if (!player) return null;

      EVENTS.LOG.run(G, ctx, {
        message: `Колода ${player.name} пуста! Эффект истощения.`,
        type: 'danger',
      });
      const heroIds = player.fighters
        .filter(f => f.type === 'hero' && f.hp > 0)
        .map(f => f.id);
      if (heroIds.length) {
        EVENTS.DAMAGE_FIGHTERS.run(G, ctx, { targets: heroIds, damage: 2 });
      }
      EVENTS.CHECK_GAME_OVER.run(G, ctx, {});
      return null;
    },
  },
  PROMPT: {
    return: '$prompt',
    run: (G, ctx, params) => {
      pushLog(G, applyTemplate(params.message, params.template));
      if (params.return == null) return null;
      G.pendingActions = (params.answers || []).map(a => ({
        id: a.id,
        text: a.text,
        action: 'setVariables',
        payload: { vars: [{ var: params.return, value: a.value }] },
      }));
      return params.return;
    },
  },
  SELECT_OWN_FIGHTER: {
    run: (G, ctx, params) => {
      const player = getActivePlayer(G, ctx);

      if (params.clear) {
        if (G.targetSelection?.kind === 'own') {
          G.targetSelection.picked = [];
        }
        G.highlightCells = [];
        return null;
      }

      if (params.fighterId == null) return null;

      const id = String(params.fighterId);
      const fighter = player.fighters.find(f => String(f.id) === id);
      if (!fighter || fighter.hp <= 0) return null;

      if (G.targetSelection?.kind !== 'own') {
        G.targetSelection = {
          kind: 'own',
          candidates: player.fighters.filter(f => f.hp > 0).map(f => String(f.id)),
          selection: 1,
          picked: [],
        };
      }

      const sel = G.targetSelection;
      if (!sel.candidates.map(String).includes(id)) return null;

      const picked = sel.picked.map(String);
      sel.picked = picked.includes(id) ? [] : [id];

      if (!sel.picked.length) {
        G.highlightCells = [];
      }

      return null;
    },
  },
  SELECT_EFFECT_TARGETS: {
    return: '$targets',
    run: (G, ctx, params) => {
      if (G.targetSelection?.kind === 'own') {
        G.targetSelection = null;
        G.highlightCells = [];
      }

      const raw = params.candidates;
      const candidates = (Array.isArray(raw) ? raw : raw != null ? [raw] : []).map(String);
      if (!candidates.length) return null;

      const selection = Number(params.selection) || 1;
      G.targetSelection = {
        kind: 'effect',
        returnKey: params.return,
        candidates,
        selection,
        picked: [],
      };
      storeReturn(G, params.return, []);

      if (candidates.length > 1) {
        EVENTS.HIGHLIGHT_TARGETS.run(G, ctx, { targets: candidates });
      }

      const message = (params.message || 'Выберите цель: ${count}').replace(
        /\$\{count\}/g,
        String(selection),
      );
      EVENTS.LOG.run(G, ctx, { message });

      return params.return;
    },
  },
  SET_VARIABLES: {
    run: (G, ctx, params) => {
      (params.vars || []).forEach(({ var: varName, value }) => {
        storeReturn(G, varName, resolveVarValue(value, G.vars));
      });
      return null;
    },
  },
  REMOVE_VARIABLES: {
    run: (G, ctx, params) => {
      const list = params.vars;
      if (!list?.length) {
        G.vars = {};
        return null;
      }
      list.forEach(key => delete G.vars[key]);
      return null;
    },
  },
  MOVE_FIGHTER: {
    run: (G, ctx, params) => {
      const cellId = String(params.cellId ?? params.targetId ?? '');
      const fighter = findFighter(G, params.fighterId);
      if (!fighter || !cellId) return false;

      if (params.validate !== false) {
        const cells = runFact('MOVEMENT_CELLS', { fighterId: params.fighterId }, { G, ctx });
        if (!cells.includes(cellId)) return false;
      }

      fighter.position = cellId;
      if (G.targetSelection?.kind === 'own') {
        G.targetSelection.picked = [];
      }
      G.highlightCells = [];
      EVENTS.LOG.run(G, ctx, {
        message: `${fighter.name} переместился на ${cellId} позицию`,
      });
      return true;
    },
  },
  SET_FIGHTER_POSITION: {
    run: (G, ctx, params) => {
      const fighter = findFighter(G, params.fighterId);
      const cellId = params.cellId ?? params.targetId;
      if (!fighter || cellId == null) return false;
      fighter.position = cellId;
      if (params.setStartPosition) {
        fighter.startPosition = cellId;
      }
      if (params.log !== false) {
        EVENTS.LOG.run(G, ctx, {
          message: params.message || `${fighter.name} выставлен на позицию ${cellId}`,
        });
      }
      return true;
    },
  },
  RESET_FIGHTERS_POSITIONS: {
    run: (G, ctx, params) => {
      const player =
        params.playerId != null
          ? G.players.find(p => String(p.id) === String(params.playerId))
          : getActivePlayer(G, ctx);
      if (!player) return false;

      const ids = params.fighterIds
        ? (Array.isArray(params.fighterIds) ? params.fighterIds : [params.fighterIds]).map(String)
        : null;

      player.fighters.forEach(f => {
        if (ids && !ids.includes(String(f.id))) return;
        f.position = f.startPosition;
      });

      if (params.log !== false) {
        EVENTS.LOG.run(G, ctx, {
          message: params.message || 'Бойцы вернулись на исходные позиции',
        });
      }
      return true;
    },
  },
  DISCARD_CARD: {
    run: (G, ctx, params) => {
      const player = resolvePlayer(G, ctx, params);
      if (!player || params.cardId == null) return false;
      const idx = player.hand.findIndex(c => c.id === params.cardId);
      if (idx === -1) return false;
      const [removed] = player.hand.splice(idx, 1);
      player.discard.push(removed);
      if (params.log !== false) {
        EVENTS.LOG.run(G, ctx, {
          message: `${player.name} сбросил ${removed.name || 'карту'}`,
        });
      }
      return true;
    },
  },
  RESTORE_DISCARD_CARD: {
    run: (G, ctx, params) => {
      const player = resolvePlayer(G, ctx, params);
      if (!player) return false;

      let card;
      if (params.cardId != null) {
        const idx = player.discard.findIndex(c => c.id === params.cardId);
        if (idx === -1) return false;
        [card] = player.discard.splice(idx, 1);
      } else {
        card = player.discard.pop();
        if (!card) return false;
      }
      card.isReversed = false;
      player.hand.push(card);
      return true;
    },
  },
  SET_MOVEMENT_BONUS: {
    run: (G, ctx, params) => {
      if (params.clear) {
        G.bonus = 0;
        G.bonusCards = [];
        return true;
      }
      G.bonus = Number(params.value) || 0;
      if (!G.bonusCards) G.bonusCards = [];
      if (params.cardId != null) {
        G.bonusCards.push(params.cardId);
      }
      return true;
    },
  },
  DAMAGE_FIGHTERS: {
    run: (G, ctx, params) => {
      const ref = params.targets ?? params.target;
      const targets = (Array.isArray(ref) ? ref : ref != null ? [ref] : []).map(String);
      const amount = Number(params.damage) || 1;

      targets.forEach(targetId => {
        const fighter = findFighter(G, targetId);
        if (!fighter || fighter.hp <= 0) return;

        fighter.hp = Math.max(0, fighter.hp - amount);
        EVENTS.LOG.run(G, ctx, {
          message: `${fighter.name} получает ${amount} урона! (HP: ${fighter.hp})`,
          type: 'danger',
        });

        if (fighter.hp <= 0) {
          fighter.position = null;
          fighter.startPosition = null;
          EVENTS.LOG.run(G, ctx, { message: `${fighter.name} пал в бою!`, type: 'danger' });

          if (fighter.type === 'hero') {
            const owner = G.players.find(p => p.fighters.includes(fighter));
            owner?.fighters.forEach(f => {
              f.hp = 0;
              f.position = null;
              f.startPosition = null;
            });
            EVENTS.CHECK_GAME_OVER.run(G, ctx, {});
          }
        }
      });
      return null;
    },
  },
  ACTIVATE_ITEMS: {
    run: (G, ctx, params) => {
      const player = resolvePlayer(G, ctx, params);
      const count = Number(params.count) || 1;
      const targetState = params.state ?? 'active';
      let changed = 0;

      for (const item of player?.items ?? []) {
        if (params.type && item.type !== params.type) continue;
        if (item.state === targetState) continue;
        item.state = targetState;
        changed++;
        if (changed >= count) break;
      }
      return changed;
    },
  },
  PUSH_FIGHTERS: {
    run: (G, ctx, params) => {
      const source = findFighter(G, params.sourceId);
      if (!source) return null;

      const sourcePos = getFighterPositions(source)[0];
      if (sourcePos == null) return null;

      const maxSteps = Number(params.maxSteps) || 1;
      const ref = params.targets ?? params.target;
      const targets = (Array.isArray(ref) ? ref : ref != null ? [ref] : []).map(String);
      const factContext = { G, ctx };

      targets.forEach(targetId => {
        const fighter = findFighter(G, targetId);
        if (!fighter || fighter.hp <= 0) return;

        let currentPos = getFighterPositions(fighter)[0];
        if (currentPos == null) return;

        let moved = false;
        for (let step = 0; step < maxSteps; step++) {
          const node = G.map?.circles?.find(n => String(n.id) === String(currentPos));
          if (!node) break;

          const currentDist = runFact(
            'CIRCLE_DISTANCE',
            { fromId: sourcePos, toId: currentPos },
            factContext,
          );
          let bestCell = null;
          let bestDist = currentDist;

          for (const neighborId of node.neighbors || node.connections || []) {
            const nId = String(neighborId);
            if (runFact('CELL_OCCUPIED', { cellId: nId, exceptFighterId: fighter.id }, factContext)) {
              continue;
            }
            const dist = runFact('CIRCLE_DISTANCE', { fromId: sourcePos, toId: nId }, factContext);
            if (dist > bestDist) {
              bestDist = dist;
              bestCell = nId;
            }
          }

          if (!bestCell) break;
          currentPos = bestCell;
          moved = true;
        }

        if (!moved) return;

        fighter.position = currentPos;
        EVENTS.LOG.run(G, ctx, {
          message: `${fighter.name} отброшен на клетку ${currentPos}`,
        });
      });
      return null;
    },
  },
  CHECK_GAME_OVER: {
    run: (G, ctx) => {
      const alive = getAliveHeroPlayers(G);
      if (alive.length > 1) return null;

      G.winner = alive.length === 1 ? alive[0].id : 'draw';
      EVENTS.LOG.run(G, ctx, {
        message:
          G.winner === 'draw'
            ? 'Ничья! Все герои пали.'
            : `Игра окончена! Победитель: ${alive[0].name}`,
      });
      return null;
    },
  },
};

export const runEvent = (G, ctx, type, options) => {
  if (!G.vars) G.vars = {};
  const { params, return: explicitReturn, raw } = normalizeOptions(options);
  const def = EVENTS[type];
  if (!def) return raw ? null : resolveOutput(G, null);
  const returnKey = resolveReturn(explicitReturn, def.return);
  const resolvedParams = resolveVariables(params, G.vars);
  if (returnKey != null) resolvedParams.return = returnKey;
  const out = def.run(G, ctx, resolvedParams);
  if (raw) return out;
  return resolveOutput(G, returnKey);
};
