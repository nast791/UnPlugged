import {
  activePlayer,
  addLog,
  resetAllFighters,
  clearHighlights,
} from '#shared/utils/actions/utils';
import { INVALID_MOVE } from 'boardgame.io/core';

export const getAvailableCells = ({ G, ctx, fighterId }) => {
  const ownerPlayer = G.players.find(i => i.fighters.some(f => String(f.id) === String(fighterId)));

  if (!ownerPlayer) return [];

  const fighter = ownerPlayer.fighters.find(f => String(f.id) === String(fighterId));

  const baseMove = Number(fighter.move) || 0;
  const bonusFighterMove = Number(fighter.bonusMovement) || 0;
  const bonusMove = Number(G.bonus) || 0;
  const totalRange = baseMove + bonusFighterMove + bonusMove;
  const startPos = String(fighter.startPosition);

  const distances = {};
  G.map.circles.forEach(n => {
    distances[String(n.id)] = Infinity;
  });
  distances[startPos] = 0;

  const queue = [{ id: startPos, dist: 0 }];
  const available = new Set();

  const enemyPositions = G.players
    .filter(p => String(p.id) !== String(ownerPlayer.id))
    .flatMap(p => p.fighters.map(f => String(f.position)));

  const allOccupied = G.players
    .flatMap(p => p.fighters.map(f => String(f.position)))
    .filter(pos => pos !== startPos);

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const { id, dist } = queue.shift();

    if (dist > distances[id]) continue;

    const isOccupiedByOther = allOccupied.includes(id);
    if (dist > 0 && !isOccupiedByOther) {
      available.add(id);
    }

    if (dist >= totalRange) continue;

    const node = G.map.circles.find(n => String(n.id) === id);
    if (!node) continue;

    const neighbors = node.neighbors || node.connections || [];

    for (const neighborId of neighbors) {
      const nId = String(neighborId);
      const isEnemy = enemyPositions.includes(nId);

      if (!isEnemy || fighter.canPassThroughEnemies) {
        const nextDist = dist + 1;

        if (nextDist < distances[nId]) {
          distances[nId] = nextDist;
          queue.push({ id: nId, dist: nextDist });
        }
      }
    }
  }

  const result = Array.from(available);
  if (!result.includes(startPos)) {
    result.push(startPos);
  }

  return result;
};

export const updateMovementUI = ({ G, ctx }) => {
  const player = activePlayer({ G, ctx });
  const hasMoved = player.fighters.some(f => f.position !== f.startPosition);

  const actions = [];
  if (!G.bonusCards?.length && !hasMoved) {
    addLog(G, `Вы можете выбрать карту для усиления или начать движение`);
  }

  if (!G.bonusCards?.length && hasMoved) {
    addLog(G, `Вы можете выбрать карту для усиления`);
  }

  if (G.bonusCards?.length) {
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
  const cardIndex = player.hand.findIndex(c => c.id === cardId);

  if (cardIndex === -1 || G.bonusCards?.length) return INVALID_MOVE;
  const card = player.hand[cardIndex];
  G.bonus = card.bonus || 0;
  G.bonusCards.push(cardId);
  player.hand.splice(cardIndex, 1);
  player.discard.push(card);

  addLog(G, `${player.name} сбрасывает карту и выбирает бонус движения +${G.bonus}`);
  updateMovementUI({ G, ctx });
};

export const cancelBonus = ({ G, ctx }) => {
  if (!G.bonusCards?.length) return 'INVALID_MOVE';
  const player = activePlayer({ G, ctx });
  const lastBonusCardId = G.bonusCards[G.bonusCards.length - 1];
  const topDiscardCard = player.discard?.[player.discard.length - 1];
  if (!topDiscardCard || topDiscardCard.id !== lastBonusCardId) return 'INVALID_MOVE';

  const restoredCard = player.discard.pop();
  player.hand.push(restoredCard);
  G.bonus = 0;
  G.bonusCards = [];
  clearHighlights({ G });
  resetAllFighters({ G, ctx });
  player.fighters.forEach(f => (f.position = f.startPosition));
  addLog(G, `${player.name} отменил бонус к движению. Карта вернулась в руку, позиции сброшены.`);
  updateMovementUI({ G, ctx });
};

export const resetPositions = ({ G, ctx }) => {
  const player = activePlayer({ G, ctx });
  player.fighters.forEach(f => (f.position = f.startPosition));
  addLog(G, `Бойцы вернулись на исходные позиции`);
  updateMovementUI({ G, ctx });
};

export const moveFighter = ({ G, ctx, fighterId, targetId }) => {
  const player = activePlayer({ G, ctx });
  const fighter = player.fighters.find(f => f.id === fighterId);
  const available = getAvailableCells({ G, ctx, fighterId });

  if (!available.includes(String(targetId))) return INVALID_MOVE;

  fighter.position = targetId;
  fighter.active = false;
  addLog(G, `${fighter.name} переместился на ${targetId} позицию`);
  updateMovementUI({ G, ctx });
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
