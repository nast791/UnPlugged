import { useGameSetup } from "./useGameSetup";
import { useGameInit } from "./useGameInit";

export const useGamePhases = () => {
  const setup = useGameSetup();
  const init = useGameInit();

  return {
    ...setup,
    ...init,
  };
};