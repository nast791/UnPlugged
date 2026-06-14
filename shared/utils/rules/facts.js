import { getActivePlayer, getAliveHeroPlayerIds, getFighterPositions, findFighter, resolvePlayer } from './helpers.js';

export const runFact = (name, params, context) => {
  const def = FACTS[name];
  if (!def) return null;
  return def.run(params ?? {}, context);
};

export const FACTS = {
  ATTACK_CELLS: {
    return: '$circles',
    run: (params, { G }) => {
      const start = String(params?.startPos ?? params?.position ?? '');
      const maxSteps = Number(params?.maxSteps ?? params?.range) || 1;
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
        const node = G.map.circles.find(n => String(n.id) === id);
        if (!node) continue;
        for (const neighborId of node.neighbors || node.connections || []) {
          const nId = String(neighborId);
          const nextDist = dist + 1;
          if (nextDist < distances[nId]) {
            distances[nId] = nextDist;
            queue.push({ id: nId, dist: nextDist });
          }
        }
      }
      return Array.from(reachable);
    },
  },
  FIGHTERS_IN_RANGE: {
    return: '$candidates',
    run: (params, context) => {
      const { G } = context;
      const sourceId = params.sourceId || params.fighterId;
      const ownerPlayer = G.players.find(p =>
        p.fighters.some(f => String(f.id) === String(sourceId)),
      );
      if (!ownerPlayer) return [];

      const fighter = ownerPlayer.fighters.find(f => String(f.id) === String(sourceId));
      if (!fighter) return [];

      const positions = getFighterPositions(fighter);
      if (!positions.length) return [];

      let reachableCircles = [];
      if (fighter.rangeType === 'ranged') {
        const circles = new Set();
        positions.forEach(pos => {
          const node = G.map.circles.find(n => String(n.id) === pos);
          if (!node) return;
          const sourceZones = node.zones || [];
          G.map.circles.forEach(c => {
            if (c.zones?.some(z => sourceZones.includes(z))) {
              circles.add(String(c.id));
            }
          });
        });
        reachableCircles = Array.from(circles);
      } else {
        const maxSteps = Number(params.maxSteps ?? fighter.attackRange) || 1;
        const circles = new Set();
        positions.forEach(pos => {
          FACTS.ATTACK_CELLS.run({ startPos: pos, maxSteps }, context).forEach(id =>
            circles.add(id),
          );
        });
        reachableCircles = Array.from(circles);
      }

      if (!reachableCircles.length) return [];

      const reachable = new Set(reachableCircles);
      const side = params.side || 'opponent';
      const kind = params.kind || 'fighter';
      const ids = [];

      G.players.forEach(p => {
        const isOwn = String(p.id) === String(ownerPlayer.id);
        if (side === 'opponent' && isOwn) return;
        if (side === 'allied' && !isOwn) return;
        p.fighters.forEach(f => {
          if (f.hp <= 0) return;
          if (!getFighterPositions(f).some(pos => reachable.has(pos))) return;
          if (kind === 'hero' && f.type !== 'hero') return;
          if (kind === 'assistant' && f.type !== 'assistant') return;
          ids.push(f.id);
        });
      });
      return ids;
    },
  },
  MOVEMENT_CELLS: {
    return: '$cells',
    run: (params, context) => {
      const { G } = context;
      const fighterId = params.fighterId;
      const ownerPlayer = G.players.find(p =>
        p.fighters.some(f => String(f.id) === String(fighterId)),
      );
      if (!ownerPlayer) return [];

      const fighter = ownerPlayer.fighters.find(f => String(f.id) === String(fighterId));
      if (!fighter?.startPosition) return [];

      const baseMove = Number(fighter.move) || 0;
      const bonusFighterMove = Number(fighter.bonusMovement) || 0;
      const bonusMove = Number(G.bonus) || 0;
      const totalRange = baseMove + bonusFighterMove + bonusMove;
      const startPos = String(fighter.startPosition);

      const distances = {};
      G.map.circles.forEach(n => {
        distances[String(n.id)] = Infinity;
      });
      distances[startPos] = 0;

      const queue = [{ id: startPos, dist: 0 }];
      const available = new Set();

      const enemyPositions = G.players
        .filter(p => String(p.id) !== String(ownerPlayer.id))
        .flatMap(p => p.fighters.map(f => String(f.position)));

      const allOccupied = G.players
        .flatMap(p => p.fighters.map(f => String(f.position)))
        .filter(pos => pos !== startPos);

      while (queue.length > 0) {
        queue.sort((a, b) => a.dist - b.dist);
        const { id, dist } = queue.shift();

        if (dist > distances[id]) continue;

        const isOccupiedByOther = allOccupied.includes(id);
        if (dist > 0 && !isOccupiedByOther) {
          available.add(id);
        }

        if (dist >= totalRange) continue;

        const node = G.map.circles.find(n => String(n.id) === id);
        if (!node) continue;

        for (const neighborId of node.neighbors || node.connections || []) {
          const nId = String(neighborId);
          const isEnemy = enemyPositions.includes(nId);

          if (!isEnemy || fighter.canPassThroughEnemies) {
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
    },
  },
  PLACEMENT_CELLS: {
    return: '$placementCells',
    run: (params, context) => {
      const { G, ctx } = context;
      const player = getActivePlayer(G, ctx);
      const fighter = player?.fighters?.find(f => String(f.id) === String(params.fighterId));
      if (!fighter) return { hero: [], assistant: [] };

      const heroStartNode = G.map.circles.find(i => i.position === Number(ctx.currentPlayer) + 1);
      if (!heroStartNode) return { hero: [], assistant: [] };

      const zoneColors = heroStartNode.zones || [];
      const fighterId = params.fighterId;

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

      return {
        hero: [heroStartNode.id],
        assistant: assistantsNodes,
      };
    },
  },
  CAN_PLACE_FIGHTER: {
    return: '$canPlace',
    run: (params, context) => {
      const { G, ctx } = context;
      const fighterId = params.fighterId;
      const cellId = params.cellId ?? params.circleId;
      const player = getActivePlayer(G, ctx);
      const unit = player?.fighters?.find(f => String(f.id) === String(fighterId));
      if (!unit || cellId == null) return false;

      const isOccupied = G.players.some(p =>
        p.fighters.some(
          f => String(f.position) === String(cellId) && String(f.id) !== String(fighterId),
        ),
      );
      if (isOccupied) return false;

      const points = runFact('PLACEMENT_CELLS', { fighterId }, context);
      const unitType = unit.type.toLowerCase();
      return (points[unitType] ?? []).map(String).includes(String(cellId));
    },
  },
  CAN_PLAYER_ATTACK: {
    return: '$canAttack',
    run: (params, context) => {
      const { G, ctx } = context;
      const player = getActivePlayer(G, ctx);
      return player.fighters.some(f => {
        if (!f.position) return false;
        if (
          !runFact(
            'HAS_CARD_IN_HAND',
            { types: ['attack', 'hybrid'], fighterId: f.id },
            context,
          )
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
  HAS_CARD_IN_HAND: {
    return: '$hasCard',
    run: (params, { G, ctx }) => {
      const player = getActivePlayer(G, ctx);
      const types = []
        .concat(params.types ?? params.type ?? [])
        .filter(Boolean);
      const fighterId = params.fighterId;

      return player.hand.some(c => {
        if (types.length && !types.includes(c.type)) return false;
        if (!fighterId) return true;
        const fighter = player.fighters.find(f => String(f.id) === String(fighterId));
        if (!fighter) return false;
        return c.role === fighter.role || c.role === 'any';
      });
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
  PLAYERS_WITH_ALIVE_HERO: {
    return: '$alivePlayers',
    run: (params, { G }) => getAliveHeroPlayerIds(G),
  },
  HERO_ON_BOARD: {
    run: (params, { G }) => {
      const fighter = findFighter(G, params.fighterId);
      return (
        !!fighter &&
        fighter.type === 'hero' &&
        fighter.hp > 0 &&
        getFighterPositions(fighter).length > 0
      );
    },
  },
  CELL_OCCUPIED: {
    run: (params, { G }) => {
      const cellId = String(params.cellId);
      const exceptFighterId = params.exceptFighterId;
      for (const p of G.players) {
        for (const f of p.fighters) {
          if (f.hp <= 0) continue;
          if (exceptFighterId != null && String(f.id) === String(exceptFighterId)) continue;
          if (getFighterPositions(f).includes(cellId)) return true;
        }
      }
      return false;
    },
  },
  CIRCLE_DISTANCE: {
    return: '$distance',
    run: (params, { G }) => {
      const fromId = params.fromId ?? params.from;
      const toId = params.toId ?? params.to;
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
        const node = G.map.circles.find(n => String(n.id) === id);
        if (!node) continue;
        for (const neighborId of node.neighbors || node.connections || []) {
          const nId = String(neighborId);
          if (distances[nId] !== Infinity) continue;
          distances[nId] = distances[id] + 1;
          if (nId === goal) return distances[nId];
          queue.push(nId);
        }
      }
      return Infinity;
    },
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
  ALL_ITEMS_ACTIVE: {
    run: (params, context) => {
      const player = resolvePlayer(context.G, context.ctx, params);
      const items = (player?.items ?? []).filter(i => !params.type || i.type === params.type);
      if (!items.length) return false;
      const need = params.count ?? items.length;
      const activeState = params.state ?? 'active';
      return items.filter(i => i.state === activeState).length >= need;
    },
  },
};
