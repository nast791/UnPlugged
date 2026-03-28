import { defineStore } from 'pinia';
import PLAYER_ACTIONS from '#shared/constants/actions';

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
    },
    history: [],
  }),
  getters: {
    activePlayer: state => state.players?.find(i => i.index === state.activePlayerIndex),
    selectedActionName: state =>
      PLAYER_ACTIONS[state.intent.selectedAction]?.name || '',
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
