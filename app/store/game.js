import { defineStore } from 'pinia';
import { useAppStore } from '~/store/app.js';

export const useGameStore = defineStore('game', {
  state: () => ({
    id: null,
    phase: null,
    isPhaseAction: false,
    map: null,
    isGameStarted: false,
    activePlayerIndex: 0,
    players: [],
    timer: 0,
    turn: 0,
    intent: {
      selectedAction: null,
      selectedCardId: null,
      selectedUnitId: null, 
      targets: [], 
      movementBonus: 0,
      canPassThroughEnemies: false
    },
    history: [],
  }),
  getters: {
    activePlayer: state => state.players?.find(i => i.index === state.activePlayerIndex),
    selectedActionName: state => {
      const { glossary } = storeToRefs(useAppStore());
      return glossary.value?.meta?.actions?.find(i => i.id === state.intent.selectedAction)?.name || '';
    }
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
