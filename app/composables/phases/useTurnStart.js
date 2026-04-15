import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';

export const useTurnStart = () => {
  const store = useGameStore();
  const { activePlayer, activePlayerIndex, turn, timer } = storeToRefs(store);
  const { addLog } = useLogger();

  const runTurnStart = () => {
    activePlayerIndex.value = 1;
    turn.value++;
    addLog(`--- РАУНД ${turn.value} ---`, 'info');
    addLog(`Ход игрока: ${activePlayer.value.name}`, 'info');
    activePlayer.value.actionsPoints = 2;
    startTimer();
    checkEffects();
    store.goToPhase('ACTION_SELECTION');
  };

  const timerInterval = ref(null);

  const startTimer = () => {
    stopTimer();

    timerInterval.value = setInterval(() => {
      timer.value++;
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  };

  onUnmounted(stopTimer);

  const formattedTime = computed(() => {
    const hours = Math.floor(timer.value / 3600);
    const minutes = Math.floor((timer.value % 3600) / 60);
    const seconds = timer.value % 60;

    return [hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join(':');
  });

  const checkEffects = () => {
    // Реализуем позже: вызов эффектов карт и пассивных умений
  };

  return { runTurnStart, formattedTime };
};
