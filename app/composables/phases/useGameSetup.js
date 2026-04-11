import { useGameStore } from '~/store/game.js';
import { useAppStore } from '~/store/app';

export const useGameSetup = () => {
  const store = useGameStore();
  const appStore = useAppStore();
  const human = computed(() => appStore.glossary?.meta?.players?.[0]);

  const runGameSetup = () => {
    store.$reset();
  };

  const finishGameSetup = () => {
    const isValid = store.players.length >= 2 && store.players.some(i => i.type === human.value?.id) && store.map?.id;
    if (isValid) {
      store.phase = 'GAME_INIT';
    }
  };

  return { runGameSetup, finishGameSetup };
};
