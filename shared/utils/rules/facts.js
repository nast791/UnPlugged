import {
  getActivePlayer,
  getAliveHeroPlayers,
  getFighterPositions,
  findFighter,
  resolvePlayer,
  resolvePlayerTarget,
  filterHandCards,
  getHandCardId,
  getActiveFighterId,
  getPlayedCardFighterId,
  getOpponentPlayer,
  fighterMatchesRef,
  getPlayedCard,
  cardMatchesFighter,
  cardMatchesActiveFighter,
  cardMatchesPhase,
  getFighterOwner,
  bfsReachable,
  bfsDistance,
  getSourceZoneCells,
  getPlacementCells,
  getMovementCells,
  filterOwnFighters,
  filterFightersInRange,
  isRangedFighter,
  areSameTeam,
  getTeammates,
  getPlayerSidebarRole,
} from './helpers.js';
import { resolveVarValue } from './runtime.js';

export const runFact = (name, params, context) => {
  const def = FACTS[name];
  if (!def) return null;
  return def.run(params ?? {}, context);
};

export const FACTS = {
  ATTACK_CELLS: {
    return: '$circles',
    run: (params, { G }) =>
      bfsReachable(
        G,
        String(params.startPos ?? params.position ?? ''),
        Number(params.maxSteps ?? params.range) || 1,
      ),
  },
  FIGHTERS_IN_RANGE: {
    return: '$candidates',
    run: (params, context) => {
      const { G } = context;
      const owned = getFighterOwner(G, params.sourceId ?? params.fighterId);
      if (!owned) return [];

      const { fighter, owner } = owned;
      const positions = getFighterPositions(fighter);
      if (!positions.length) return [];

      let reachableCircles;
      if (isRangedFighter(fighter)) {
        reachableCircles = getSourceZoneCells(G, fighter.id);
      } else {
        const maxSteps = Number(params.maxSteps ?? fighter.attackRange) || 1;
        const circles = new Set();
        positions.forEach(pos => {
          runFact('ATTACK_CELLS', { startPos: pos, maxSteps }, context).forEach(id =>
            circles.add(id),
          );
        });
        reachableCircles = Array.from(circles);
      }

      if (!reachableCircles.length) return [];
      return filterFightersInRange(G, owner, new Set(reachableCircles), params);
    },
  },
  MOVEMENT_CELLS: {
    return: '$cells',
    run: (params, { G }) => {
      const owned = getFighterOwner(G, params.fighterId);
      if (!owned) return [];
      return getMovementCells(G, owned.fighter, owned.owner, params);
    },
  },
  PLACEMENT_CELLS: {
    return: '$placementCells',
    run: (params, context) => getPlacementCells(context.G, context.ctx, params.fighterId),
  },
  CAN_PLACE_FIGHTER: {
    return: '$canPlace',
    run: (params, context) => {
      const { G, ctx } = context;
      const cellId = params.cellId ?? params.circleId;
      const unit = getActivePlayer(G, ctx)?.fighters?.find(
        f => String(f.id) === String(params.fighterId),
      );
      if (!unit || cellId == null) return false;

      const isOccupied = G.players.some(p =>
        p.fighters.some(
          f =>
            String(f.position) === String(cellId) && String(f.id) !== String(params.fighterId),
        ),
      );
      if (isOccupied) return false;

      const points = getPlacementCells(G, ctx, params.fighterId);
      return (points[unit.type.toLowerCase()] ?? []).map(String).includes(String(cellId));
    },
  },
  CAN_PLAYER_ATTACK: {
    return: '$canAttack',
    run: (params, context) => {
      const { G, ctx } = context;
      return getActivePlayer(G, ctx).fighters.some(f => {
        if (!f.position) return false;
        if (
          !runFact(
            'CARDS_IN_HAND',
            { types: ['attack', 'hybrid'], fighterId: f.id, phase: 'ATTACK' },
            context,
          ).length
        ) {
          return false;
        }
        return (
          runFact(
            'FIGHTERS_IN_RANGE',
            { sourceId: f.id, side: 'opponent', kind: 'fighter' },
            context,
          ).length > 0
        );
      });
    },
  },
  CARDS_IN_HAND: {
    return: '$candidates',
    run: (params, context) => {
      const player = resolvePlayer(context.G, context.ctx, params);
      return filterHandCards(player, params, context).map(getHandCardId);
    },
  },
  ACTIVE_FIGHTER: {
    return: '$activeFighterId',
    run: (params, { G, ctx }) => {
      if (params.fighterId != null) {
        const id = getActiveFighterId(G, ctx);
        return fighterMatchesRef(id ? findFighter(G, id) : null, params.fighterId);
      }
      return getActiveFighterId(G, ctx);
    },
  },
  CURRENT_GAME_PHASE: {
    return: '$phase',
    run: (params, { ctx }) => ctx.phase,
  },
  ACTIVE_PLAYER: {
    return: '$activePlayerId',
    run: (params, { G, ctx }) => getActivePlayer(G, ctx)?.id ?? null,
  },
  OWN_FIGHTERS: {
    return: '$fighters',
    run: (params, { G, ctx }) => {
      const player = resolvePlayer(G, ctx, params);
      if (!player) return [];
      return filterOwnFighters(player, params).map(f => f.id);
    },
  },
  ZONE_CELLS: {
    return: '$zoneCells',
    run: (params, { G }) => {
      const sourceId = params.sourceId ?? params.fighterId;
      return sourceId ? getSourceZoneCells(G, sourceId) : [];
    },
  },
  FREE_ZONE_CELLS: {
    return: '$cells',
    run: (params, context) => {
      const sourceId = params.sourceId ?? params.fighterId;
      const cells = runFact('ZONE_CELLS', { sourceId }, context);
      return cells.filter(cellId => !runFact('CELL_OCCUPIED', { cellId }, context));
    },
  },
  OPPONENT_PLAYER: {
    return: '$opponentId',
    run: (params, { G, ctx }) => getOpponentPlayer(G, ctx)?.id ?? null,
  },
  PLAYERS_WITH_ALIVE_HERO: {
    return: '$alivePlayers',
    run: (params, { G }) => getAliveHeroPlayers(G).map(p => p.id),
  },
  HERO_ON_BOARD: {
    run: (params, { G }) => {
      const fighter = findFighter(G, params.fighterId);
      return (
        fighter?.type === 'hero' &&
        (fighter.currentHp ?? 0) > 0 &&
        getFighterPositions(fighter).length > 0
      );
    },
  },
  FIGHTER_ALIVE: {
    run: (params, context) => {
      const { G } = context;
      const fighterId = resolveVarValue(params.fighterId, G.vars ?? {});
      const fighter = findFighter(G, fighterId);
      let ok = !!fighter && (fighter.currentHp ?? 0) > 0;
      if (ok && params.onBoard && !getFighterPositions(fighter).length) ok = false;
      return params.invert ? !ok : ok;
    },
  },
  PLAYER_ALIVE: {
    run: (params, context) => {
      const { G } = context;
      const playerId = resolveVarValue(params.playerId, G.vars ?? {});
      const player = G.players.find(p => String(p.id) === String(playerId));
      if (!player) return false;
      return player.fighters.some(f => f.type === 'hero' && (f.currentHp ?? 0) > 0);
    },
  },
  CELL_OCCUPIED: {
    run: (params, { G }) => {
      const cellId = String(params.cellId);
      for (const p of G.players) {
        for (const f of p.fighters) {
          if ((f.currentHp ?? 0) <= 0) continue;
          if (params.exceptFighterId != null && String(f.id) === String(params.exceptFighterId)) {
            continue;
          }
          if (getFighterPositions(f).includes(cellId)) return true;
        }
      }
      return false;
    },
  },
  CIRCLE_DISTANCE: {
    return: '$distance',
    run: (params, { G }) => bfsDistance(G, params.fromId ?? params.from, params.toId ?? params.to),
  },
  COUNT_ITEMS: {
    return: '$count',
    run: (params, context) => {
      const player = resolvePlayer(context.G, context.ctx, params);
      if (!player?.items?.length) return 0;
      return player.items.filter(item => {
        if (params.type && item.type !== params.type) return false;
        if (params.state && item.state !== params.state) return false;
        return true;
      }).length;
    },
  },
  DECK_COUNT: {
    return: '$count',
    run: (params, context) => {
      const player = resolvePlayerTarget(context.G, context.ctx, params);
      return player?.deck?.length ?? 0;
    },
  },
  COMBAT_WON: {
    return: '$won',
    run: (params, { G, ctx }) => {
      const playerId = String(ctx.currentPlayer);
      if (G.combat.winner === 'attacker') {
        return String(G.combat.attackerPlayerId) === playerId;
      }
      if (G.combat.winner === 'defender') {
        const owned = getFighterOwner(G, G.combat.defenderId);
        return owned != null && String(owned.owner.id) === playerId;
      }
      return false;
    },
  },
  COMBAT_DEFENDER: {
    return: '$defender',
    run: (params, { G }) => G.combat?.defenderId ?? null,
  },
  COMBAT_OPPONENT_FIGHTER: {
    return: '$opponentCombatFighterId',
    run: (params, context) => {
      const { G, ctx } = context;
      if (!G.combat) return null;

      const activePlayerId = String(ctx.currentPlayer);
      const { attackerId, defenderId } = G.combat;
      if (!attackerId || !defenderId) return null;

      const attackerOwner = getFighterOwner(G, attackerId);
      const defenderOwner = getFighterOwner(G, defenderId);
      let id = null;
      if (attackerOwner && String(attackerOwner.owner.id) !== activePlayerId) {
        id = attackerId;
      } else if (defenderOwner && String(defenderOwner.owner.id) !== activePlayerId) {
        id = defenderId;
      }
      if (!id) return null;
      return id;
    },
  },
  COMBAT_OPPONENT_PLAYER: {
    return: '$combatOpponentId',
    run: (params, context) => {
      const id = runFact('COMBAT_OPPONENT_FIGHTER', {}, context);
      if (!id) return null;
      return getFighterOwner(context.G, id)?.owner?.id ?? null;
    },
  },
  COMBAT_FIGHTER: {
    return: '$combatFighterId',
    run: (params, context) => {
      const id = getPlayedCardFighterId(context.G, context.ctx);
      if (!id) return null;
      const fighter = findFighter(context.G, id);
      if (!fighter || (fighter.currentHp ?? 0) <= 0 || !getFighterPositions(fighter).length) {
        return null;
      }
      return id;
    },
  },
  COMBAT_OPPONENT_CARD: {
    run: (params, { G, ctx }) => {
      if (!G.combat?.card) return false;
      const ownerId = G.combat.cardPlayerId ?? G.combat.attackerPlayerId;
      if (ownerId == null) return false;
      return String(ownerId) !== String(ctx.currentPlayer);
    },
  },
  PLAYED_CARD: {
    return: '$playedCardId',
    run: (params, context) => {
      const card = getPlayedCard(context.G, context.ctx);
      return card ? getHandCardId(card) : null;
    },
  },
  CARD_MATCHES_FIGHTER: {
    run: (params, context) => {
      const { G, ctx } = context;
      const card = getPlayedCard(G, ctx);
      return cardMatchesActiveFighter(card, G, ctx);
    },
  },
  CARD_MATCHES_PHASE: {
    run: (params, context) => {
      const { G, ctx, combatContext } = context;
      const card = getPlayedCard(G, ctx);
      if (!card) return false;
      const trigger = combatContext?.trigger;
      if (card.phase && trigger) return card.phase === trigger;
      if (!ctx.phase) return false;
      return cardMatchesPhase(card, ctx.phase);
    },
  },
  IS_TEAMMATE: {
    run: (params, { G, ctx }) => {
      const viewer = resolvePlayer(G, ctx, params.viewerId != null ? { playerId: params.viewerId } : {});
      const target = resolvePlayer(G, ctx, params.playerId != null ? params : params.targetId != null ? { playerId: params.targetId } : {});
      return areSameTeam(viewer, target);
    },
  },
  PLAYER_SIDEBAR_ROLE: {
    return: '$playerRole',
    run: (params, { G, ctx }) => {
      const player = resolvePlayer(G, ctx, params);
      const viewerId = params.viewerId ?? ctx.currentPlayer;
      return getPlayerSidebarRole(player, viewerId, G.players ?? []);
    },
  },
};
