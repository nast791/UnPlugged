import { runMove } from '../rules/moves.js';
import { getActivePlayer } from '../rules/helpers.js';
import { ensureCombatDefaults, resolveCombatPowers } from '../combat.js';

export const defense = {
  onBegin: ({ G }) => {
    ensureCombatDefaults(G);
  },
  onEnd: ({ G, ctx, events }) => {
    if (G.combat) {
      resolveCombatPowers(G);
    }

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
