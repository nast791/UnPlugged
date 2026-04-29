import { game } from '#shared/utils/game';
import { Client } from 'boardgame.io/client';
import { useGameStore } from '~/store/game.js';

const sharedClient = shallowRef(null);
const sharedG = ref(null);
const sharedCtx = ref(null);
const isInitialized = ref(false);

export const useBoardgame = () => {
  const store = useGameStore();

  const initClient = () => {
    if (isInitialized.value) return;

    const setupData = JSON.parse(JSON.stringify(store.activeSetupData));
    
    const gameClient = Client({
      game: {
        ...game,
        setup: (ctx) => game.setup(ctx, setupData),
      },
      numPlayers: setupData.players?.length || 2,
      playerID: store.localPlayerId,
    });

    gameClient.subscribe(state => {
      if (!state) return;
      sharedG.value = state.G;
      sharedCtx.value = state.ctx;   
    });

    gameClient.start();
    sharedClient.value = gameClient;
    isInitialized.value = true;
  };

  if (import.meta.client) {
    initClient();
  }

  const activePlayer = computed(() => {
    if (!sharedG.value || !sharedCtx.value) return null;
    return sharedG.value.players[sharedCtx.value.currentPlayer];
  });

  return { 
    client: sharedClient, 
    G: sharedG, 
    ctx: sharedCtx, 
    activePlayer 
  };
};
