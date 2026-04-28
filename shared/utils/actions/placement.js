import { activePlayer, addLog } from "#shared/utils/actions/utils";
import { INVALID_MOVE } from 'boardgame.io/core';

export const setPosition = ({G, unit, circleId}) => {
  unit.position = circleId;
  unit.startPosition = circleId;
  addLog(G, `${unit.name} выставлен на позицию ${circleId}`);
};

export const getAvailablePoints = ({G, ctx, fighterId}) => {
  const player = activePlayer({ G, ctx });
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

export const autoPlaceAI = ({ G, ctx, events }) => {
  const player = activePlayer({ G, ctx });

  const hero = player.fighters.find(f => f.type === 'hero');
  const heroPoints = getAvailablePoints({G, ctx, fighterId: hero.id}).hero;
  if (hero && heroPoints.length > 0) {
    setPosition({G, unit: hero, circleId: heroPoints[0]});
  }

  const assistants = player.fighters.filter(f => f.type === 'assistant');
  assistants.forEach(assistant => {
    const points = getAvailablePoints({G, ctx, fighterId: assistant.id}).assistant;
    if (points.length > 0) {
      const randomPoint = points[Math.floor(Math.random() * points.length)];
      setPosition({G, unit: assistant, circleId: randomPoint});
    }
  });

  addLog(G, `Игрок ${player.name} завершил расстановку`);
  events.endTurn();
};

export const placeUnit = ({ G, ctx, unitId, circleId }) => {
  const player = activePlayer({ G, ctx });

  const unit = player?.fighters?.find(i => i.id === unitId);
  if (!unit) return INVALID_MOVE;

  const points = getAvailablePoints({G, ctx, fighterId: unitId});
  const isOccupied = G.players.some(p =>
    p.fighters.some(f => f.position === circleId && f.id !== unitId),
  );
  const unitType = unit.type.toLowerCase();
  const isPointValid = points[unitType]?.includes(circleId);

  if (!isOccupied && isPointValid) {
    setPosition({G, unit, circleId});

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
};

export const finishUnitPlacement = ({ G, ctx, events }) => {
  const player = activePlayer({ G, ctx });
  G.pendingActions = [];
  addLog(G, `Игрок ${player.name} завершил расстановку`);
  events.endTurn();
};
