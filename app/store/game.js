import { defineStore } from 'pinia';
import useGameFactory from '~/composables/useGameFactory';

export const useGameStore = defineStore('game', {
  state: () => ({
    player: null,
    ai: null,
    map: null,
    isGameStarted: false,
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
      
      if (p1Node) this.player = createFighter(player, p1Node.id);
      if (p2Node) this.ai = createFighter(ai, p2Node.id);
    
      this.isGameStarted = true;
    }
  }
});