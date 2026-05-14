import { useGameStart } from "./useGameStart";
import { useTurnStart } from "./useTurnStart";
import { useActionSelection } from "./useActionSelection";
import { useExhaustion } from "./useExhaustion";
import { useMovement } from "./useMovement";
import { useActionEnd } from "./useActionEnd";
import { useTurnEnd } from "./useTurnEnd";
import { useGameOver } from "./useGameOver";

export const useGamePhases = () => {
  const startGame = useGameStart();
  const startTurn = useTurnStart();
  const selectAction = useActionSelection();
  const exhaustion = useExhaustion();
  const movement = useMovement();
  const endAction = useActionEnd();
  const endTurn = useTurnEnd();
  const endGame = useGameOver();

  return {
    ...startGame,
    ...startTurn,
    ...selectAction,
    ...exhaustion,
    ...movement,
    ...endAction,
    ...endTurn,
    ...endGame,
  };
};