import { runMove } from '../rules/moves.js';
import { getActivePlayer } from '../rules/helpers.js';

export const attack = {
  onEnd: ({ G, ctx, events }) => {
    const player = getActivePlayer(G, ctx);
    player.actionsUsed++;

    if (player.actionsUsed >= player.actionsPoints) {
      runMove('LOG', { G, ctx }, { message: `Действия игрока ${player.name} исчерпаны.` });
      events.setPhase('TURN_END');
    } else {
      events.setPhase('ACTION_SELECTION');
    }
  },
};
