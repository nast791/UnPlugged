import { useGameStore } from '~/store/game.js';
import useLogger from '~/composables/game/useLogger';

export default function () {
  const { activePlayer, players, map, activePlayerIndex, isGameStarted, turn, timer, phase } =
    storeToRefs(useGameStore());
  const { addLog } = useLogger();

  const startPlacement = () => {
    if (activePlayer.value.type !== 'ai') {
      addLog(`Игрок ${activePlayer.value.index}: расставьте своих бойцов на поле`, 'info');
    } else {
      addLog(`Игрок ${activePlayer.value.index} расставляет силы...`, 'info');
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

    finishPlacement();
  };

  const checkPlacementStatus = () => {
    const currentPlayerDone = activePlayer.value.fighters.every(f => f.position !== null);

    if (currentPlayerDone) {
      addLog(
        `Все бойцы игрока ${activePlayer.value.index} расставлены. Подтвердите готовность`,
        'action',
        activePlayer.value.type !== 'ai'
          ? [{ text: 'Завершить расстановку', action: finishPlacement }]
          : null,
        activePlayer.value.type !== 'ai' ? `${phase.value}-${activePlayer.value.id}-ready` : null
      );
    }
  };

  const finishPlacement = itemLog => {
    if (itemLog) itemLog.clicked = true;
    addLog(`Игрок ${activePlayer.value.index} завершил расстановку`, 'system');
    if (activePlayerIndex.value < players.value.length) {
      activePlayerIndex.value++;
      startPlacement();
    } else {
      activePlayerIndex.value = 1;
      isGameStarted.value = true;
      turn.value = 1;
      addLog('Все бойцы на позициях. Битва начинается!', 'system');
      startTimer();
    }
  };

  const timerInterval = ref(null);

  const startTimer = () => {
    stopTimer();

    timerInterval.value = setInterval(() => {
      timer.value++;
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  };

  onUnmounted(stopTimer);

  const formattedTime = computed(() => {
    const hours = Math.floor(timer.value / 3600);
    const minutes = Math.floor((timer.value % 3600) / 60);
    const seconds = timer.value % 60;

    return [hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join(':');
  });

  return { placeUnit, availableSpawnPoints, startPlacement, formattedTime };
}
