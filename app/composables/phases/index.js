import { useGameSetup } from "./useGameSetup";
import { useGameInit } from "./useGameInit";
import { useUnitPlacement } from "./useUnitPlacement";
import { useGameStart } from "./useGameStart";
import { useTurnStart } from "./useTurnStart";

export const useGamePhases = () => {
  const setup = useGameSetup();
  const init = useGameInit();
  const placement = useUnitPlacement();
  const startGame = useGameStart();
  const startTurn = useTurnStart();

  return {
    ...setup,
    ...init,
    ...placement,
    ...startGame,
    ...startTurn,
  };
};