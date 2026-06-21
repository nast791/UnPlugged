import { game } from '#shared/utils/game';
import { Client } from 'boardgame.io/client';
import { useGameStore } from '~/store/game.js';

const sharedClient = shallowRef(null);
const sharedG = ref(null);
const sharedCtx = ref(null);
const isInitialized = ref(false);
let unsubscribe = null;
let timer = null;

const clearTimer = () => {
  if (!timer) return;
  clearTimeout(timer);
  timer = null;
};

const scheduleCardAutoPick = G => {
  clearTimer();
  const sel = G?.targetSelection;
  if (!sel || sel.kind !== 'card' || !sel.autoPick || G.outputVar !== sel.returnKey) return;

  const { cardId, delayMs } = sel.autoPick;
  timer = setTimeout(() => {
    timer = null;
    sharedClient.value?.moves?.selectCard?.({ cardId });
  }, delayMs);
};

export const destroyBoardgameClient = () => {
  clearTimer();
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (sharedClient.value) {
    sharedClient.value.stop();
    sharedClient.value = null;
  }
  sharedG.value = null;
  sharedCtx.value = null;
  isInitialized.value = false;
};

export const useBoardgame = () => {
  const store = useGameStore();

  const initClient = () => {
    if (isInitialized.value || !store.activeSetupData) return;

    const setupData = JSON.parse(JSON.stringify(store.activeSetupData));

    const gameClient = Client({
      game: {
        ...game,
        setup: ctx => game.setup(ctx, setupData),
      },
      numPlayers: setupData.players?.length || 2,
      playerID: store.localPlayerId,
    });

    unsubscribe = gameClient.subscribe(state => {
      if (!state) return;
      sharedG.value = state.G;
      sharedCtx.value = state.ctx;
      scheduleCardAutoPick(state.G);
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
    activePlayer,
  };
};
