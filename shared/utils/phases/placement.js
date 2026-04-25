import { INVALID_MOVE } from 'boardgame.io/core';
import { addLog } from '#shared/utils/log';

export const getAvailablePoints = (G, ctx, fighterId) => {
  const player = G.players[ctx.currentPlayer];
  const fighter = player.fighters.find(f => f.id === fighterId);
  if (!fighter) return { hero: [], assistant: [] };

  const heroStartNode = G.map.circles.find(i => i.position === Number(ctx.currentPlayer) + 1);
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
  onBegin: ({G, ctx, events}) => {
    if (!G?.players) return;

    const player = G?.players?.[ctx?.currentPlayer];
    if (player.type === 'human') {
      addLog(G, `Игрок ${player.name}: расставьте бойцов`);
    } else {
      addLog(G, `Игрок ${player.name} расставляет силы...`);
      autoPlaceAI(G, ctx, events);
    }
  },
  moves: {
    placeUnit: ({G, ctx}, { unitId, circleId }) => {
      const player = G.players?.[ctx?.currentPlayer];

      const unit = player?.fighters?.find(i => i.id === unitId);
      if (!unit) return INVALID_MOVE;
      
      const points = getAvailablePoints(G, ctx, unitId);
      const isOccupied = G.players.some(p => p.fighters.some(f => f.position === circleId));
      const unitType = unit.type.toLowerCase();
      const isPointValid = points[unitType]?.includes(circleId);
    
      if (!isOccupied && isPointValid) {
        unit.position = circleId;
        unit.startPosition = circleId;
        
        addLog(G, `${unit.name} выставлен на позицию ${circleId}`);

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
    finishUnitPlacement: ({G, ctx, events }) => {
      const player = G.players?.[ctx?.currentPlayer];
      G.pendingActions = [];
      addLog(G, `Игрок ${player.name} завершил расстановку`);
      G.pendingActions = [];
      events.endTurn();
    },
  },
  endIf: G => G.players?.every(p => p.fighters.every(f => f.position !== null)),
  next: 'GAME_START',
};

const autoPlaceAI = (G, ctx, events) => {
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

  addLog(G, `Игрок ${player.name} завершил расстановку`);
  events.endTurn();
};
