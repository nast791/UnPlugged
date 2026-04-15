import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';

export const useUnitPlacement = () => {
  const store = useGameStore();
  const { activePlayer, activePlayerIndex, players, isActivePlayerHuman, map } = storeToRefs(store);
  const { addActions, addLog } = useLogger();

  const runUnitPlacement = () => {
    if (isActivePlayerHuman.value) {
      addLog(`Игрок ${activePlayer.value.name}: расставьте бойцов`, 'info');
    } else {
      addLog(`Игрок ${activePlayer.value.name} расставляет силы...`, 'info');
      autoPlaceAI();
    }
  };

  const availableSpawnPoints = computed(() => {
    const heroStartNode = map.value?.nodes?.find(i => i.position === activePlayer.value.index);
    if (!heroStartNode) return { hero: null, assistants: [] };
    const zoneColors = heroStartNode.zones || [];

    const assistantsNodes = map.value?.nodes
      ?.filter(i => {
        const hasZone = i.zones.some(color => zoneColors.includes(color));
        const isNotHeroNode = i.id !== heroStartNode.id;
        const isOccupied = players.value.some(p => p.fighters.some(f => f.position === i.id));

        return hasZone && isNotHeroNode && !isOccupied;
      })
      .map(i => i.id);

    return {
      hero: [heroStartNode.id],
      assistant: assistantsNodes,
    };
  });

  const placeUnit = (unitId, circleId) => {
    const unit = activePlayer.value.fighters.find(i => i.id === unitId);
    const isOccupied = players.value.some(p => p.fighters.some(f => f.position === circleId));

    if (unit && !isOccupied && availableSpawnPoints.value?.[unit.type]?.includes(circleId)) {
      unit.position = circleId;
      addLog(`${unit.name} выставлен на позицию ${circleId}`, 'info');
      checkPlacementStatus();
    }
  };

  const autoPlaceAI = () => {
    const fighters = activePlayer.value.fighters;

    const hero = fighters.find(f => f.type === 'hero');
    if (hero && availableSpawnPoints.value.hero.length > 0) {
      const startPoint = availableSpawnPoints.value.hero[0];
      placeUnit(hero.id, startPoint);
    }

    const assistants = fighters.filter(f => f.type === 'assistant');

    assistants.forEach(assistant => {
      const possiblePoints = availableSpawnPoints.value.assistant;

      if (possiblePoints.length > 0) {
        const randomPoint = possiblePoints[Math.floor(Math.random() * possiblePoints.length)];
        placeUnit(assistant.id, randomPoint);
      }
    });

    finishUnitPlacement();
  };

  const checkPlacementStatus = () => {
    const isDone = activePlayer.value.fighters.every(f => f.position !== null);
    if (!isDone) return;

    if (isActivePlayerHuman.value) {
      addActions(
        'placement-finish',
        `Бойцы игрока ${activePlayer.value.name} расставлены. Подтвердите готовность`,
        [{ text: 'Завершить расстановку', action: finishUnitPlacement }],
      );
    } else {
      finishUnitPlacement();
    }
  };

  const finishUnitPlacement = () => {
    addLog(`Игрок ${activePlayer.value.name} завершил расстановку`, 'info');

    if (activePlayerIndex.value < players.value.length) {
      activePlayerIndex.value++;
      runUnitPlacement();
    } else {
      store.goToPhase('GAME_START');
    }
  };

  return { availableSpawnPoints, placeUnit, runUnitPlacement };
};
