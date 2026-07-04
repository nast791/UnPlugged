import {
  findFighter,
  getFighterOwner,
  getActivePlayer,
  getAliveHeroPlayers,
  getFighterPositions,
  getMapCircle,
  getCircleNeighbors,
  pushLog,
  resolvePlayer,
  applyTemplate,
  findPlayerCard,
  collectMoveCards,
  clearRevealedDeckCards,
  parseCardDestination,
  resolveCardZoneLabel,
  resolveCardRefs,
  resolveRefList,
  resolvePickMode,
  pickRandomItems,
  addRevealedDeckCards,
  placePlayerCards,
  getHandCardId,
  getOpponentPlayers,
  getRevealedDeckEntries,
  resolvePlayerTarget,
  peekDeckCards,
  refreshCardZoneUI,
  refreshHandCardUI,
  mergePendingActions,
  getPendingZoneConfirmActions,
  assignTeamId,
} from './helpers.js';
import {
  resolveVariables,
  resolveVarValue,
  resolveOutput,
  normalizeOptions,
  resolveReturn,
  storeReturn,
  setGamePath,
  removeGamePath,
} from './runtime.js';
import { runFact } from './facts.js';
import { nextLogSeq } from './logging.js';

export const grantZoneVisibility = (G, ctx, params) => {
  if (!G.zoneVisibilityGrants) G.zoneVisibilityGrants = [];

  const grant = {
    id: params.grantId ?? `zone_${G.logSeq ?? 0}_${G.zoneVisibilityGrants.length}`,
    ownerId: String(params.ownerId),
    zone: params.zone,
    viewerId: String(params.viewerId ?? ctx.currentPlayer),
    requireConfirm: !!params.requireConfirm,
  };

  G.zoneVisibilityGrants = G.zoneVisibilityGrants.filter(
    g =>
      !(
        String(g.ownerId) === grant.ownerId &&
        g.zone === grant.zone &&
        String(g.viewerId) === grant.viewerId
      ),
  );
  G.zoneVisibilityGrants.push(grant);
  refreshCardZoneUI(G, ctx);
  return grant;
};

export const revokeZoneVisibility = (G, ctx, params) => {
  if (!G.zoneVisibilityGrants?.length) return 0;

  const before = G.zoneVisibilityGrants.length;
  G.zoneVisibilityGrants = G.zoneVisibilityGrants.filter(g => {
    if (params.grantId && g.id !== params.grantId) return true;
    if (params.ownerId != null && String(g.ownerId) !== String(params.ownerId)) return true;
    if (params.zone && g.zone !== params.zone) return true;
    if (params.viewerId != null && String(g.viewerId) !== String(params.viewerId)) return true;
    if (params.requireConfirm != null && g.requireConfirm !== params.requireConfirm) return true;
    return false;
  });

  refreshCardZoneUI(G, ctx);
  return before - G.zoneVisibilityGrants.length;
};

export const applyZoneConfirmPending = G => {
  const confirms = getPendingZoneConfirmActions(G);
  if (!confirms.length) return;
  mergePendingActions(G, confirms, G.pendingActions ?? []);
};

