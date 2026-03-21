export default function () {
  // дописать про карту, импортировать стор
  const store = useGameStore();

  const runInit = (selectedHeroesData) => {
    store.players = selectedHeroesData.map((hero, index) => {
      // 1. Перемешиваем колоду
      const fullDeck = [...hero.cards].sort(() => Math.random() - 0.5);
      
      // 2. Раздаем стартовую руку (5 карт)
      const hand = fullDeck.splice(0, 5);

      // 3. Формируем объект игрока
      return {
        index,
        id: hero.id,
        name: hero.name,
        hp: hero.hp,
        moveValue: hero.moveValue,
        hand: hand,
        deck: fullDeck,
        discard: [],
        // Создаем массив всех бойцов игрока (герой + помощники)
        units: [
          { 
            id: `${hero.id}_main`, 
            name: hero.name, 
            type: 'hero', 
            hp: hero.hp, 
            position: null // Пока не на поле
          },
          ...hero.sidekicks.map((s, i) => ({
            id: `${hero.id}_sidekick_${i}`,
            name: s.name,
            type: 'sidekick',
            hp: s.hp,
            position: null
          }))
        ]
      };
    });

    store.isGameInitialized = true;
    store.addLog('Колоды перемешаны, бойцы готовы к высадке', 'system');
  };

  return { runInit };
};