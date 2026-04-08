import PLAYER_ACTIONS from '#shared/constants/actions';

export default [
  {
    id: 'GAME_SETUP',
    description: 'Настройка параметров игры',
    auto: false,
    onEnter: (store, { setupNewGame }) => {
      setupNewGame();
    },
    transitions: [
      { to: 'GAME_INIT', condition: ctx => ctx.id && ctx.map && ctx.players?.length > 1 },
    ],
  },
  {
    id: 'GAME_INIT',
    auto: false,
    description: 'Подготовка колод и создание бойцов',
    onEnter: (store, { runInit }) => {
      runInit();
    },
    transitions: [{ to: 'UNIT_PLACEMENT', condition: ctx => ctx.activePlayerIndex }],
  },
  {
    id: 'UNIT_PLACEMENT',
    auto: true,
    description: 'Расстановка бойцов',
    onEnter: (store, { startPlacement }) => {
      startPlacement();
    },
    transitions: [{ to: 'ACTION_SELECTION', condition: ctx => ctx.isGameStarted && ctx.turn }],
  },
  {
    id: 'ACTION_SELECTION',
    auto: true,
    description: 'Выберите действие',
    onEnter: (store, { startSelection }) => {
      startSelection();
    },
    transitions: [{ to: 'ACTION_SELECTED', condition: ctx => !!ctx.selectedAction }],
  },
  {
    id: 'ACTION_SELECTED',
    description: ctx => `Выбрано действие: ${ctx.selectedActionName}`,
    transitions: [
      {
        to: 'MANEUVER_DRAW',
        condition: ctx => ctx.intent.selectedAction === PLAYER_ACTIONS.MANEUVER.id,
      },
      {
        to: 'COMBAT_DECLARE',
        condition: ctx => ctx.intent.selectedAction === PLAYER_ACTIONS.ATTACK.id,
      },
      {
        to: 'EFFECT_RESOLVE',
        condition: ctx => ctx.intent.selectedAction === PLAYER_ACTIONS.EFFECT.id,
      },
    ],
  },
  // --- МАНЕВР ---
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
