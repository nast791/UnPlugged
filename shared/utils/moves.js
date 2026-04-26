export const moves = {
  setFighterActive: ({G, ctx}, { fighterId, active }) => {
    const player = G.players[ctx.currentPlayer];
    const fighter = player.fighters.find(f => f.id === fighterId);
    if (fighter) {
      fighter.active = active;
    }
  },
  resetAllFighters: ({G, ctx}) => {
    G.players[ctx.currentPlayer].fighters.forEach(f => (f.active = false));
  },
}