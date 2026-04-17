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

export const GAME_PHASES = {
  START_TURN: {
    id: 'START_TURN',
    description: ctx => `Начало хода игрока ${ctx.activePlayerName}`,
    next: ['ACTION_SELECTION'],
  },
  ACTION_SELECTION: {
    id: 'ACTION_SELECTION',
    description: ctx => 'Выберите действие: маневр, атака или схема',
    next: ['ACTION_SELECTED'],
  },
  ACTION_SELECTED: {
    id: 'ACTION_SELECTED',
    description: ctx => `Выбрано действие: ${ctx.selectedActionName}`,
    next: ['MANEUVER_DRAW', 'COMBAT_DECLARE', 'EFFECT_RESOLVE'],
  },
  // --- МАНЕВР ---
  MANEUVER_DRAW: {
    id: 'MANEUVER_DRAW',
    description: ctx => 'Добор карты из колоды',
    next: ['BOOST_DECISION'],
  },
  BOOST_DECISION: {
    id: 'BOOST_DECISION',
    description: ctx => 'Усильте маневр картой или пропустите этот этап',
    next: ['BOOST_APPLIED', 'BOOST_SKIPPED'],
  },
  BOOST_APPLIED: {
    id: 'BOOST_APPLIED',
    description: ctx => `Перемещение усилено на +${ctx.boostValue}`,
    next: ['MOVEMENT'],
  },
  BOOST_SKIPPED: {
    id: 'BOOST_SKIPPED',
    description: ctx => 'Усиление перемещения пропущено',
    next: ['MOVEMENT'],
  },
  MOVEMENT: {
    id: 'MOVEMENT',
    description: ctx => 'Переместите своих бойцов по полю',
    next: ['END_ACTION'],
  },
  // --- БОЙ ---
  COMBAT_DECLARE: {
    id: 'COMBAT_DECLARE',
    description: ctx => 'Выберите цель и карту атаки',
    next: ['COMBAT_PRE_BATTLE'],
  },
  COMBAT_PRE_BATTLE: {
    id: 'COMBAT_PRE_BATTLE',
    description: ctx => 'Подготовка к бою',
    next: ['COMBAT_DEFENSE_CHOICE'],
  },
  COMBAT_DEFENSE_CHOICE: {
    id: 'COMBAT_DEFENSE_CHOICE',
    description: ctx => 'Защитник решает: защищаться или пасовать',
    next: ['COMBAT_REVEAL', 'COMBAT_PASS'],
  },
  COMBAT_PASS: {
    id: 'COMBAT_PASS',
    description: ctx => 'Защитник пасует: защита равна 0, эффекты карты защиты не применяются',
    next: ['COMBAT_IMMEDIATELY'],
  },
  COMBAT_REVEAL: {
    id: 'COMBAT_REVEAL',
    description: ctx => 'Вскрытие карт',
    next: ['COMBAT_IMMEDIATELY'],
  },
  COMBAT_IMMEDIATELY: {
    id: 'COMBAT_IMMEDIATELY',
    description: ctx => 'Эффекты "Немедленно" (Защитник -> Атакующий)',
    next: ['COMBAT_DURING'],
  },
  COMBAT_DURING: {
    id: 'COMBAT_DURING',
    description: ctx => 'Эффекты "Во время боя" (Защитник -> Атакующий)',
    next: ['COMBAT_DAMAGE'],
  },
  COMBAT_DAMAGE: {
    id: 'COMBAT_DAMAGE',
    description: ctx => 'Расчет и нанесение боевого урона',
    next: ['COMBAT_AFTER'],
  },
  COMBAT_AFTER: {
    id: 'COMBAT_AFTER',
    description: ctx => 'Эффекты "После боя" (Защитник -> Атакующий)',
    next: ['END_ACTION'],
  },
  // --- ЭФФЕКТ ---
  EFFECT_DECLARE: {
    id: 'EFFECT_DECLARE',
    description: ctx => 'Выберите карту схемы из руки',
    next: ['EFFECT_TARGETING'],
  },
  EFFECT_TARGETING: {
    id: 'EFFECT_TARGETING',
    description: ctx => 'Выберите цель для применения эффекта на поле',
    next: ['EFFECT_RESOLVE'],
  },
  EFFECT_RESOLVE: {
    id: 'EFFECT_RESOLVE',
    description: ctx => 'Эффект применен',
    next: ['END_ACTION'],
  },
  // --- ЗАВЕРШЕНИЕ ---
  END_ACTION: {
    id: 'END_ACTION',
    description: ctx => 'Действие завершено',
    next: ['ACTION_SELECTION', 'END_TURN'],
  },
  END_TURN: {
    id: 'END_TURN',
    description: ctx => 'Завершение хода. Проверка лимита карт',
    next: ['START_TURN'],
  },
};
