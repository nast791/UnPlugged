import { defineStore } from 'pinia';

import { ACTION_LABELS } from '#shared/constants/actions';
import { GAME_PHASES } from '#shared/constants/phases';
import { PLAYER_TYPES } from '#shared/constants/playerTypes';



export const useGameStore = defineStore('game', {

  state: () => ({

    selectedMap: null,

    selectedPlayers: [],

    localPlayerId: '0',

    activeSetupData: null,



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

    selectedUnitId: null,

    history: [],

    winner: null,

  }),

  getters: {

    activePlayer: state => state.players?.find(i => i.index === state.activePlayerIndex),

    isActivePlayerHuman: state => state.activePlayer?.type === PLAYER_TYPES.HUMAN.id,

    selectedActionName: state => ACTION_LABELS[state.selectedAction] || '',

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

});

