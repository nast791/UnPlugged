import GAME_PHASES from '#shared/constants/phases';
import { useGameStore } from '@/store/game';

export const useCurrentPhase = () => {
  const store = useGameStore();
  
  const currentConfig = computed(() => 
    GAME_PHASES.find(p => p.id === store.phase)
  );

  const canDrag = computed(() => !!currentConfig.value?.allowFighterDrag);
  const description = computed(() => currentConfig.value?.description || '');

  return {
    config: currentConfig,
    canDrag,
    description
  };
};