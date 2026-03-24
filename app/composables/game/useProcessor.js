import GAME_PHASES from '#shared/constants/phases';
import { useGameStore } from '~/store/game.js';

export default function (actions = {}) {
  const store = useGameStore();
  const { phase, isPhaseAction } = storeToRefs(store);

  // Функция выполнения действия фазы
  const process = () => {
    const config = GAME_PHASES.find(i => i.id === phase.value);
    if (config?.onEnter && !isPhaseAction.value) {
      config.onEnter(store, actions);
      isPhaseAction.value = true;
    }
  };

  // Следим за изменением фазы (вход в фазу)
  watch(
    phase,
    newPhase => {
      const config = GAME_PHASES.find(i => i.id === newPhase);
      isPhaseAction.value = false;
      if (config?.auto) process();
    },
    { immediate: true },
  );

  // Следим за условиями переходов (реактивно)
  watch(
    store,
    state => {
      const config = GAME_PHASES.find(i => i.id === phase.value);
      if (!config?.transitions) return;

      const transition = config.transitions.find(t => t.condition(state));
      if (transition && isPhaseAction.value) phase.value = transition.to;
    },
    { deep: true },
  );

  return { process };
}
