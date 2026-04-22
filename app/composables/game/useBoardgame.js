import { game } from '#shared/utils/game';
import { Client } from 'boardgame.io/client';
import { useGameStore } from '~/store/game.js';

export const useBoardgame = () => {
  const route = useRoute();
  const client = shallowRef(null);
  const G = ref(null);
  const ctx = ref(null);
  const store = useGameStore();

  onMounted(async() => {
    const setupData = JSON.parse(JSON.stringify(store.activeSetupData));

    if (!setupData || String(route.params.id) !== String(setupData.id)) {
      throw createError({
        statusCode: 404,
        message: 'Игра не найдена или сессия истекла',
        fatal: true,
      });
    }

    const playersCount = setupData.players?.length || 2;

    const gameClient = Client({
      game: {
        ...game,
        setup: ctx => game.setup(ctx, setupData),
      },
      numPlayers: playersCount,
      playerID: store.localPlayerId
    });

    gameClient.subscribe(state => {
      if (state) {
        G.value = state.G;
        ctx.value = state.ctx;
      }
    });

    await nextTick();
    gameClient.start();

    client.value = gameClient;
  });

  return { client, G, ctx };
};
