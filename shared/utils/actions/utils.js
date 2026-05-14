import {getAvailableCells as getAvailableCellsMove} from '#shared/utils/actions/movement';
import {getAvailableCells as getAvailableCellsPlace} from '#shared/utils/actions/placement';

export const activePlayer = ({G, ctx}) => {
  return G.players[ctx.currentPlayer];
};

export const addLog = (G, msg, type = 'info') => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  G.log.push({ msg, type, time });
};

export const setFighterActive = ({G, ctx}, { fighterId, active }) => {
  const player = activePlayer({G, ctx});
  const fighter = player.fighters.find(f => f.id === fighterId);
  if (fighter) {
    fighter.active = active;
  }
};

export const resetAllFighters = ({G, ctx}) => {
  const player = activePlayer({G, ctx});
  player.fighters.forEach(f => (f.active = false));
};

export const clearHighlights = ({G}) => {
  G.highlightCells = [];
};

export const toggleActiveFighter = ({G, ctx}, { fighterId }) => {
  const player = activePlayer({G, ctx});
  const fighter = player.fighters.find(f => f.id === fighterId);
  if (!fighter) return;
  const state = fighter.active;
  clearHighlights({G});
  resetAllFighters({G, ctx});
  const currentPhase = ctx.phase;
  fighter.active = !state;
  if (!fighter.active) return;
  if (currentPhase === 'UNIT_PLACEMENT') {
    G.highlightCells = getAvailableCellsPlace({ G, ctx, fighterId });
  } else if (currentPhase === 'MOVEMENT') {
    G.highlightCells = getAvailableCellsMove({ G, ctx, fighterId });
  }
};

export const drawCards = ({ G, player, count = 1 }) => {
  if (!player) return;

  for (let i = 0; i < count; i++) {
    if (player.deck.length > 0) {
      const card = player.deck.pop(); 
      player.hand.push(card);
    } else {
      handleExhaustion({ G, ctx, player });
      break; 
    }
  }

  addLog(G, `${player.name} берет карты: ${count}`);
};

export const discardSelected = ({ G, player }) => {
  const toDiscard = player.hand.filter(c => c.isReversed);
  
  toDiscard.forEach(card => {
    const idx = player.hand.findIndex(c => c.id === card.id);
    if (idx !== -1) {
      const [removed] = player.hand.splice(idx, 1);
      removed.isReversed = false;
      player.discard.push(removed);
      addLog(G, `${player.name} сбросил ${removed.name || 'карту'}`);
    }
  });
  
  return toDiscard.length;
};

export const returnToHand = ({ G, player, cardIds }) => {
  const ids = Array.isArray(cardIds) ? cardIds : [cardIds];
  ids.forEach(id => {
    const idx = player.discard.findIndex(c => c.id === id);
    if (idx !== -1) {
      const [card] = player.discard.splice(idx, 1);
      card.isReversed = false;
      player.hand.push(card);
    }
  });
  addLog(G, `Карты (${ids.length}) вернулись в руку ${player.name}`);
};

export const applyDamage = ({G, ctx, fighter, amount}) => {
  if (!fighter || fighter.hp <= 0) return;

  fighter.hp = Math.max(0, fighter.hp - amount);
  addLog(G, `${fighter.name} получает ${amount} урона! (HP: ${fighter.hp})`, 'danger');

  if (fighter.hp <= 0) {
    fighter.position = null;
    fighter.startPosition = null;
    fighter.active = false;
    addLog(G, `${fighter.name} пал в бою!`, 'danger');

    if (fighter.type === 'hero') {
      const player = G.players.find(p => p.fighters.includes(fighter));
      player.fighters.forEach(f => {
        f.hp = 0;
        f.position = null;
        f.startPosition = null;
        f.active = false;
      });
      checkGameOver({G, ctx});
    }
  }
};

export const checkGameOver = ({G, ctx}) => {
  const alivePlayers = G.players.filter(p => 
    p.fighters.some(f => f.type === 'hero' && f.hp > 0)
  );

  if (alivePlayers.length <= 1) {
    G.winner = alivePlayers.length === 1 ? alivePlayers[0].id : 'draw';
    addLog(G, G.winner === 'draw' ? "Ничья! Все герои пали." : `Игра окончена! Победитель: ${alivePlayers[0].name}`, 'info');
    return true;
  }
  return false;
};

export const handleExhaustion = ({ G, ctx, player }) => {
  addLog(G, `Колода ${player.name} пуста! Эффект истощения.`, 'danger');
  const heroes = player.fighters.filter(f => f.type === 'hero' && f.hp > 0);

  heroes.forEach(hero => {
    applyDamage({G, ctx, fighter: hero, amount: 2});
  });

  checkGameOver({G, ctx});
};

const getFighterNodes = (fighter) => {
  return Array.isArray(fighter.position) ? fighter.position : [fighter.position];
};

export const isWithinDistance = ({G, startNodeId, targetNodeId, maxRange}) => {
  if (startNodeId === targetNodeId) return false;
  
  let queue = [{ id: startNodeId, dist: 0 }];
  let visited = new Set([startNodeId]);

  while (queue.length > 0) {
    let { id, dist } = queue.shift();
    if (dist >= maxRange) continue;

    const node = G.map.circles.find(n => n.id === id);
    for (const neighborId of node?.neighbors || []) {
      if (neighborId === targetNodeId) return true;
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({ id: neighborId, dist: dist + 1 });
      }
    }
  }
  return false;
};

export const isTargetInRange = ({G, attacker, target}) => {
  const fNodes = getFighterNodes(attacker);
  const eNodes = getFighterNodes(target);

  // 1. ДАЛЬНИЙ БОЙ (По зонам)
  if (attacker.attackType === 'ranged') {
    return fNodes.some(fId => {
      const fNode = G.map.circles.find(n => n.id === fId);
      return eNodes.some(eId => {
        const eNode = G.map.circles.find(n => n.id === eId);
        return fNode.zones.some(z => eNode.zones.includes(z));
      });
    });
  }

  // 2. БЛИЖНИЙ БОЙ (С учетом дистанции и размера)
  const range = attacker.attackRange || 1;
  
  return fNodes.some(fId => 
    eNodes.some(eId => isWithinDistance({G, startNodeId: fId, targetNodeId: eId, maxRange: range}))
  );
};