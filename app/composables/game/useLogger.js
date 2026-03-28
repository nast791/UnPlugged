import LOG_TYPES from '#shared/constants/logs';
import { useGameStore } from '~/store/game.js';

export default function () {
  const { history, activePlayer, turn, phase } = storeToRefs(useGameStore());
  

  const addLog = (message, type = LOG_TYPES.SYSTEM.id, options = null, tag = null) => {
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

  return {
    addLog
  }
};