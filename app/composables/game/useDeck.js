import { useGameStore } from '~/store/game.js';
import { storeToRefs } from 'pinia';
import { useLogger } from '~/composables/game/useLogger';

export const useDeck = () => {
  const store = useGameStore();
  const { activePlayer } = storeToRefs(store);
  const { addLog } = useLogger();

  /* Универсальный добор карт */
  const drawCards = (count = 1, returnedPhase = null, playerObj = null) => {
    const player = playerObj || activePlayer.value;
    if (!player) return;

    for (let i = 0; i < count; i++) {
      if (player.deck.length > 0) {
        const card = player.deck.pop();
        player.hand.push(card);
      } else {
        store.goToPhase('EXHAUSTION');
        return;
      }
    }

    addLog(`${player.name} добирает карты (${count})`, 'info');

    if (returnedPhase) {
      store.goToPhase(returnedPhase);
    }
  };

  /* Переключение состояния выбора карты (реверс) */
  const toggleCardReversed = (card, limit = 1) => {
    const reversedCount = activePlayer.value.hand.filter(c => c.isReversed).length;

    if (card.isReversed) {
      card.isReversed = false;
      return true;
    } else {
      if (reversedCount < limit) {
        card.isReversed = true;
        return true;
      } else {
        addLog(`Нельзя выбрать больше ${limit} карт`, 'danger');
        return false;
      }
    }
  };

  /* Универсальный сброс карт (confirm) */
  const confirmDiscard = (returnedPhase) => {
    const cardsToDiscard = activePlayer.value.hand.filter(c => c.isReversed);
    
    cardsToDiscard.forEach(card => {
      const idx = activePlayer.value.hand.findIndex(c => c.id === card.id);
      if (idx !== -1) {
        const [removed] = activePlayer.value.hand.splice(idx, 1);
        removed.isReversed = false;
        activePlayer.value.discard.push(removed);
      }
    });

    if (returnedPhase) {
      store.goToPhase(returnedPhase);
    }

    return cardsToDiscard;
  };

  /* Возврат карт из сброса в руку */
  const returnToHand = (cardIds) => {
    const ids = Array.isArray(cardIds) ? cardIds : [cardIds];
    ids.forEach(id => {
      const idx = activePlayer.value.discard.findIndex(c => c.id === id);
      if (idx !== -1) {
        const [card] = activePlayer.value.discard.splice(idx, 1);
        card.isReversed = false;
        activePlayer.value.hand.push(card);
      }
    });
    if (ids.length > 0) addLog(`Карты (${ids.length}) вернулись в руку`, 'info');
  };

  return { drawCards, confirmDiscard, returnToHand, toggleCardReversed };
};