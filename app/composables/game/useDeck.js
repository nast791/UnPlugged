import { useLogger } from '~/composables/game/useLogger';
import { useGameStore } from '@/store/game';
import { useAppStore } from '@/store/app.js';

export default function () {
  const { addLog } = useLogger();
  const { glossary } = storeToRefs(useAppStore());
  const { activePlayer, players, intent, activePlayerIndex, isGameStarted, turn, timer, phase } =
    storeToRefs(useGameStore());

  const drawCard = (count = 1) => {
    for (let i = 0; i < count; i++) {
      if (activePlayer.value?.deck.length === 0) {
        applyExhaustion();
        continue;
      }

      const card = activePlayer.value?.deck.pop();

      if (card) {
        activePlayer.value?.hand.push(card);
        addLog(`Игрок добирает карту`, 'success');
      }
    }
  };

  const applyExhaustion = () => {
    if (activePlayer.value?.fighters?.filter(i => i.type === 'hero')?.length) {
      activePlayer.value?.fighters
        ?.filter(i => i.type === 'hero')
        .forEach(hero => {
          hero.hp -= 2;
          addLog(`Истощение! Герой ${hero.name} теряет 2 здоровья`, 'danger');
        });
    }
  };

  const discardCard = (cardIndex, silent = false) => {
    if (cardIndex < 0 || cardIndex >= activePlayer.value.hand.length) return;
    const [card] = activePlayer.value.hand.splice(cardIndex, 1);
    activePlayer.value.discard.push(card);
    if (!silent) {
      addLog(`Сброшена карта: ${card.title}`, 'info');
    }
    return card;
  };

  return { drawCard, discardCard };
}
