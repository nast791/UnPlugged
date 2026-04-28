import { activePlayer, addLog } from "#shared/utils/actions/utils";

export const actionSelection = {
  // endIf: ({ G }) => G.isPhaseEnd,
  // next: 'ACTION_SELECTION',
  onBegin: ({ G, ctx, events }) => {
    const player = G.players[ctx.currentPlayer];
    console.log(ctx.currentPlayer);
    

    G.isPhaseEnd = true;

  },
  onEnd: ({ G, ctx, events }) => {

    G.isPhaseEnd = false;
  },
};