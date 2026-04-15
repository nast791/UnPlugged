import { useGameSetup } from "./useGameSetup";
import { useGameInit } from "./useGameInit";
import { useUnitPlacement } from "./useUnitPlacement";

export const useGamePhases = () => {
  const setup = useGameSetup();
  const init = useGameInit();
  const placement = useUnitPlacement();

  return {
    ...setup,
    ...init,
    ...placement,
  };
};