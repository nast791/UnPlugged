import { useGameStore } from '~/store/game.js';

export default function () {
  const store = useGameStore();

  // Доступные кружки для текущего игрока (например, зоны 1 и 2)
  const getAvailableSpawnPoints = () => {
    const spawnZones = store.map.spawnZones; // Допустим, ['z1', 'z2']
    return spawnZones[store.activePlayerIndex].circles; // Массив ID кружков
  };

  const placeUnit = (unitId, circleId) => {
    const player = store.activePlayer;
    const unit = player.units.find(u => u.id === unitId);
    
    // Проверка: не занят ли кружок
    const isOccupied = store.players.some(p => p.units.some(u => u.position === circleId));
    
    if (unit && !isOccupied) {
      unit.position = circleId;
      store.addLog(`${unit.name} выставлен на позицию ${circleId}`, 'info');
      
      checkPlacementStatus();
    }
  };

  const checkPlacementStatus = () => {
    // Если все бойцы всех игроков имеют position !== null
    const allPlaced = store.players.every(p => p.units.every(u => u.position !== null));
    if (allPlaced) {
      store.isPlacementComplete = true;
      store.addLog('Все бойцы расставлены. Битва начинается!', 'system');
    }
  };

  return { placeUnit, getAvailableSpawnPoints };
};