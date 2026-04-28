import { activePlayer, addLog } from '#shared/utils/actions/utils';
import { placeUnit, finishUnitPlacement, autoPlaceAI } from '#shared/utils/actions/placement';

export const placementPhase = {
  endIf: ({ G }) => G.isPhaseEnd,
  next: 'TURN_START',
  onEnd: ({ G, events }) => {
    addLog(G, 'Все бойцы расставлены. Начинаем игру!');
    G.isPhaseEnd = false;
  },
  turn: {
    onBegin: ({ G, ctx, events }) => {
      const allPlaced = G.players.every(p => p.fighters.every(f => f.position !== null));
      if (allPlaced) {
        G.isPhaseEnd = true;
        return;
      }

      const player = activePlayer({ G, ctx });

      if (player.type === 'human') {
        addLog(G, `Игрок ${player.name}: расставьте бойцов`);
      } else {
        addLog(G, `Игрок ${player.name} расставляет силы...`);
        autoPlaceAI({ G, ctx, events });
      }
    },
  },
  moves: {
    placeUnit: ({ G, ctx }, { unitId, circleId }) => {
      return placeUnit({ G, ctx, unitId, circleId });
    },
    finishUnitPlacement: ({ G, ctx, events }) => {
      return finishUnitPlacement({ G, ctx, events });
    },
  },
};
