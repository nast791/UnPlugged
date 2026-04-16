import { storeToRefs } from 'pinia';
import { useGameStore } from '~/store/game.js';
import { useLogger } from '~/composables/game/useLogger';
import { useTurnStart } from '~/composables/phases/useTurnStart';

export const useGameOver = () => {
  const store = useGameStore();
  const { players } = storeToRefs(store);
  const { stopTimer } = useTurnStart();
  const { addLog } = useLogger();

  const checkGameOver = () => {
    const survivors = players.value.filter(p => 
      p.fighters.some(f => f.type === 'hero' && f.hp > 0)
    );

    if (survivors.length <= 1) {
      store.winner = survivors[0] || null;
      store.goToPhase('GAME_OVER');
      return true;
    }
    return false;
  };

  const runGameOver = () => {
    stopTimer();
    if (store.winner) addLog(`Победил игрок ${store.winner.name}`, 'info');
    else addLog(`Ничья. Все игроки пали в битве`, 'info');
    // если фаза === 'GAME_OVER' выводим экран поверх игры (Игра закончилась на ходе таком-то, времени прошло столько, победил или ничья, 
    // у победителя осталось здоровья столько, кнопка выйти)
    // возможно, скачать логи?
  };

  return { checkGameOver, runGameOver };
};