import jexl from 'jexl';
import { useGameStore } from '@/stores/game';

export default function () {
  const store = useGameStore();
  const { round, timer } = storeToRefs(useGameStore());

  const runEffect = (expression, customContext = {}) => {
    const context = {
      state: store.$state,
      activePlayer: store.players[store.turn.activePlayer],
      damage: (targetId, amount) => store.dealDamage(targetId, amount),
      move: (unitId, dist) => store.setMovementMode(unitId, dist),
      draw: (count) => store.drawCards(store.turn.activePlayer, count),
      ...customContext
    };
    return jexl.evalSync(expression, context);
  };

  const handleManeuver = () => {
    if (store.turn.actionsLeft <= 0) return;
    store.drawCards(store.turn.activePlayer, 1);
    const hero = store.players[store.turn.activePlayer];
    store.turn.phase = 'MOVING';
    store.board.reachableCircles = store.calculatePath(hero.position, hero.moveValue);
    store.turn.actionsLeft--;
  };


  const playEffect = (cardId) => {
    if (store.turn.actionsLeft <= 0) return;
    const card = store.getCardById(cardId);
    if (card.effect) {
      runEffect(card.effect);
    }
    store.discardCard(store.turn.activePlayer, cardId);
    store.turn.actionsLeft--;
  };

  const startAttack = (attackerId, targetId, cardId) => {
    if (store.turn.actionsLeft <= 0) return;

    store.turn.phase = 'COMBAT';
    store.turn.combat = {
      attackerId,
      targetId,
      attackerCardId: cardId,
      defenderCardId: null,
      step: 'WAITING_FOR_DEFENSE'
    };
  };

  const resolveCombat = () => {
    const { attackerCardId, defenderCardId } = store.turn.combat;
    const aCard = store.getCardById(attackerCardId);
    const dCard = defenderCardId ? store.getCardById(defenderCardId) : null;

    // Фаза: IMMEDIATELY
    if (dCard?.phases.immediately) runEffect(dCard.phases.immediately);
    if (aCard.phases.immediately) runEffect(aCard.phases.immediately);

    // Фаза: DURING
    if (dCard?.phases.during) runEffect(dCard.phases.during);
    if (aCard.phases.during) runEffect(aCard.phases.during);

    // РАСЧЕТ УРОНА
    const damage = Math.max(0, aCard.value - (dCard?.value || 0));
    if (damage > 0) {
      store.dealDamage(store.turn.combat.targetId, damage);
    }

    // Фаза: AFTER
    // В Unmatched важно, кто победил (урон > 0 или защитник отбился)
    const context = { winner: damage > 0 ? 'attacker' : 'defender' };
    if (dCard?.phases.after) runEffect(dCard.phases.after, context);
    if (aCard.phases.after) runEffect(aCard.phases.after, context);

    // Завершение
    store.discardCard(store.turn.activePlayer, attackerCardId);
    if (defenderCardId) store.discardCard(store.getOpponentId, defenderCardId);
    
    store.turn.phase = 'CHOOSE_ACTION';
    store.turn.actionsLeft--;
  };

  return {
    handleManeuver,
    playEffect,
    startAttack,
    resolveCombat
  };
};