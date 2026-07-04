import { runMove } from '../rules/moves.js';
import { getActivePlayer } from '../rules/helpers.js';
import { ensureCombatDefaults, resolveCombatPowers } from '../combat.js';

export const defense = {
  onBegin: ({ G }) => {
    ensureCombatDefaults(G);
  },
  next: ({ G, ctx }) => {
    const player = getActivePlayer(G, ctx);
    if (player.actionsUsed >= player.actionsPoints) {
      return 'TURN_END';
    }
    return 'ACTION_SELECTION';
  },
  onEnd: ({ G, ctx }) => {
    if (G.combat) {
      resolveCombatPowers(G);
    }

    const player = getActivePlayer(G, ctx);
    player.actionsUsed++;

    if (player.actionsUsed >= player.actionsPoints) {
      runMove('LOG', { G, ctx }, { message: `Действия игрока ${player.name} исчерпаны.` });
    }
  },
};
