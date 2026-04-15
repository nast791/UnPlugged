import { useGameStore } from '~/store/game.js';
import { useAppStore } from '~/store/app';

export const useGameSetup = () => {
  const store = useGameStore();
  const appStore = useAppStore();

  const runGameSetup = () => {
    store.$reset();
    store.goToPhase('GAME_SETUP');
  };

  const finishGameSetup = () => {
    const isValid =
      store.players.length >= 2 &&
      store.players.some(i => i.type === appStore.glossary?.meta?.players?.[0]?.id) &&
      store.map?.id;
    if (isValid) {
      store.goToPhase('GAME_INIT');
    }
  };

  return { runGameSetup, finishGameSetup };
};
