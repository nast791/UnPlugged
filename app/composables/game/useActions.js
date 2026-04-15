import jexl from 'jexl';
import { useLogger } from '~/composables/game/useLogger';
import useDeck from '~/composables/game/useDeck';
import { useGameStore } from '@/store/game';
import { useAppStore } from '@/store/app.js';

export default function () {
  const { activePlayer, players, intent, activePlayerIndex, turn, phase } =
    storeToRefs(useGameStore());
  const { glossary } = storeToRefs(useAppStore());
  const { addLog } = useLogger();
  const { drawCard, discardCard } = useDeck();

  const playerType = computed(() => (activePlayer.value.type !== 'ai' ? 'player' : 'ai'));

  const startSelection = () => {
    addLog(`Ход игрока ${activePlayer.value.index}`, 'info');
    if (playerType.value !== 'ai') {
      const actions = glossary.value?.meta?.actions.map(i => ({
        ...i,
        text: i.name,
        action: selectPlayer,
        clicked: false,
      }));
      addLog(
        `Выберите действие:`,
        'action',
        actions,
        `${phase.value}-${activePlayer.value.id}-check`,
      );
    } else {
      selectAI();
    }
  };

  const moveSnapshot = useState('moveSnapshot', () => ({}));

  const handlers = {
    handleMovement: () => {
      drawCard();
      moveSnapshot.value = {};
      activePlayer.value?.fighters.forEach(i => {
        moveSnapshot.value[i.id] = i.position;
        i.active = false;
        i.acted = false;
      });
      addLog(
        ``,
        'action',
        [{ text: 'Завершить действие', action: confirmAction, clicked: false }],
        `${phase.value}-${activePlayer.value.id}-endTurn`,
      );
    },
    handleAttack: () => {},
    handleEffect: () => {},
  };

  const selectPlayer = item => {
    item.clicked = true;
    intent.value.selectedAction = item.id;
    addLog(`Игрок выбирает ${item.name.toLowerCase()}`, 'info');
    handlers[item.handler](item);
  };

  const selectAI = () => {
    intent.value.selectedAction = item.id;
    addLog(`Игрок выбирает ${item.name.toLowerCase()}`, 'info');
  };

  const onFighterClick = fighter => {
    if (intent.value?.selectedAction === 'movement') {
      handleMovementClick(fighter);
    } else if (intent.value?.selectedAction === 'attack') {
      handleAttackClick(fighter);
    }
  };

  const handleMovementClick = fighter => {
    const startPos = moveSnapshot.value[fighter.id];
    if (fighter.position !== startPos) {
      fighter.position = startPos;
      fighter.acted = false;
      return;
    }
    const isCurrentlyActive = fighter.active;
    activePlayer.value?.fighters?.forEach(i => (i.active = false));
    fighter.active = !isCurrentlyActive;
  };

  const confirmAction = item => {
    item.clicked = true;
    if (!activePlayer.value) return;
    activePlayer.value.actionsUsed++;
    intent.value.selectedAction = null;
    activePlayer.value?.fighters.forEach(f => (f.active = false));
    intent.value.movementBonus = 0;
    intent.value.canPassThroughEnemies = false;
    if (activePlayer.value.actionsUsed < activePlayer.value.actionsPoints) {
      addLog(
        `У вас осталось действий: ${activePlayer.value.actionsPoints - activePlayer.value.actionsUsed}`,
        'info',
      );
      startSelection();
    } else {
      if (activePlayer.value.hand.length > 7) {
        intent.value.selectedAction === 'enumeration';
        addLog(`Превышен лимит! Сбросьте лишние карты (у вас ${activePlayer.value.hand.length})`);
      } else {
        endTurn();
      }
    }
  };

  const handleContextAction = (cardIndex, actionType) => {
    const player = activePlayer.value;
  
    if (actionType === 'discard') {
      discardCard(cardIndex);
      if (intent.value.selectedAction === 'enumeration' && player.hand.length <= 7) {
        intent.value.selectedAction = null;
        endTurn();
      }
    }
  
    if (actionType === 'applyBonus') {
      const card = discardCard(cardIndex);
      if (card) {
        intent.value.movementBonus = card.bonus;
        addLog(`Передвижение усилено на +${card.bonus}`, 'success');
      }
    }
  };

  const endTurn = () => {
    activePlayer.value.actionsUsed = 0;
    if (players.value?.length > activePlayerIndex.value) {
      activePlayerIndex.value++;
    } else {
      activePlayerIndex.value = 1;
    }
    turn.value++;
    addLog(`Все действия исчерпаны. Ход завершен.`, 'info');
  };

  // const runEffect = (expression, customContext = {}) => {
  //   const context = {
  //     state: store.$state,
  //     activePlayer: store.players[store.turn.activePlayer],
  //     damage: (targetId, amount) => store.dealDamage(targetId, amount),
  //     move: (unitId, dist) => store.setMovementMode(unitId, dist),
  //     draw: (count) => store.drawCards(store.turn.activePlayer, count),
  //     ...customContext
  //   };
  //   return jexl.evalSync(expression, context);
  // };

  // const handleManeuver = () => {
  //   if (store.turn.actionsLeft <= 0) return;
  //   store.drawCards(store.turn.activePlayer, 1);
  //   const hero = store.players[store.turn.activePlayer];
  //   store.turn.phase = 'MOVING';
  //   store.board.reachableCircles = store.calculatePath(hero.position, hero.moveValue);
  //   store.turn.actionsLeft--;
  // };

  // const playEffect = (cardId) => {
  //   if (store.turn.actionsLeft <= 0) return;
  //   const card = store.getCardById(cardId);
  //   if (card.effect) {
  //     runEffect(card.effect);
  //   }
  //   store.discardCard(store.turn.activePlayer, cardId);
  //   store.turn.actionsLeft--;
  // };

  // const startAttack = (attackerId, targetId, cardId) => {
  //   if (store.turn.actionsLeft <= 0) return;

  //   store.turn.phase = 'COMBAT';
  //   store.turn.combat = {
  //     attackerId,
  //     targetId,
  //     attackerCardId: cardId,
  //     defenderCardId: null,
  //     step: 'WAITING_FOR_DEFENSE'
  //   };
  // };

  // const resolveCombat = () => {
  //   const { attackerCardId, defenderCardId } = store.turn.combat;
  //   const aCard = store.getCardById(attackerCardId);
  //   const dCard = defenderCardId ? store.getCardById(defenderCardId) : null;

  //   // Фаза: IMMEDIATELY
  //   if (dCard?.phases.immediately) runEffect(dCard.phases.immediately);
  //   if (aCard.phases.immediately) runEffect(aCard.phases.immediately);

  //   // Фаза: DURING
  //   if (dCard?.phases.during) runEffect(dCard.phases.during);
  //   if (aCard.phases.during) runEffect(aCard.phases.during);

  //   // РАСЧЕТ УРОНА
  //   const damage = Math.max(0, aCard.value - (dCard?.value || 0));
  //   if (damage > 0) {
  //     store.dealDamage(store.turn.combat.targetId, damage);
  //   }

  //   // Фаза: AFTER
  //   // В Unmatched важно, кто победил (урон > 0 или защитник отбился)
  //   const context = { winner: damage > 0 ? 'attacker' : 'defender' };
  //   if (dCard?.phases.after) runEffect(dCard.phases.after, context);
  //   if (aCard.phases.after) runEffect(aCard.phases.after, context);

  //   // Завершение
  //   store.discardCard(store.turn.activePlayer, attackerCardId);
  //   if (defenderCardId) store.discardCard(store.getOpponentId, defenderCardId);

  //   store.turn.phase = 'CHOOSE_ACTION';
  //   store.turn.actionsLeft--;
  // };

  return {
    startSelection,
    onFighterClick,
    endTurn,
    handleContextAction
  };
}
