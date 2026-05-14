import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';
import { useMovement } from '~/composables/phases/useMovement';

export const useActionEnd = () => {
  const store = useGameStore();
  const { activePlayer } = storeToRefs(store);
  const { addLog } = useLogger();
  const { clearMovementBonus } = useMovement();

  const runActionEnd = () => {
    if (!activePlayer.value) return;
    activePlayer.value.actionsUsed++;
    activePlayer.value.fighters.forEach(f => {
      f.active = false;
      f.startPosition = f.position; 
    });
    clearMovementBonus();
    
    const actionsRemaining = activePlayer.value.actionsPoints - activePlayer.value.actionsUsed;

    if (actionsRemaining > 0) {
      addLog(`Действие завершено. Осталось действий: ${actionsRemaining}`, 'info');
      store.goToPhase('ACTION_SELECTION');
    } else {
      addLog(`Все действия игрока ${activePlayer.value.name} исчерпаны`, 'info');
      store.goToPhase('TURN_END');
    }
  };

  return { runActionEnd };
}