import GAME_PHASES from '#shared/constants/phases';
import { useGameStore } from '~/store/game.js';

export default defineNuxtPlugin(nuxtApp => {
  const store = useGameStore();
  const actionsRegistry = {};

  watch(
    () => store.phase,
    newPhase => {
      const config = GAME_PHASES.find(i => i.id === newPhase);
      if (config?.onEnter) {
        nuxtApp.runWithContext(() => {
          config.onEnter(actionsRegistry);
        });
      }
    },
    { immediate: true },
  );

  return {
    provide: {
      registerActions: newActions => {
        Object.assign(actionsRegistry, newActions);
      },
    },
  };
});
