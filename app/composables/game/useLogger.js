import { useGameStore } from '~/store/game.js';
import { useAppStore } from '~/store/app';

export const useLogger = () => {
  const { history, activePlayer, turn, phase } = storeToRefs(useGameStore());
  const appStore = useAppStore();
  const logs = appStore.glossary?.meta?.logTypes || [];
  
  const addLog = (message, type = logs?.[0]?.id, options = null, tag = null) => {
    if (tag) {
      const existingIndex = history.value.findIndex(log => log.tag === tag);
      
      if (existingIndex !== -1) {
        history.value.splice(existingIndex, 1);
      }
    }

    history.value.push({
      id: crypto.randomUUID(),
      type,
      message,
      turn: turn.value,
      playerId: activePlayer.value?.id,
      phase: phase.value,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options,
      tag
    });
  }

  const addActions = (id, message, actions = []) => {
    addLog(
      message,
      'action',
      actions.map(i => ({...i, clicked: false})),
      `${activePlayer.value?.id}_${phase.value}_${turn.value}_${id}`
    )
  };

  return {
    addLog,
    addActions
  }
};