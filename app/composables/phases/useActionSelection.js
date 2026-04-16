import { useGameStore } from '~/store/game.js';
import { useAppStore } from '~/store/app';
import { storeToRefs } from 'pinia';
import { useLogger } from '~/composables/game/useLogger';

export const useActionSelection = () => {
  const appStore = useAppStore();
  const store = useGameStore();
  const { activePlayer, players } = storeToRefs(store);
  const { addLog, addActions } = useLogger();

  const runActionSelection = () => {
    store.selectedAction = null;

    if (activePlayer.value.type === 'ai') {
      // handleAISelection() - логику весов внедрим позже
      return;
    }

    const actions = getAvailableActions();
    addActions('action-selection', 'Выберите действие:', actions);
  };

  const getAvailableActions = () => {
    const allActions = appStore.glossary?.meta?.actions || [];

    return allActions
      .filter(action => {
        if (action.id === 'attack') return canAttack();
        if (action.id === 'effect') return hasCardType('effect');
        return true;
      })
      .map(action => ({
        text: action.name,
        action: () => finishActionSelection(action.id),
      }));
  };

  const canAttack = () => {
    const attackCards = appStore.glossary?.meta?.cards
      .filter(i => i.actions.includes('attack'))
      .map(i => i.id);
    if (!hasCardType(attackCards)) return false;

    const enemies = players.value
      .filter(p => p.id !== activePlayer.value.id)
      .flatMap(p => p.fighters);

    return activePlayer.value.fighters.some(fighter => {
      const canPlayCard = activePlayer.value.hand.some(
        card => card.fighter === fighter.id || card.fighter === 'any',
      );
      if (!canPlayCard) return false;

      return enemies.some(enemy => isTargetInRange(fighter, enemy));
    });
  };

  const isTargetInRange = (fighter, enemy) => {
    const fighterNode = store.map.nodes.find(n => n.id === fighter.position);
    const enemyNode = store.map.nodes.find(n => n.id === enemy.position);
    if (!fighterNode || !enemyNode) return false;

    if (fighter.attackType === 'ranged') {
      return fighterNode.zones.some(z => enemyNode.zones.includes(z));
    }
    const range = fighter.attackRange || 1;
    const isAdjacent = checkPathDistance(fighterNode.id, enemyNode.id, range);

    if (isAdjacent) return true;

    if (fighter.attackType === 'ranged') {
      return fighterNode.zones.some(z => enemyNode.zones.includes(z));
    }
  };

  const checkPathDistance = (startId, targetId, maxDist) => {
    if (startId === targetId) return false;
    let queue = [{ id: startId, dist: 0 }];
    let visited = new Set([startId]);

    while (queue.length > 0) {
      let { id, dist } = queue.shift();
      if (dist >= maxDist) continue;

      const node = store.map.nodes.find(n => n.id === id);
      for (const neighborId of node?.neighbors || []) {
        if (String(neighborId) === String(targetId)) return true;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, dist: dist + 1 });
        }
      }
    }
    return false;
  };

  const hasCardType = types => {
    const typeArray = Array.isArray(types) ? types : [types];
    return activePlayer.value.hand.some(card => typeArray.includes(card.type));
  };

  const finishActionSelection = actionId => {
    store.selectedAction = actionId;
    addLog(`Игрок ${activePlayer.value.name} выбрал действие ${store.selectedActionName}`, 'info');
    if (actionId === 'movement') store.goToPhase('CARDS_DRAW');
    else if (actionId === 'attack') store.goToPhase('TARGET_SELECTION');
    else if (actionId === 'effect') store.goToPhase('SCHEME_SELECTION');
  };

  return { runActionSelection };
};
