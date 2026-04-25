import { game } from '#shared/utils/game';
import { Client } from 'boardgame.io/client';
import { useGameStore } from '~/store/game.js';

const sharedClient = shallowRef(null);
const sharedG = ref(null);
const sharedCtx = ref(null);

export const useBoardgame = () => {
  const route = useRoute();
  const store = useGameStore();

  onMounted(() => {
    if (sharedClient.value) return;
    const setupData = JSON.parse(JSON.stringify(store.activeSetupData));

    if (!setupData || String(route.params.id) !== String(setupData.id)) {
      throw createError({
        statusCode: 404,
        message: 'Игра не найдена или сессия истекла',
        fatal: true,
      });
    }

    const gameClient = Client({
      game: {
        ...game,
        setup: ctx => game.setup(ctx, setupData),
      },
      numPlayers: setupData.players?.length || 2,
      playerID: store.localPlayerId
    });

    gameClient.subscribe(state => {
      if (!state) return;
      sharedG.value = state.G;
      sharedCtx.value = state.ctx;
    });

    gameClient.start();
    sharedClient.value = gameClient;
  });

  return { 
    client: sharedClient, 
    G: sharedG, 
    ctx: sharedCtx 
  };
};
