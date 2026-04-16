import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';
import { useCardsDiscard } from '~/composables/phases/useCardsDiscard';

export const useMovement = () => {
  const store = useGameStore();
  const { activePlayer, players, map, bonusMovement } = storeToRefs(store);
  const { addLog, addActions } = useLogger();
  const { returnCardsToHand } = useCardsDiscard();

  const hasAnyoneMoved = computed(() => 
    activePlayer.value.fighters.some(f => f.position !== f.startPosition)
  );

  const runMovement = () => {
    activePlayer.value.fighters.forEach(f => f.startPosition = f.position);
    updateMovement();
  };

  const getAvailableCells = (fighter) => {
    const totalRange = 
    (fighter.move || 0) + 
    (fighter.bonusMovement || 0) + 
    (bonusMovement.value || 0);

    const visited = new Set([String(fighter.position)]);
    const queue = [{ id: String(fighter.position), dist: 0 }];
    const available = [];

    const enemyPositions = players.value
      .filter(p => p.id !== activePlayer.value.id)
      .flatMap(p => p.fighters.map(f => String(f.position)));

    const allOccupied = players.value.flatMap(p => p.fighters.map(f => String(f.position)));

    while (queue.length > 0) {
      const { id, dist } = queue.shift();
      
      if (dist > 0 && !allOccupied.includes(id)) {
        available.push(id);
      }

      if (dist >= totalRange) continue;

      const node = map.value.nodes.find(n => String(n.id) === id);
      if (!node) continue;

      node.neighbors.forEach(nId => {
        const neighborId = String(nId);
        if (visited.has(neighborId)) return;

        const isEnemy = enemyPositions.includes(neighborId);
        if (!isEnemy || fighter.canPassThroughEnemies) {
          visited.add(neighborId);
          queue.push({ id: neighborId, dist: dist + 1 });
        }
      });
    }
    return available;
  };

  const updateMovement = () => {
    const options = [];

    if (!hasAnyoneMoved.value) {
      const bonusText = store.bonusMovementCardId ? 'Отмена бонуса' : 'Бонус к движению';
      options.push({ 
        text: bonusText, 
        action: () => {
          if (store.bonusMovementCardId) {
            cancelMovementBonus();
          } else {
            store.goToPhase('CARDS_DISCARD');
          }
        } 
      });
    } else {
      options.push({ text: 'Вернуть всех назад', action: resetAllPositions });
    }
    options.push({ text: 'Закончить действие', action: () => store.goToPhase('ACTION_END') });

    addActions('move-controls', 'Переместите бойцов или завершите действие', options);
  };

  const cancelMovementBonus = () => {
    if (store.bonusMovementCardId) {
      returnCardsToHand(store.bonusMovementCardId);
      store.bonusMovementCardId = null;
      store.bonusMovement = 0;
    }
    updateMovement();
  };

  const resetAllPositions = () => {
    activePlayer.value.fighters.forEach(f => {
      f.position = f.startPosition;
      f.active = false;
    });
    updateMovement();
  };

  return { runMovement, updateMovement, getAvailableCells };
};