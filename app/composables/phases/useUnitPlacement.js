import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';
import { useGlobalDrag } from '~/composables/game/useGlobalDrag';

export const useUnitPlacement = () => {
  const store = useGameStore();
  const { activePlayer, activePlayerIndex, players, isActivePlayerHuman, map } = storeToRefs(store);
  const { addActions, addLog } = useLogger();
  const { dragItem } = useGlobalDrag();

  const runUnitPlacement = () => {
    if (isActivePlayerHuman.value) {
      addLog(`Игрок ${activePlayer.value.name}: расставьте бойцов`, 'info');
    } else {
      addLog(`Игрок ${activePlayer.value.name} расставляет силы...`, 'info');
      autoPlaceAI();
    }
  };

  const getAvailablePoints = (fighter = null) => {
    const targetUnit = fighter || dragItem.value;
    if (!targetUnit) return { hero: [], assistant: [] };

    const heroStartNode = map.value?.nodes?.find(i => i.position === activePlayer.value.index);
    if (!heroStartNode) return { hero: [], assistant: [] };

    const zoneColors = heroStartNode.zones || [];

    const assistantsNodes = map.value?.nodes
      ?.filter(i => {
        const hasZone = i.zones.some(color => zoneColors.includes(color));
        const isNotHeroNode = i.id !== heroStartNode.id;
        const isOccupied = players.value.some(p =>
          p.fighters.some(f => f.position === i.id && f.id !== targetUnit.id),
        );

        return hasZone && isNotHeroNode && !isOccupied;
      })
      .map(i => i.id);

    return {
      hero: [heroStartNode.id],
      assistant: assistantsNodes,
    };
  };

  const availableSpawnPoints = computed(() => getAvailablePoints());

  const placeUnit = (unitId, circleId) => {
    const unit = activePlayer.value.fighters.find(i => i.id === unitId);
    if (!unit) return;

    const points = getAvailablePoints(unit);
    const isOccupied = players.value.some(p => p.fighters.some(f => f.position === circleId));

    if (!isOccupied && points[unit.type]?.includes(circleId)) {
      unit.position = circleId;
      addLog(`${unit.name} выставлен на позицию ${circleId}`, 'info');
      checkPlacementStatus();
    }
  };

  const autoPlaceAI = () => {
    const fighters = activePlayer.value.fighters;

    const hero = fighters.find(f => f.type === 'hero');
    const heroPoints = getAvailablePoints(hero).hero;

    if (hero && heroPoints.length > 0) {
      const startPoint = heroPoints[0];
      placeUnit(hero.id, startPoint);
    }

    const assistants = fighters.filter(f => f.type === 'assistant');

    assistants.forEach(assistant => {
      const assistantPoints = getAvailablePoints(assistant).assistant;

      if (assistantPoints.length > 0) {
        const randomPoint = assistantPoints[Math.floor(Math.random() * assistantPoints.length)];
        placeUnit(assistant.id, randomPoint);
      }
    });
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
