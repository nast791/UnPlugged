import { useGameStore } from '~/store/game.js';

export default function () {
  const { id } = storeToRefs(useGameStore());

  const setupNewGame = () => {
    const newGameId = crypto.randomUUID();
    id.value = newGameId;
    navigateTo(`/game/${newGameId}`);
  }

  return {
    setupNewGame
  }
}