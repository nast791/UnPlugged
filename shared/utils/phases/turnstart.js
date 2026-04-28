import { activePlayer, addLog } from "#shared/utils/actions/utils";

export const turnStart = {
  endIf: ({ G }) => G.isPhaseEnd,
  next: 'ACTION_SELECTION',
  onBegin: ({ G, ctx, events }) => {
    const player = activePlayer({ G, ctx });
    const isHeroAlive = player.fighters.some(f => f.type === 'hero' && f.hp > 0);

    if (!isHeroAlive) {
      events.endTurn();
      return;
    }

    G.turn++;
    player.actionsUsed = 0;
    player.actionsPoints = 2;

    player.fighters.forEach(f => {
      f.active = false;
      f.startPosition = f.position;
    });

    G.isPhaseEnd = true;
  },
  onEnd: ({ G, ctx, events }) => {
    const player = activePlayer({ G, ctx });
    const round = Math.floor(G.turn / G.players.length) + 1;
    addLog(G, `Ход игрока: ${player.name} (Раунд ${round})`);
    G.isPhaseEnd = false;
  },
};
