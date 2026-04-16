import { useGameSetup } from "./useGameSetup";
import { useGameInit } from "./useGameInit";
import { useUnitPlacement } from "./useUnitPlacement";
import { useGameStart } from "./useGameStart";
import { useTurnStart } from "./useTurnStart";
import { useActionSelection } from "./useActionSelection";
import { useCardsDraw } from "./useCardsDraw";
import { useExhaustion } from "./useExhaustion";
import { useMovement } from "./useMovement";
import { useGameOver } from "./useGameOver";

export const useGamePhases = () => {
  const setup = useGameSetup();
  const init = useGameInit();
  const placement = useUnitPlacement();
  const startGame = useGameStart();
  const startTurn = useTurnStart();
  const selectAction = useActionSelection();
  const drawCards = useCardsDraw();
  const exhaustion = useExhaustion();
  const movement = useMovement();
  const endGame = useGameOver();

  return {
    ...setup,
    ...init,
    ...placement,
    ...startGame,
    ...startTurn,
    ...selectAction,
    ...drawCards,
    ...exhaustion,
    ...movement,
    ...endGame,
  };
};