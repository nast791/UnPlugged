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
    
      if (!map.nodes || map.nodes.length === 0) {
        this.player = null;
        this.ai = null;
        this.isGameStarted = true;
        return;
      }
    
      const p1Node = map.nodes.find(n => n.start === 'p1');
      const p2Node = map.nodes.find(n => n.start === 'p2');
      
      if (p1Node) this.player = createFighter(player, p1Node.id);
      if (p2Node) this.ai = createFighter(ai, p2Node.id);
    
      this.isGameStarted = true;
    }
  }
});