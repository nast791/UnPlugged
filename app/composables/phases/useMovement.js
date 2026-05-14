import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';
import { useDeck } from '~/composables/game/useDeck';

export const useMovement = () => {
  const store = useGameStore();
  const { activePlayer, players, map, bonusMovement } = storeToRefs(store);
  const { addLog, addActions } = useLogger();
  const { returnToHand, confirmDiscard, toggleCardReversed } = useDeck();

  const hasAnyoneMoved = computed(() =>
    activePlayer.value.fighters.some(f => f.position !== f.startPosition),
  );

  const runMovement = () => {
    activePlayer.value.fighters.forEach(f => (f.startPosition = f.position));
    updateMovement();
  };

  const getAvailableCells = fighter => {
    const totalRange =
      (fighter.move || 0) + (fighter.bonusMovement || 0) + (bonusMovement.value || 0);

    const visited = new Set([String(fighter.startPosition)]);
    const queue = [{ id: String(fighter.startPosition), dist: 0 }];
    const available = [];

    const enemyPositions = players.value
      .filter(p => p.id !== activePlayer.value.id)
      .flatMap(p => p.fighters.map(f => String(f.position)));

    const allOccupied = players.value.flatMap(p => p.fighters.map(f => String(f.position)));

    while (queue.length > 0) {
      const { id, dist } = queue.shift();
      const isOccupiedByOther = allOccupied.includes(id) && id !== String(fighter.position);

      if (dist > 0 && !isOccupiedByOther) {
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

    if (!available.includes(String(fighter.startPosition))) {
      available.push(String(fighter.startPosition));
    }

    return available;
  };

  const updateMovement = () => {
    const options = [];
    let title = 'Переместите бойцов или завершите действие';

    if (!hasAnyoneMoved.value) {
      if (store.bonusMovementCardId) {
        options.push({ text: 'Отмена бонуса', action: cancelMovementBonus });
      } else {
        title = 'Кликните по карте в руке для бонуса к движению или переместите бойцов или завершите действие';
      }
    } else {
      options.push({ text: 'Вернуть всех назад', action: resetAllPositions });
    }
    options.push({ text: 'Закончить действие', action: () => store.goToPhase('ACTION_END') });

    addActions('move-controls', title, options);
  };

  const cancelMovementBonus = () => {
    if (store.bonusMovementCardId) {
      returnToHand(store.bonusMovementCardId);
      clearMovementBonus();
    }
    updateMovement();
    activePlayer.value.fighters.forEach(f => {
      f.position = f.startPosition;
      f.active = false;
    });

    addLog(`Бонус отменен, бойцы вернулись на исходные позиции`, 'info');
    updateMovement();
  };

  const clearMovementBonus = () => {
    store.bonusMovementCardId = null;
    store.bonusMovement = 0;
  };

  const resetAllPositions = () => {
    activePlayer.value.fighters.forEach(f => {
      f.position = f.startPosition;
      f.active = false;
    });
    updateMovement();
  };

  const selectFighter = fighter => {
    if (!activePlayer.value.fighters?.find(i => i.id === fighter.id)) {
      addLog('Вы не можете ходить чужим бойцом', 'danger');
      return [];
    }
    activePlayer.value.fighters.filter(i => i.id !== fighter.id).forEach(i => (i.active = false));
    fighter.active = !fighter.active;
    return getAvailableCells(fighter);
  };

  const moveFighter = nodeId => {
    const fighter = activePlayer.value.fighters.find(f => f.active);
    if (!fighter) return;
    const reversedCard = activePlayer.value.hand.find(i => i.isReversed);
    if (reversedCard) reversedCard.isReversed = false;
    fighter.position = nodeId;
    addLog(`${fighter.name} переместился на клетку ${nodeId}`, 'info');
    fighter.active = false;
    updateMovement();
  };

  const selectCard = card => {
    if (store.bonusMovementCardId) return;
    const success = toggleCardReversed(card, 1);
    if (success) {
      if (card.isReversed) {
        confirmBonus(card);
      } else {
        addLog(`Бонус к движению отменен.`, 'info');
      }
    }
  };

  const confirmBonus = card => {
    addActions('move-bonus-confirm', `Применить бонус +${card.bonus}?`, [
      {
        text: 'Подтвердить бонус',
        action: () => {
          store.bonusMovementCardId = card.id;
          store.bonusMovement = card.bonus || 0;
          confirmDiscard();
          activePlayer.value.fighters?.forEach(i => (i.active = false));
          addLog(`Маневр усилен на +${store.bonusMovement}`, 'info');
          updateMovement();
        },
      },
      {
        text: 'Отмена',
        action: () => {
          card.isReversed = false;
          store.bonusMovement = 0;
          updateMovement();
        },
      },
    ]);
  };

  return {
    runMovement,
    updateMovement,
    getAvailableCells,
    moveFighter,
    selectFighter,
    clearMovementBonus,
    selectCard,
  };
};
