import GAME_PHASES from '#shared/constants/phases';
import { useGameStore } from '~/store/game.js';

export default defineNuxtPlugin(nuxtApp => {
  const store = useGameStore();
  const actionsRegistry = {};

  const process = () => {
    const { phase, isPhaseAction } = storeToRefs(store);
    const config = GAME_PHASES.find(i => i.id === phase.value);

    if (config?.onEnter && !isPhaseAction.value) {
      config.onEnter(store, actionsRegistry);
      isPhaseAction.value = true;
    }
  };

  watch(
    () => store.phase,
    newPhase => {
      const config = GAME_PHASES.find(i => i.id === newPhase);
      store.isPhaseAction = false;

      if (config?.auto) {
        nextTick(() => process());
      }
    },
    { immediate: true },
  );

  watch(
    store,
    state => {
      const config = GAME_PHASES.find(i => i.id === state.phase);
      if (!config?.transitions) return;

      const transition = config.transitions.find(t => t.condition(state));
      if (transition && state.isPhaseAction) {
        state.phase = transition.to;
      }
    },
    { deep: true },
  );

  return {
    provide: {
      registerActions: newActions => {
        Object.assign(actionsRegistry, newActions);
      },
      gameProcess: () => process(),
    },
  };
});
