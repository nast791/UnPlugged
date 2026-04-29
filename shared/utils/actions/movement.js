import { activePlayer, addLog } from "#shared/utils/actions/utils";
import { INVALID_MOVE } from 'boardgame.io/core';

export const getAvailableCells = ({G, ctx, fighterId}) => {
  const player = activePlayer({ G, ctx });
  const fighter = player.fighters.find(f => f.id === fighterId);
  if (!fighter) return [];

  const totalRange = (fighter.moveValue || 0) + (G.boostValue || 0);
  const startPos = String(fighter.position);
  
  const queue = [{ id: startPos, dist: 0 }];
  const visited = new Set([startPos]);
  const available = [];

  const enemyPositions = G.players
    .filter(p => p.id !== ctx.currentPlayer)
    .flatMap(p => p.fighters.map(f => String(f.position)));

  const allOccupied = G.players.flatMap(p => p.fighters.map(f => String(f.position)));

  while (queue.length > 0) {
    const { id, dist } = queue.shift();
    
    const isOccupiedByOther = allOccupied.includes(id) && id !== startPos;
    if (dist > 0 && !isOccupiedByOther) {
      available.push(id);
    }

    if (dist >= totalRange) continue;

    const node = G.map.circles.find(n => String(n.id) === id);
    if (!node) continue;

    node.neighbors.forEach(neighborId => {
      const nId = String(neighborId);
      if (visited.has(nId)) return;

      const isEnemy = enemyPositions.includes(nId);
      if (!isEnemy || fighter.canPassThroughEnemies) {
        visited.add(nId);
        queue.push({ id: nId, dist: dist + 1 });
      }
    });
  }
  return available;
};

export const updateMovementUI = ({G, ctx}) => {
  const player = activePlayer({ G, ctx });
  const hasMoved = player.fighters.some(f => f.position !== f.startPosition);
  
  const actions = [];
  if (!G.bonusCardId && !hasMoved) {
    addLog(G, `Вы можете выбрать карту для усиления или начать движение`);
  }

  if (G.bonusCardId && !hasMoved) {
    actions.push({ id: 'cancel-bonus', text: 'Отменить усиление', action: 'cancelBonus' });
  }

  if (hasMoved) {
    actions.push({ id: 'reset', text: 'Вернуть всех назад', action: 'resetPositions' });
  }
  actions.push({ id: 'confirm', text: 'Завершить движение', action: 'confirmMovement' });
  
  G.pendingActions = actions;
};

export const applyBonus = ({ G, ctx, cardId }) => {
  const player = activePlayer({ G, ctx });
  const card = player.hand.find(c => c.id === cardId);
  
  if (!card || G.bonusCardId) return INVALID_MOVE;

  G.bonusValue = card.bonus || 0;
  G.bonusCardId = cardId;
  
  addLog(G, `${player.name} выбирает бонус движения +${G.bonusValue}`);
  updateMovementUI({G, ctx});
};

export const cancelBonus = ({ G, ctx }) => {
  const player = activePlayer({ G, ctx });
  G.bonusValue = 0;
  G.bonusCardId = null;
  
  addLog(G, `${player.name} отменил бонус к движению`);
  updateMovementUI({G, ctx});
};

export const resetPositions = ({ G, ctx }) => {
  const player = activePlayer({ G, ctx });
  player.fighters.forEach(f => f.position = f.startPosition);
  addLog(G, `Бойцы вернулись на исходные позиции`);
  updateMovementUI({G, ctx});
};

export const moveFighter = ({ G, ctx, fighterId, targetId }) => {
  const player = activePlayer({ G, ctx });
  const fighter = player.fighters.find(f => f.id === fighterId);
  const available = getAvailableCells({G, ctx, fighterId});

  if (!available.includes(String(targetId))) return INVALID_MOVE;

  fighter.position = targetId;
  addLog(G, `${fighter.name} переместился на ${targetId}`);
  updateMovementUI({G, ctx});
};

export const confirmMovement = ({ G, ctx, events }) => {
  const player = activePlayer({ G, ctx });
  
  if (G.bonusCardId) {
    const cardIdx = player.hand.findIndex(c => c.id === G.bonusCardId);
    if (cardIdx !== -1) {
      const [card] = player.hand.splice(cardIdx, 1);
      player.discard.push(card);
    }
  }

  G.bonusCardId = null;
  G.bonusValue = 0;
  events.endPhase(); 
};