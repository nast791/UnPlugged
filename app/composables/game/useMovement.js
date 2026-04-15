import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';

export default function () {
  const { map, activePlayer, intent, players } = storeToRefs(useGameStore());
  const { addLog } = useLogger();

  const getAllFightersPositions = () => {
    const positions = [];
    players.value?.forEach(player => {
      player.fighters.forEach(f => {
        positions.push({ pos: f.position, ownerId: player.id })
      })
    })
    return positions;
  }

  const getReachableCells = (startId, range, canPassThroughEnemies = false) => {
    let visited = new Set([startId]);
    let reachable = [];
    let queue = [{ id: startId, dist: 0 }];

    const allPositions = getAllFightersPositions()
    const activePlayerId = activePlayer.value.id;

    while (queue.length > 0) {
      const { id, dist } = queue.shift();
      if (dist > 0) reachable.push(id);

      if (dist < range) {
        const cell = map.value?.circles?.find(i => i.id === id);
        if (cell && cell.neighbors) {
          cell.neighbors.forEach(neighborId => {
            if (!visited.has(neighborId)) {
              const occupant = allPositions.find(p => p.pos === neighborId);
              const isEnemyHere = occupant && occupant.ownerId !== activePlayerId;

              if (!isEnemyHere || canPassThroughEnemies) {
                visited.add(neighborId);
                queue.push({ id: neighborId, dist: dist + 1 });
              }
            }
          })
        }
      }
    }
    return reachable;
  };

  const availableCells = computed(() => {
    const fighter = activePlayer.value.fighters.find(f => f.active);
    if (!fighter) return [];
    const canPass = intent.value.canPassThroughEnemies || false;
    const totalRange = fighter.move + (intent.value.movementBonus || 0);
    return getReachableCells(fighter.position, totalRange, canPass);
  });

  const executeMove = (cellId) => {
    const fighter = activePlayer.value.fighters.find(f => f.active);
    if (!fighter) return;
    const isOccupied = getAllFightersPositions().some(p => p.pos === cellId);
    
    if (!isOccupied) {
      fighter.position = cellId;
      fighter.acted = true;
    } else {
      addLog('Клетка занята, остановиться нельзя', 'error');
    }
  }

  return { availableCells, executeMove };
}
