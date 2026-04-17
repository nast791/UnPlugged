import GAME_PHASES from '#shared/constants/phases';
import { useGameStore } from '~/store/game.js';

export default defineNuxtPlugin(nuxtApp => {
  const store = useGameStore();
  const actionsRegistry = {};
  const getCurrentConfig = () => GAME_PHASES.find(i => i.id === store.phase);

  watch(
    () => store.phase,
    newPhase => {
      const config = getCurrentConfig();
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
      handleFighterClick: (fighter) => {
        const config = getCurrentConfig();
        if (config?.onFighterClick) {
          return config.onFighterClick(fighter, actionsRegistry);
        }
      },
      handleNodeClick: (nodeId) => {
        const config = getCurrentConfig();
        if (config?.onNodeClick) {
          return config.onNodeClick(nodeId, actionsRegistry);
        }
      },
      handleCardClick: (card) => {
        const config = getCurrentConfig();
        if (config?.onCardClick) {
          return config.onCardClick(card, actionsRegistry);
        }
      }
    },
  };
});