export const EVENTS = {
  LOG: {
    run: (G, ctx, params) => {
      pushLog(G, applyTemplate(params.message, params.template), {
        type: params.type || 'info',
        audience: params.audience ?? 'public',
        playerId: params.playerId,
        ctx,
      });
      return null;
    },
  },
  HIGHLIGHT_TARGETS: {
    run: (G, ctx, params) => {
      if (params?.cells != null) {
        const cells = (Array.isArray(params.cells) ? params.cells : [params.cells])
          .map(String)
          .filter(Boolean);
        G.highlightCells = cells;
        return null;
      }

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
  CLEAR_TARGET_SELECTION: {
    run: G => {
      const kind = G.targetSelection?.kind;
      if (kind === 'own' || kind === 'target') {
        G.targetSelection = null;
        G.highlightCells = [];
        G.highlightFighters = [];
      }
      return null;
    },
  },
  MOVE_CARDS: {
    run: (G, ctx, params) => {
      const player = resolvePlayerTarget(G, ctx, params) ?? resolvePlayer(G, ctx, params);
      if (!player) return 0;

      const dest = parseCardDestination(params.to ?? params.dest ?? 'discard');
      const from = params.from ?? params.source ?? 'deck';
      const fromPos = params.fromPosition ?? params.position ?? 'top';
      const returnKey = params.return;

      if (dest.zone === 'revealed') {
        const refs = resolveCardRefs(params, G.vars);
        let cards = [];
        if (refs.length) {
          refs.forEach(ref => {
            const found = findPlayerCard(player, G, ref, ['deck', 'hand', 'revealed', 'discard']);
            if (found) cards.push(found.card);
          });
        } else {
          const count = Number(params.count) || 1;
          cards = peekDeckCards(player.deck, count, fromPos);
        }
        if (!cards.length) {
          if (returnKey) storeReturn(G, returnKey, []);
          return [];
        }

        addRevealedDeckCards(G, player, cards, fromPos);
        const ids = cards.map(getHandCardId);
        if (returnKey) storeReturn(G, returnKey, ids);

        if (params.log !== false) {
          const names = cards.map(c => c.title || c.name || c.id).join(', ');
          EVENTS.LOG.run(G, ctx, {
            message: applyTemplate(
              params.message ||
                '${player} показывает ${count} карт(у) с ${from} колоды: ${cards}',
              {
                '${player}': player.name,
                '${count}': cards.length,
                '${from}': fromPos === 'bottom' ? 'низа' : 'верха',
                '${cards}': names || '—',
              },
            ),
          });
        }
        return ids;
      }

      if (
        (from === 'deck' || from.startsWith('deck')) &&
        dest.zone === 'hand' &&
        !resolveCardRefs(params, G.vars).length
      ) {
        const count = Number(params.count) || 1;
        let moved = 0;
        for (let i = 0; i < count; i++) {
          if (!player.deck?.length) {
            EVENTS.HANDLE_EXHAUSTION.run(G, ctx, { playerId: player.id });
            break;
          }
          if (!player.hand) player.hand = [];
          player.hand.push(player.deck.pop());
          moved++;
        }
        if (params.log !== false && moved) {
          EVENTS.LOG.run(G, ctx, {
            message: params.message || `${player.name} берёт ${moved} карт(у)`,
          });
        }
        return moved;
      }

      const moveParams = { ...params, from };
      const cards = collectMoveCards(player, G, moveParams);
      if (!cards.length) return 0;

      placePlayerCards(player, cards, dest);
      clearRevealedDeckCards(G, cards);

      if (params.log !== false) {
        EVENTS.LOG.run(G, ctx, {
          message: applyTemplate(
            params.message || '${player}: ${count} карт(а) перемещена(ы) ${dest}',
            {
              '${player}': player.name,
              '${count}': cards.length,
              '${dest}': resolveCardZoneLabel(dest),
            },
          ),
        });
      }

      return cards.length;
    },
  },
  SELECT_CARDS: {
    run: (G, ctx, params) => {
      EVENTS.CLEAR_TARGET_SELECTION.run(G, ctx);

      const owner = resolvePlayerTarget(G, ctx, params) ?? resolvePlayer(G, ctx, params);
      if (!owner) return null;

      const source = params.source ?? params.from ?? 'hand';
      let candidates = resolveRefList(params, G.vars, ['candidates', 'fromVar']);

      if (
        !candidates.length &&
        source === 'hand' &&
        (params.types || params.type || params.fighter || params.fighterId)
      ) {
        candidates = runFact('CARDS_IN_HAND', params, { G, ctx });
      }
      if (!candidates.length && source === 'revealed') {
        candidates = getRevealedDeckEntries(G, owner.id).map(e => getHandCardId(e.card));
      }

      if (!candidates.length) return null;

      const selection = Number(params.selection) || 1;
      const returnKey = params.return;
      const pick = resolvePickMode(params);

      if (pick === 'random') {
        const picked = pickRandomItems(candidates, selection);
        storeReturn(G, returnKey, selection === 1 ? picked[0] : picked);
        EVENTS.LOG.run(G, ctx, {
          message: params.message || `Случайно выбрано ${picked.length} карт(ы)`,
        });
        return null;
      }

      if (pick === 'auto' && candidates.length === selection) {
        const autoPickDelayMs = Number(params.autoPickDelayMs) || 800;
        const needsDelay =
          params.autoPickDelayMs != null ||
          (source === 'revealed' && selection === 1 && candidates.length === 1);

        if (needsDelay) {
          G.targetSelection = {
            kind: 'card',
            returnKey,
            candidates,
            selection,
            picked: [],
            playerId: params.playerId != null ? String(params.playerId) : String(owner.id),
            autoPick: { cardId: candidates[0], delayMs: autoPickDelayMs },
          };
          storeReturn(G, returnKey, selection === 1 ? '' : []);
          EVENTS.LOG.run(G, ctx, {
            message: params.message || 'Карта на показе',
            audience: 'private',
          });
          return returnKey;
        }

        const picked = candidates.slice(0, selection);
        storeReturn(G, returnKey, selection === 1 ? picked[0] : picked);
        EVENTS.LOG.run(G, ctx, {
          message: params.message || `Выбрано ${picked.length} карт(ы)`,
          audience: 'private',
        });
        return null;
      }

      G.targetSelection = {
        kind: 'card',
        returnKey,
        candidates,
        selection,
        picked: [],
        playerId: params.playerId != null ? String(params.playerId) : String(owner.id),
      };
      storeReturn(G, returnKey, selection === 1 ? '' : []);

      EVENTS.LOG.run(G, ctx, {
        message:
          params.message ||
          (selection > 1 ? `Выберите ${selection} карты` : 'Выберите карту'),
        audience: 'private',
      });

      const cardOwnerId = params.playerId != null ? String(params.playerId) : String(owner.id);
      const revealHand =
        params.revealZone === 'hand' ||
        (cardOwnerId !== String(ctx.currentPlayer) && source === 'hand');
      if (revealHand) {
        grantZoneVisibility(G, ctx, {
          ownerId: cardOwnerId,
          zone: 'hand',
          requireConfirm: params.requireConfirm !== false,
        });
        applyZoneConfirmPending(G);
      }

      refreshHandCardUI(G, ctx);
      return returnKey;
    },
  },
  SELECT_OPPONENT_PLAYER: {
    run: (G, ctx, params) => {
      EVENTS.CLEAR_TARGET_SELECTION.run(G, ctx);

      let candidates = resolveRefList(params, G.vars, ['candidates', 'fromVar']);

      const opponents = getOpponentPlayers(G, ctx, params);
      const opponentIds = opponents.map(p => String(p.id));
      if (!candidates.length) candidates = opponentIds;
      else candidates = candidates.filter(id => opponentIds.includes(id));

      if (!candidates.length) return null;

      const returnKey = params.return;
      if (candidates.length === 1) {
        const player = opponents.find(p => String(p.id) === candidates[0]) ?? opponents[0];
        storeReturn(G, returnKey, String(player.id));
        EVENTS.LOG.run(G, ctx, {
          message: params.message || `Оппонент: ${player.name}`,
          audience: 'private',
        });
        return null;
      }

      G.targetSelection = {
        kind: 'opponent',
        returnKey,
        candidates,
        selection: 1,
        picked: [],
      };
      storeReturn(G, returnKey, '');

      EVENTS.LOG.run(G, ctx, {
        message: params.message || 'Выберите оппонента',
        audience: 'private',
      });

      return returnKey;
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
        .filter(f => f.type === 'hero' && (f.currentHp ?? 0) > 0)
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
      pushLog(G, applyTemplate(params.message, params.template), { audience: 'private', ctx });
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
  SELECT_TARGET: {
    run: (G, ctx, params) => {
      const player = getActivePlayer(G, ctx);

      if (params.clear) {
        if (G.targetSelection?.kind === 'own') {
          G.targetSelection.picked = [];
        }
        G.highlightCells = [];
        return null;
      }

      if (params.fighterId != null && params.candidates == null && params.return == null) {
        const id = String(params.fighterId);
        const fighter = player.fighters.find(f => String(f.id) === id);
        if (!fighter || (fighter.currentHp ?? 0) <= 0) return null;

        if (G.targetSelection?.kind !== 'own') {
          G.targetSelection = {
            kind: 'own',
            candidates: player.fighters.filter(f => (f.currentHp ?? 0) > 0).map(f => String(f.id)),
            selection: 1,
            picked: [],
          };
        }

        const sel = G.targetSelection;
        if (!sel.candidates.map(String).includes(id)) return null;

        const picked = sel.picked.map(String);
        sel.picked = picked.includes(id) ? [] : [id];

        if (sel.picked.length) {
          G.selectedUnitId = id;
        }

        if (!sel.picked.length) {
          G.highlightCells = [];
        }

        return null;
      }

      if (G.targetSelection?.kind === 'own') {
        G.targetSelection = null;
        G.highlightCells = [];
      }

      const candidates = resolveRefList(params, G.vars, ['candidates']);
      if (!candidates.length) return null;

      const selection = Number(params.selection) || 1;
      const returnKey = params.return ?? '$targets';
      G.targetSelection = {
        kind: 'target',
        returnKey,
        candidates,
        selection,
        picked: [],
      };
      storeReturn(G, returnKey, selection === 1 ? '' : []);

      if (candidates.length) {
        EVENTS.HIGHLIGHT_TARGETS.run(G, ctx, { targets: candidates });
      }

      const message = applyTemplate(
        (params.message || 'Выберите цель: ${count}').replace(/\$\{count\}/g, String(selection)),
        { '${remaining}': candidates.length, ...(params.template ?? {}) },
      );
      EVENTS.LOG.run(G, ctx, { message, audience: 'private' });

      return returnKey;
    },
  },
  SET_VARIABLES: {
    run: (G, ctx, params) => {
      (params.vars || []).forEach(({ var: varName, value }) => {
        setGamePath(G, varName, resolveVarValue(value, G.vars));
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
      list.forEach(entry => {
        const varName = typeof entry === 'object' ? entry.var : entry;
        if (varName == null) return;
        removeGamePath(G, varName);
      });
      return null;
    },
  },
  MOVE_FIGHTER: {
    run: (G, ctx, params) => {
      const cellId = String(params.cellId ?? params.targetId ?? '');
      const fighter = findFighter(G, params.fighterId);
      if (!fighter || !cellId) return false;

      if (params.validate !== false) {
        const moveParams = { fighterId: params.fighterId };
        if (params.maxSteps != null) moveParams.maxSteps = params.maxSteps;
        if (params.fromCurrent) moveParams.fromCurrent = true;
        if (params.passThroughEnemies) moveParams.passThroughEnemies = true;
        const cells = runFact('MOVEMENT_CELLS', moveParams, { G, ctx });
        if (!cells.map(String).includes(cellId)) return false;
      }

      fighter.position = cellId;
      if (G.targetSelection?.kind === 'own') {
        G.targetSelection.picked = [];
      }
      G.highlightCells = [];
      G.highlightFighters = [];
      EVENTS.LOG.run(G, ctx, {
        message: `${fighter.name} переместился на ${cellId} позицию`,
      });

      if (params.removeFrom) {
        const varKey = params.removeFrom.startsWith('$') ? params.removeFrom : `$${params.removeFrom}`;
        const list = G.vars[varKey];
        if (Array.isArray(list)) {
          storeReturn(
            G,
            varKey,
            list.filter(id => String(id) !== String(params.fighterId)),
          );
        }
      }

      return true;
    },
  },
  IGNORE_CARD_TEXT: {
    run: (G, ctx, params) => {
      if (!G.combat) G.combat = {};
      const side = params.side ?? params.target ?? 'opponent';
      let ids = [];

      if (side === 'all') {
        ids = G.players.map(p => String(p.id));
      } else if (side === 'opponent') {
        ids = getOpponentPlayers(G, ctx).map(p => String(p.id));
      } else if (side === 'self' || side === 'own') {
        const active = getActivePlayer(G, ctx);
        if (active) ids = [String(active.id)];
      } else if (params.playerId != null) {
        ids = [String(params.playerId)];
      } else {
        ids = [String(side)];
      }

      G.combat.ignoreCardTextPlayerIds = ids;
      G.combat.ignoreOpponentCardText =
        side === 'opponent' ||
        ids.every(id => id !== String(getActivePlayer(G, ctx)?.id ?? ''));

      EVENTS.LOG.run(G, ctx, {
        message:
          params.message ||
          (side === 'opponent'
            ? 'Текстовые свойства карты оппонента игнорируются'
            : 'Текстовые свойства карт игнорируются'),
      });
      return true;
    },
  },
  SELECT_CELL: {
    return: '$moveCell',
    run: (G, ctx, params) => {
      const returnKey = params.return ?? '$moveCell';
      let cells = [];
      let fighterId = params.fighterId != null ? String(params.fighterId) : '';
      const maxSteps = Number(params.maxSteps) || 3;
      const fromCurrent = params.fromCurrent !== false;
      const passThroughEnemies = !!params.passThroughEnemies;
      const purpose = params.purpose ?? 'movement';

      if (params.zoneSourceId || params.sourceId) {
        cells = runFact(
          'FREE_ZONE_CELLS',
          { sourceId: params.zoneSourceId ?? params.sourceId },
          { G, ctx },
        ).map(String);
      } else if (params.candidates?.length) {
        cells = (Array.isArray(params.candidates) ? params.candidates : [params.candidates])
          .map(String)
          .filter(Boolean);
      } else if (purpose === 'placement' && fighterId) {
        const placement = runFact('PLACEMENT_CELLS', { fighterId }, { G, ctx });
        const fighter = findFighter(G, fighterId);
        const type = fighter?.type?.toLowerCase() ?? 'hero';
        cells = (placement[type] ?? []).map(String);
      } else {
        if (!fighterId) return null;
        cells = runFact(
          'MOVEMENT_CELLS',
          { fighterId, maxSteps, fromCurrent, passThroughEnemies },
          { G, ctx },
        ).map(String);
      }

      if (!cells.length) return null;

      const fighter = fighterId ? findFighter(G, fighterId) : null;
      G.targetSelection = {
        kind: 'cell',
        returnKey,
        candidates: cells,
        selection: 1,
        fighterId: fighterId || null,
      };
      storeReturn(G, returnKey, '');
      EVENTS.HIGHLIGHT_TARGETS.run(G, ctx, { cells });
      EVENTS.LOG.run(G, ctx, {
        message:
          params.message ||
          (purpose === 'placement'
            ? fighter
              ? `Выберите клетку для размещения ${fighter.name}`
              : 'Выберите клетку для размещения'
            : fighter
              ? `Выберите клетку для ${fighter.name} (до ${maxSteps} клеток)`
              : 'Выберите клетку'),
        audience: 'private',
      });
      return returnKey;
    },
  },
  RESURRECT_FIGHTERS: {
    run: (G, ctx, params) => {
      const fighterIds = resolveRefList(params, G.vars, ['fighterIds', 'fighterId', 'fromVar']);
      const cellIds = resolveRefList(params, G.vars, ['cellIds', 'cellId', 'targetId']);
      if (!fighterIds.length || !cellIds.length) return false;

      const zoneSource = params.zoneSourceId ?? params.sourceId;
      let restored = 0;

      fighterIds.forEach((fighterId, index) => {
        const fighter = findFighter(G, fighterId);
        const cellId = cellIds[index] ?? cellIds[cellIds.length - 1];
        if (!fighter || (fighter.currentHp ?? 0) > 0 || !cellId) return;

        if (params.validate !== false) {
          const sourceForZone = zoneSource ?? fighterId;
          const cells = runFact(
            'FREE_ZONE_CELLS',
            { sourceId: sourceForZone },
            { G, ctx },
          ).map(String);
          if (!cells.includes(cellId)) return;
        }

        const restoredHp = params.hp != null ? Number(params.hp) : Number(fighter.hp ?? 0);
        if (!restoredHp) return;

        fighter.currentHp = restoredHp;
        fighter.position = cellId;
        restored++;
        EVENTS.LOG.run(G, ctx, {
          message: `${fighter.name} воскрешён на клетке ${cellId}`,
        });
      });

      return restored > 0 ? restored : false;
    },
  },
  RELOOP_PIPELINE: {
    run: (G, ctx, params) => {
      if (!G.pipeline?.done) return null;
      const remove = new Set((params.steps || []).map(String));
      G.pipeline.done = G.pipeline.done.filter(id => !remove.has(String(id)));
      (params.clearVars || []).forEach(key => delete G.vars[key]);
      EVENTS.HIGHLIGHT_TARGETS.run(G, ctx);
      return null;
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

      const ids =
        params.fighterIds != null
          ? resolveRefList(params, G.vars, ['fighterIds'])
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
  ADD_BONUS: {
    run: (G, ctx, params) => {
      const scope = params.scope ?? 'combat';

      if (params.clear) {
        if (scope === 'movement') {
          G.bonus = 0;
          G.bonusCards = [];
        } else {
          if (!G.combat) G.combat = {};
          G.combat.attackBonus = 0;
          G.combat.bonusCards = [];
        }
        return true;
      }

      let cardRef = params.cardId ?? params.card;
      if (Array.isArray(cardRef)) cardRef = cardRef[0];
      let bonus;
      let cardLabel = params.label ?? 'бонус';

      if (cardRef == null && params.value != null) {
        bonus = Number(params.value) || 0;
      } else if (cardRef != null) {
        const player = resolvePlayerTarget(G, ctx, params) ?? resolvePlayer(G, ctx, params);
        const found = findPlayerCard(player, G, cardRef);

        if (found) {
          const { card } = found;
          bonus = params.value != null ? Number(params.value) : Number(card.bonus) || 0;
          cardLabel = card.title || card.name || 'карта';
          cardRef = getHandCardId(card);
        } else if (scope === 'movement') {
          bonus = Number(params.value) || 0;
        } else {
          return false;
        }

        if (scope === 'movement') {
          if (!G.bonusCards) G.bonusCards = [];
          G.bonusCards.push(String(cardRef));
        } else {
          if (!G.combat) G.combat = {};
          if (!G.combat.bonusCards) G.combat.bonusCards = [];
          G.combat.bonusCards.push(String(cardRef));
        }
      } else {
        return false;
      }

      if (scope === 'movement') {
        G.bonus = bonus;
        return true;
      }

      if (!G.combat) G.combat = {};
      G.combat.attackBonus = (Number(G.combat.attackBonus) || 0) + bonus;
      EVENTS.LOG.run(G, ctx, {
        message: applyTemplate(
          params.message || 'К силе атаки прибавлено +${bonus} (${card})',
          {
            '${bonus}': bonus,
            '${card}': cardLabel,
          },
        ),
      });
      return true;
    },
  },
  DAMAGE_FIGHTERS: {
    run: (G, ctx, params) => {
      const targets = resolveRefList(params, G.vars);
      const amount = Number(params.damage) || 1;

      targets.forEach(targetId => {
        const fighter = findFighter(G, targetId);
        if (!fighter || (fighter.currentHp ?? 0) <= 0) return;

        const fromHp = fighter.currentHp ?? 0;
        const nextHp = Math.max(0, fromHp - amount);
        fighter.currentHp = nextHp;

        if (!G.recentDamage) G.recentDamage = [];
        G.recentDamage.push({
          id: nextLogSeq(G),
          fighterId: String(fighter.id),
          amount,
          fromHp,
          toHp: nextHp,
        });
        if (G.recentDamage.length > 12) G.recentDamage = G.recentDamage.slice(-12);

        EVENTS.LOG.run(G, ctx, {
          message: `${fighter.name} получает ${amount} урона! (HP: ${nextHp})`,
          type: 'danger',
        });

        if (nextHp <= 0) {
          fighter.position = null;
          fighter.startPosition = null;
          EVENTS.LOG.run(G, ctx, { message: `${fighter.name} пал в бою!`, type: 'danger' });

          if (fighter.type === 'hero') {
            const owner = G.players.find(p => p.fighters.includes(fighter));
            owner?.fighters.forEach(f => {
              f.currentHp = 0;
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
  HEAL_FIGHTERS: {
    run: (G, ctx, params) => {
      const targets = resolveRefList(params, G.vars);
      const amount = Number(params.heal ?? params.amount) || 1;

      targets.forEach(targetId => {
        const fighter = findFighter(G, targetId);
        if (!fighter || (fighter.currentHp ?? 0) <= 0) return;

        const maxHp = Number(fighter.hp ?? 0);
        const prevHp = fighter.currentHp ?? 0;
        const nextHp = Math.min(maxHp, prevHp + amount);
        if (nextHp === prevHp) return;

        fighter.currentHp = nextHp;
        EVENTS.LOG.run(G, ctx, {
          message: `${fighter.name} восстанавливает ${nextHp - prevHp} здоровья! (HP: ${nextHp})`,
        });
      });
      return null;
    },
  },
  GRANT_ACTIONS: {
    run: (G, ctx, params) => {
      const player = resolvePlayer(G, ctx, params);
      if (!player) return false;

      const count = Number(params.count) || 1;
      player.actionsPoints = (player.actionsPoints ?? 0) + count;
      EVENTS.LOG.run(G, ctx, {
        message: `${player.name} получает ${count} доп. ${count === 1 ? 'действие' : 'действия'}`,
      });
      return true;
    },
  },
  TOGGLE_STATE_ITEMS: {
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
      const targets = resolveRefList(params, G.vars);
      const factContext = { G, ctx };

      targets.forEach(targetId => {
        const fighter = findFighter(G, targetId);
        if (!fighter || (fighter.currentHp ?? 0) <= 0) return;

        let currentPos = getFighterPositions(fighter)[0];
        if (currentPos == null) return;

        let moved = false;
        for (let step = 0; step < maxSteps; step++) {
          const node = getMapCircle(G, currentPos);
          if (!node) break;

          const currentDist = runFact(
            'CIRCLE_DISTANCE',
            { fromId: sourcePos, toId: currentPos },
            factContext,
          );
          let bestCell = null;
          let bestDist = currentDist;

          for (const neighborId of getCircleNeighbors(node)) {
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
  SET_CARD_ZONE_VISIBILITY: {
    run: (G, ctx, params) => {
      const ownerId = params.ownerId ?? params.playerId;
      if (ownerId == null || !params.zone) return null;

      if (params.visible === false) {
        revokeZoneVisibility(G, ctx, {
          ownerId,
          zone: params.zone,
          viewerId: params.viewerId,
          grantId: params.grantId,
        });
        return null;
      }

      grantZoneVisibility(G, ctx, {
        ownerId,
        zone: params.zone,
        viewerId: params.viewerId,
        requireConfirm: !!params.requireConfirm,
        grantId: params.grantId,
      });

      if (params.requireConfirm) applyZoneConfirmPending(G);
      return null;
    },
  },
  ASSIGN_TEAMS: {
    run: (G, _ctx, params = {}) => {
      const playerCount = params.playerCount ?? G.players?.length ?? 0;
      for (let i = 0; i < (G.players?.length ?? 0); i++) {
        G.players[i].teamId = assignTeamId(i, playerCount);
      }
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
