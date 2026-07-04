import { runMove } from '../rules/moves.js';
import { runFact } from '../rules/facts.js';
import { getActivePlayer } from '../rules/helpers.js';
import { INVALID_MOVE } from '#boardgame/core';

export const placementPhase = {
  next: 'START_GAME',
  onEnd: ({ G, ctx }) => {
    runMove('LOG', { G, ctx }, { message: 'Все бойцы расставлены. Начинаем игру!' });
  },
  turn: {
    onBegin: ({ G, ctx, events }) => {
      const allPlaced = G.players.every(p => p.fighters.every(f => f.position !== null));
      if (allPlaced) {
        return runMove('END_PHASE', { G, events });
      }

      const player = getActivePlayer(G, ctx);

      if (player.type === 'human') {
        runMove('LOG', { G, ctx }, {
          message: `Игрок ${player.name}: расставьте бойцов`,
          audience: 'private',
        });
      } else {
        runMove('LOG', { G, ctx }, { message: `Игрок ${player.name} расставляет силы...` });
        runMove('AUTO_PLACE_AI', { G, ctx, events });
      }
    },
  },
  moves: {
    getAvailableCells: ({ G, ctx }, { fighterId }) => {
      G.highlightCells = runFact('PLACEMENT_CELLS', { fighterId }, { G, ctx });
    },
    placeUnit: (playCtx, { unitId, circleId }) => {
      if (!runMove('PLACE_FIGHTER', playCtx, { unitId, circleId })) return INVALID_MOVE;
    },
    finishUnitPlacement: playCtx => {
      runMove('FINISH_PLACEMENT', playCtx);
    },
  },
};
