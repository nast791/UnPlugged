import { useGameStore } from '~/store/game.js';

export default function () {
  const { id, isSetupComplete } = storeToRefs(useGameStore());

  const setupNewGame = (settings) => {
    const newGameId = crypto.randomUUID();
    
    id.value = newGameId;
    isSetupComplete.value = true;
    
    navigateTo(`/game/${newGameId}`);
  }

  return {
    setupNewGame
  }
}