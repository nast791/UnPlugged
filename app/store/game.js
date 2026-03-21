import { defineStore } from 'pinia';
import useGameFactory from '~/composables/game/useGameFactory';
import PLAYER_ACTIONS from '#shared/constants/actions';

export const useGameStore = defineStore('game', {
  state: () => ({
    id: null,
    phase: null,
    isPhaseAction: false,
    isSetupComplete: false,
    map: null,
    isGameStarted: false,
    isGameInitialized: false,
    activePlayerIndex: 0,
    players: [],
    timer: '00:00',
    turn: 1,
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
  persist: [
    {
      paths: ['gameId', 'phase'],
      storage: persistedState.cookies, // Сервер увидит эти данные сразу
    },
    {
      paths: ['players', 'history', 'map', 'intent'],
      storage: persistedState.localStorage, // Тяжелые данные только в браузере
    }
  ],
  actions: {
    initGame({ player, ai, map }) {
      const { createFighter, createMap } = useGameFactory();
      this.map = createMap(map);

      if (!this.map.nodes || this.map.nodes.length === 0) {
        this.player = null;
        this.ai = null;
        this.isGameStarted = true;
        return;
      }

      const p1Node = this.map.nodes.find(i => i.position === 1);
      const p2Node = this.map.nodes.find(i => i.position === 2);

      if (p1Node) this.players.push({ ...createFighter(player, p1Node.id, 'player'), index: 1 });
      if (p2Node) this.players.push({ ...createFighter(ai, p2Node.id, 'ai'), index: 2 });

      this.isGameStarted = true;
      this.activePlayerIndex = 1;
    },
  },
});
