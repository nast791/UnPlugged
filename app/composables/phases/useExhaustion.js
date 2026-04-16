import { useGameStore } from '~/store/game.js';
import { storeToRefs } from 'pinia';
import { useLogger } from '~/composables/game/useLogger';
import { useGameOver } from '~/composables/phases/useGameOver';

export const useExhaustion = () => {
  const store = useGameStore();
  const { activePlayer } = storeToRefs(store);
  const { addLog } = useLogger();
  const { checkGameOver } = useGameOver();

  const livingHeroes = computed(() => activePlayer.value?.fighters?.filter(f => f.type === 'hero' && f.hp > 0) || []);

  const runExhaustion = () => {
    const player = activePlayer.value;
    if (!player) return;

    addLog(`Колода ${player.name} пуста! Срабатывает эффект истощения.`, 'danger');

    livingHeroes.value.forEach(hero => {
      const damage = 2;
      hero.hp = Math.max(0, hero.hp - damage);
      
      addLog(`Герой ${hero.name} получает ${damage} урона от истощения! (Осталось HP: ${hero.hp})`, 'danger');

      if (hero.hp <= 0) {
        hero.hp = 0;
        addLog(`${hero.name} пал в бою!`, 'danger');
      }
    });

    if (checkGameOver()) return;

    if (livingHeroes.value?.length === 0) {
      addLog(`Все герои игрока ${player.name} пали.`, 'danger');
      return store.goToPhase('TURN_START');
    }

    if (store.selectedAction === 'movement') {
      return store.goToPhase('MOVEMENT');
    }

    return store.goToPhase('TURN_START');
  };

  return { runExhaustion };
};