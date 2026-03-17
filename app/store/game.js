import { defineStore } from 'pinia';
import useGameFactory from '~/composables/useGameFactory';

export const useGameStore = defineStore('game', {
  state: () => ({
    map: null,
    isGameStarted: false,
    players: [],
    timer: '00:00',
    round: 1
  }),
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

      if (p1Node) this.players.push(createFighter(player, p1Node.id, 'player'));
      if (p2Node) this.players.push(createFighter(ai, p2Node.id, 'ai'));
    
      this.isGameStarted = true;
    }
  }
});