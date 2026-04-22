import { INVALID_MOVE } from 'boardgame.io/core';

export const getAvailablePoints = (G, ctx, fighterId) => {
  const player = G.players[ctx.currentPlayer];
  const fighter = player.fighters.find(f => f.id === fighterId);
  if (!fighter) return { hero: [], assistant: [] };

  const heroStartNode = G.map.circles.find(i => i.position === Number(ctx.currentPlayer));
  if (!heroStartNode) return { hero: [], assistant: [] };

  const zoneColors = heroStartNode.zones || [];

  const assistantsNodes = G.map.circles
    .filter(i => {
      const hasZone = i.zones.some(color => zoneColors.includes(color));
      const isNotHeroNode = i.id !== heroStartNode.id;
      const isOccupied = G.players.some(p =>
        p.fighters.some(f => f.position === i.id && f.id !== fighterId),
      );
      return hasZone && isNotHeroNode && !isOccupied;
    })
    .map(i => i.id);

  return {
    hero: [heroStartNode.id],
    assistant: assistantsNodes,
  };
};

export const placementPhase = {
  turn: {
    onBegin: (G, ctx) => {
      if (!G || !G.players) return;

      const time = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const player = G?.players?.[ctx?.currentPlayer];
      if (player.type === 'human') {
        G.log.push({ msg: `Игрок ${player.name}: расставьте бойцов`, type: 'info', time });
      } else {
        G.log.push({ msg: `Игрок ${player.name} расставляет силы...`, type: 'info', time });
        autoPlaceAI(G, ctx);
      }
    },
  },
  moves: {
    placeUnit: (G, ctx, { unitId, circleId, time }) => {
      const player = G.players?.[ctx?.currentPlayer];
      const unit = player?.fighters?.find(i => i.id === unitId);
      if (!unit) return INVALID_MOVE;

      const points = getAvailablePoints(G, ctx, unitId);
      const isOccupied = G.players.some(p => p.fighters.some(f => f.position === circleId));

      if (!isOccupied && points[unit.type]?.includes(circleId)) {
        unit.position = circleId;
        unit.startPosition = circleId;
        G.log.push({ msg: `${unit.name} выставлен на позицию ${circleId}`, type: 'info', time });

        const isDone = player.fighters.every(f => f.position !== null);
        if (isDone && player.type === 'human') {
          G.pendingActions = [
            {
              id: 'placement-finish',
              text: 'Завершить расстановку',
              action: 'finishUnitPlacement',
            },
          ];
        } else {
          G.pendingActions = [];
        }
      } else {
        return INVALID_MOVE;
      }
    },
    finishUnitPlacement: (G, ctx, { time }) => {
      const player = G.players?.[ctx?.currentPlayer];
      G.pendingActions = [];
      G.log.push({ msg: `Игрок ${player.name} завершил расстановку`, type: 'info', time });
      G.pendingActions = [];
      ctx.events.endTurn();
    },
  },
  endIf: G => G.players?.every(p => p.fighters.every(f => f.position !== null)),
  next: 'GAME_START',
};

const autoPlaceAI = (G, ctx, { time }) => {
  const player = G.players[ctx.currentPlayer];

  const hero = player.fighters.find(f => f.type === 'hero');
  const heroPoints = getAvailablePoints(G, ctx, hero.id).hero;
  if (hero && heroPoints.length > 0) {
    hero.position = heroPoints[0];
    hero.startPosition = heroPoints[0];
  }

  const assistants = player.fighters.filter(f => f.type === 'assistant');
  assistants.forEach(assistant => {
    const points = getAvailablePoints(G, ctx, assistant.id).assistant;
    if (points.length > 0) {
      const randomPoint = points[Math.floor(Math.random() * points.length)];
      assistant.position = randomPoint;
      assistant.startPosition = randomPoint;
    }
  });

  G.log.push({ msg: `Игрок ${player.name} завершил расстановку`, type: 'info', time });
  ctx.events.endTurn();
};
