import { activePlayer, addLog } from "#shared/utils/actions/utils";

export const effect = {
  onEnd: ({ G, ctx, events }) => {
    const player = activePlayer({ G, ctx });
    player.actionsUsed++;

    if (player.actionsUsed >= player.actionsPoints) {
      addLog(G, `Действия игрока ${player.name} исчерпаны.`);
      events.setPhase('TURN_END');
    } else {
      events.setPhase('ACTION_SELECTION');
    }
  }
}