import { useGameStore } from '~/store/game.js';
import useUtils from '~/composables/useUtils';

export default function () {
  const { players, map } = storeToRefs(useGameStore());
  const { shuffle } = useUtils();
  const nuxtConfig = useRuntimeConfig();

  const runInit = () => {
    players.value = players.value?.map((player, index) => {
      const fullDeck = [];
      player.cards.forEach(card => {
        const qty = card.quantity || 1;
        for (let i = 0; i < qty; i++) {
          fullDeck.push({ ...card, instanceId: `${card.id}_${i}` });
        }
      });
      const shuffledCards = shuffle(fullDeck);

      const fighters = player.heroes?.map(i => {
        const info = {
          type: 'hero',
          image: `${nuxtConfig.public.pack}${player.folder}${i.image}`,
          currentHp: i.hp,
          position: null
        }

        return {...i, ...info};
      });

      player.assistants?.forEach(i => {
        for (let item = 0; item < (i.count || 1); item++) {
          const info = {
            type: 'assistant',
            currentHp: i.hp,
            position: null,
            image: `${nuxtConfig.public.pack}${player.folder}${i.image}`,
          };
          if (i.count) {
            info.group = i.id;
            info.id = `${i.id}_${item + 1}`;
          }
          fighters.push({
            ...i,
            ...info,
          });
        }
      });

      const items = [];
      player.items?.forEach(i => {
        for (let item = 0; item < (i.count || 1); item++) {
          const info = {};
          if (i.count) {
            info.group = i.id;
            info.id = `${i.id}_${item + 1}`;
          }
          items.push({
            ...i,
            ...info,
          });
        }
      });

      return {
        ...player,
        items,
        fighters,
        hand: shuffledCards.splice(0, 5),
        deck: shuffledCards,
        discard: [],
      };
    });
    //   // 1. Перемешиваем колоду
    //   const fullDeck = [...hero.cards].sort(() => Math.random() - 0.5);

    //   // 2. Раздаем стартовую руку (5 карт)
    //   const hand = fullDeck.splice(0, 5);

    //   // 3. Формируем объект игрока
    //   return {
    //     index,
    //     id: hero.id,
    //     name: hero.name,
    //     hp: hero.hp,
    //     moveValue: hero.moveValue,
    //     hand: hand,
    //     deck: fullDeck,
    //     discard: [],
    //     // Создаем массив всех бойцов игрока (герой + помощники)
    //     units: [
    //       {
    //         id: `${hero.id}_main`,
    //         name: hero.name,
    //         type: 'hero',
    //         hp: hero.hp,
    //         position: null // Пока не на поле
    //       },
    //       ...hero.sidekicks.map((s, i) => ({
    //         id: `${hero.id}_sidekick_${i}`,
    //         name: s.name,
    //         type: 'sidekick',
    //         hp: s.hp,
    //         position: null
    //       }))
    //     ]
    //   };
    // });

    // store.isGameInitialized = true;
  };

  return { runInit };
}
