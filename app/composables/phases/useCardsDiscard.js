import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';

export const useCardsDiscard = () => {
  const store = useGameStore();
  const { activePlayer } = storeToRefs(store);
  const { addLog, addActions } = useLogger();

  const runCardsDiscard = (limit = 1) => {
    store.discardLimit = limit;
    
    addActions('discard-controls', `Выберите карты для сброса (макс: ${limit})`, [
      { text: 'Закончить сброс', action: confirmDiscard }
    ]);
  };

  // Вызывается при правом клике на карту
  const toggleCardReversed = (card) => {
    const reversedCount = activePlayer.value.hand.filter(c => c.isReversed).length;

    if (card.isReversed) {
      card.isReversed = false;
      if (card.id === store.bonusMovementCardId) clearMovementBonus();
    } else {
      if (reversedCount < store.discardLimit) {
        card.isReversed = true;
        if (store.phase === 'CARDS_DISCARD' && store.selectedAction === 'movement') {
          applyMovementBonus(card);
        }
      } else {
        addLog(`Нельзя сбросить больше ${store.discardLimit} карт`, 'danger');
      }
    }
  };

  const applyMovementBonus = (card) => {
    store.bonusMovementCardId = card.id;
    const bonus = card.bonus;
    store.bonusMovement = bonus;
    addLog(`Бонус к движению: +${bonus}`, 'info');
  };

  const clearMovementBonus = () => {
    store.bonusMovementCardId = null;
    store.bonusMovement = 0;
  };

  const returnCardsToHand = (cardIds) => {
    if (!activePlayer.value) return;
    const idsToReturn = Array.isArray(cardIds) ? cardIds : [cardIds];
    
    idsToReturn.forEach(id => {
      const cardIndex = activePlayer.value.discard.findIndex(i => i.id === id);
      
      if (cardIndex !== -1) {
        const [card] = activePlayer.value.discard.splice(cardIndex, 1);
        card.isReversed = false;
        activePlayer.value.hand.push(card);
      }
    });
    addLog(`Карты вернулись в руку`, 'info');
  };

  const confirmDiscard = () => {
    const cardsToDiscard = activePlayer.value.hand.filter(c => c.isReversed);
    
    cardsToDiscard.forEach(card => {
      const idx = activePlayer.value.hand.findIndex(c => c.id === card.id);
      const [removed] = activePlayer.value.hand.splice(idx, 1);
      removed.isReversed = false;
      activePlayer.value.discard.push(removed);
    });

    if (store.selectedAction === 'movement') {
      store.goToPhase('MOVEMENT');
    }
  };

  return { runCardsDiscard, toggleCardReversed, confirmDiscard, returnCardsToHand };
};



// export const useCardsDiscard = () => {
//   const store = useGameStore();
//   const { activePlayer, bonusMovementCardId } = storeToRefs(store);
//   const { addLog, addActions } = useLogger();

//   /**
//    * Универсальный запуск фазы сброса
//    * @param {Object} params { limit, reason, message }
//    */
//   const runCardsDiscard = ({ limit = 1, reason = 'boost', message = '' } = {}) => {
//     store.discardLimit = limit;
//     store.discardReason = reason; // Сохраняем причину (boost, exhaustion, effect, limit)

//     const msg = message || `Выберите карты для сброса (макс: ${limit})`;
//     addActions('discard-controls', msg, [
//       { text: 'Закончить сброс', action: confirmDiscard }
//     ]);
//   };

//   /**
//    * Универсальный возврат карт
//    */
//   const returnCardsToHand = (cardIds) => {
//     const ids = Array.isArray(cardIds) ? cardIds : [cardIds];
//     ids.forEach(id => {
//       const idx = activePlayer.value.discard.findIndex(c => c.id === id);
//       if (idx !== -1) {
//         const [card] = activePlayer.value.discard.splice(idx, 1);
//         card.isReversed = false;
//         activePlayer.value.hand.push(card);
//       }
//     });
//   };

//   /**
//    * Логика подтверждения сброса
//    */
//   const confirmDiscard = () => {
//     const cardsToDiscard = activePlayer.value.hand.filter(c => c.isReversed);
    
//     // Если ничего не выбрали, просто уходим обратно (если это буст)
//     if (cardsToDiscard.length === 0 && store.discardReason === 'boost') {
//       return store.goToPhase('MOVEMENT');
//     }

//     cardsToDiscard.forEach(card => {
//       // Если причина — бонус к движению, записываем данные в стор
//       if (store.discardReason === 'boost') {
//         store.bonusMovementCardId = card.id;
//         store.bonusMovement = card.boostValue || card.value;
//         addLog(`Применен бонус к движению: +${store.bonusMovement}`, 'success');
//       }

//       // Перенос в сброс
//       const idx = activePlayer.value.hand.findIndex(c => c.id === card.id);
//       const [removed] = activePlayer.value.hand.splice(idx, 1);
//       removed.isReversed = false;
//       activePlayer.value.discard.push(removed);
//     });

//     // Универсальный возврат по фазам
//     if (store.discardReason === 'boost') {
//       store.goToPhase('MOVEMENT');
//     } else if (store.discardReason === 'limit') {
//       store.goToPhase('TURN_START'); // Завершаем ход после сброса лишних
//     } else {
//       store.goToPhase('ACTION_SELECTION');
//     }
//   };

//   return { runCardsDiscard, returnCardsToHand, confirmDiscard };
// };