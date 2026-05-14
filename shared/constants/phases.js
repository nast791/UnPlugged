export default [
  {
    id: 'GAME_SETUP',
    start: true,
    description: 'Настройка параметров игры',
    onEnter: ({ runGameSetup }) => runGameSetup(),
    next: ['GAME_INIT'],
  },
  {
    id: 'GAME_INIT',
    description: 'Подготовка колод, настройка карты, создание бойцов',
    onEnter: ({ runGameInit }) => runGameInit(),
    next: ['UNIT_PLACEMENT'],
  },
  {
    id: 'UNIT_PLACEMENT',
    description: 'Расстановка бойцов',
    allowFighterDrag: true,
    onEnter: ({ runUnitPlacement }) => runUnitPlacement(),
    next: ['GAME_START'],
  },
  {
    id: 'GAME_START',
    description: 'Начало игры',
    onEnter: ({ runGameStart }) => runGameStart(),
    next: ['TURN_START'],
  },
  {
    id: 'TURN_START',
    description: 'Начало хода',
    onEnter: ({ runTurnStart }) => runTurnStart(),
    next: ['ACTION_SELECTION'],
  },
  {
    id: 'ACTION_SELECTION',
    description: 'Выбор действия',
    onEnter: ({ runActionSelection }) => runActionSelection(),
    next: ['MOVEMENT'],
  },
  {
    id: 'EXHAUSTION',
    description: 'Истощение',
    onEnter: ({ runExhaustion }) => runExhaustion(),
    next: ['GAME_OVER', 'MOVEMENT', 'TURN_START'],
  },
  {
    id: 'MOVEMENT',
    description: 'Движение',
    onEnter: (reg) => reg.runMovement(),
    onFighterClick: (fighter, reg) => reg.selectFighter(fighter), 
    onNodeClick: (nodeId, reg) => reg.moveFighter(nodeId),
    onCardClick: (card, reg) => reg.selectCard(card),
    next: ['ACTION_END'],
  },
  {
    id: 'ACTION_END',
    description: 'Завершение действия',
    onEnter: ({ runActionEnd }) => runActionEnd(),
    next: ['ACTION_SELECTION', 'TURN_END'],
  },
  {
    id: 'TURN_END',
    description: 'Завершение хода',
    onEnter: ({ runTurnEnd }) => runTurnEnd(),
    next: ['TURN_START'],
  },
  {
    id: 'GAME_OVER',
    description: 'Игра окончена',
    onEnter: ({ runGameOver }) => runGameOver(),
    next: [],
  }
];