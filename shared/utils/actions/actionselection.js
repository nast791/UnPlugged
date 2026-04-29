import { activePlayer, addLog, isTargetInRange, drawCards } from "#shared/utils/actions/utils";
import { INVALID_MOVE } from 'boardgame.io/core';

export const updateAvailableActions = ({G, ctx}) => {
  const player = activePlayer({ G, ctx });
  const actions = [];

  actions.push({ id: 'movement', text: 'Движение', action: 'selectAction', payload: 'movement' });

  if (canPlayerAttack({G, player})) {
    actions.push({ id: 'attack', text: 'Атака', action: 'selectAction', payload: 'attack' });
  }

  if (player.hand.some(c => c.type === 'effect')) {
    actions.push({ id: 'effect', text: 'Эффект', action: 'selectAction', payload: 'effect' });
  }

  G.pendingActions = actions;
};

export const canPlayerAttack = ({G, player}) => {
  const enemies = G.players.flatMap(p => p.id !== player.id ? p.fighters : []);
  
  return player.fighters.some(f => {
    if (!f.position) return false;
    
    const hasCard = player.hand.some(c => (c.role === f.role || c.role === 'any') && (c.type === 'attack' || c.type === 'hybrid'));
    if (!hasCard) return false;

    return enemies.some(e => {
      if (!e.position) return false;
      return isTargetInRange({G, attacker: f, target: e});
    });
  });
};

export const selectAction = ({ G, ctx, events }, actionId) => {
  const player = activePlayer({ G, ctx });
  
  const actions = {
    movement: 'Движение',
    attack: 'Атака',
    effect: 'Эффект'
  };

  addLog(G, `${player.name} выбирает действие ${actions[actionId]}`);
  G.selectedAction = actionId;
  events.setPhase(actionId.toUpperCase());
};