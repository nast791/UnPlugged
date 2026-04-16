import { useGameStore } from '~/store/game.js';
import { useAppStore } from '~/store/app';
import { useLogger } from '~/composables/game/useLogger';
import { useCardsDiscard } from '~/composables/phases/useCardsDiscard';

export const useActionEnd = () => {
  const { clearMovementBonus } = useCardsDiscard;
  
  const runActionEnd = () => {

  };

  return { runActionEnd };
}