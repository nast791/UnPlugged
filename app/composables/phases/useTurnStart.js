import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';

export const useTurnStart = () => {
  const store = useGameStore();
  const { activePlayer, activePlayerIndex, turn, round, timer, players } = storeToRefs(store);
  const { addLog } = useLogger();

  const isPlayerAlive = player => {
    return player.fighters.some(f => f.type === 'hero' && f.hp > 0);
  };

  const runTurnStart = () => {
    const totalPlayers = players.value.length;
    let nextIndex = activePlayerIndex.value;
    let foundNextPlayer = false;

    for (let i = 0; i < totalPlayers; i++) {
      nextIndex = nextIndex >= totalPlayers ? 1 : nextIndex + 1;

      const potentialPlayer = players.value.find(p => p.index === nextIndex);

      if (potentialPlayer && isPlayerAlive(potentialPlayer)) {
        if (nextIndex <= activePlayerIndex.value) {
          round.value++;
        }

        activePlayerIndex.value = nextIndex;
        foundNextPlayer = true;
        break;
      }
    }

    if (!foundNextPlayer) {
      console.error('Живых игроков не найдено!');
      return store.goToPhase('GAME_OVER');
    }

    activePlayer.value.actionsUsed = 0;
    activePlayer.value.actionsPoints = 2;
    activePlayer.value.fighters?.forEach(f => {
      f.active = false;
      f.startPosition = f.position;
    });

    turn.value++;
    addLog(`Ход игрока: ${activePlayer.value.name} (Раунд ${round.value})`, 'info');

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

  return { runTurnStart, formattedTime, stopTimer, startTimer };
};
