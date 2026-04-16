import { defineStore } from 'pinia';
import { useAppStore } from '~/store/app.js';
import GAME_PHASES from '#shared/constants/phases';

export const useGameStore = defineStore('game', {
  state: () => ({
    id: null,
    phase: null,
    map: null,
    activePlayerIndex: 0,
    players: [],
    timer: 0,
    turn: 0,
    round: 0,
    selectedAction: null,
    selectedCardId: null,
    bonusMovement: 0,
    bonusMovementCardId: null,
    discardLimit: 0,
    selectedUnitId: null,
    history: [],
    winner: null
  }),
  getters: {
    activePlayer: state => state.players?.find(i => i.index === state.activePlayerIndex),
    isActivePlayerHuman: state => {
      const { glossary } = storeToRefs(useAppStore());
      const human = glossary.value?.meta?.players?.[0]?.id;
      return state.activePlayer?.type === human;
    },
    selectedActionName: state => {
      const { glossary } = storeToRefs(useAppStore());
      return (
        glossary.value?.meta?.actions?.find(i => i.id === state.selectedAction)?.name || ''
      );
    },
  },
  actions: {
    goToPhase(targetPhaseId) {
      const nextPhase = GAME_PHASES.find(i => i.id === targetPhaseId);
      const currentPhase = this.phase ? GAME_PHASES.find(i => i.id === this.phase) : null;

      if (currentPhase?.next.includes(targetPhaseId) || nextPhase.start) {
        this.phase = targetPhaseId;
      } else {
        console.error('Ошибка перехода');
      }
    },
  },
  // persist: [
  //   {
  //     paths: ['id', 'phase'],
  //     storage: persistedState.cookies, // Сервер увидит эти данные сразу
  //   },
  //   {
  //     paths: ['players', 'history', 'map', 'intent'],
  //     storage: persistedState.localStorage, // Тяжелые данные только в браузере
  //   }
  // ]
});
