/** Зеркало skill из heroes/medusa/index.json и heroes/tesla/index.json (Unplugged-pack). */

export const medusaSkill = {
  id: 'medusa_skill',
  heroId: 'medusa',
  name: 'Взгляд Медузы',
  text: 'Начало хода: вы можете нанести 1 урон вражескому бойцу в одной области с Медузой.',
  triggers: [
    {
      id: 'gaze',
      trigger: 'start_turn',
      conditions: {
        all: [
          { fact: 'HERO_ON_BOARD', params: { fighterId: 'medusa' } },
          {
            fact: 'FIGHTERS_IN_RANGE',
            params: { sourceId: 'medusa', side: 'opponent', kind: 'fighter' },
            check: { var: '$candidates', operator: 'isNonEmpty' },
            return: '$candidates',
          },
        ],
      },
      actions: [
        {
          id: 'ask_apply',
          type: 'PROMPT',
          start: true,
          return: '$answer',
          conditions: { all: [{ var: '$answer', operator: 'isEmpty' }] },
          params: {
            message: 'Применить способность героя?',
            answers: [
              { id: 'apply', text: 'Да', value: 'apply' },
              { id: 'skip', text: 'Нет', value: 'skip' },
            ],
          },
        },
        {
          id: 'pick_target',
          type: 'SELECT_EFFECT_TARGETS',
          return: '$targets',
          conditions: {
            all: [
              { var: '$answer', operator: 'equal', value: 'apply' },
              { var: '$targets', operator: 'isEmpty' },
            ],
          },
          params: {
            candidates: '$candidates',
            selection: 1,
          },
        },
        {
          id: 'deal_damage',
          type: 'DAMAGE_FIGHTERS',
          end: true,
          conditions: {
            all: [
              { var: '$answer', operator: 'equal', value: 'apply' },
              { var: '$targets', operator: 'isNonEmpty' },
            ],
          },
          params: { targets: '$targets', damage: 1 },
        },
      ],
    },
  ],
};

export const teslaSkill = {
  id: 'tesla_skill',
  heroId: 'tesla',
  name: 'Мастерство катушек',
  text: 'В начале игры 1 катушка уже активна. Конец хода: активируйте 1 катушку. Начало хода: если обе катушки активны, нанесите 1 урон каждому вражескому бойцу на соседних с Теслой клетках и передвиньте их на расстояние до 1 клетки.',
  triggers: [
    {
      id: 'init_coils',
      trigger: 'start_game',
      actions: [
        {
          id: 'activate_first_coil',
          type: 'ACTIVATE_ITEMS',
          start: true,
          end: true,
          params: { type: 'coil', count: 1, state: 'active' },
        },
      ],
    },
    {
      id: 'charge_coil',
      trigger: 'end_turn',
      conditions: {
        all: [
          { fact: 'HERO_ON_BOARD', params: { fighterId: 'tesla' } },
          {
            fact: 'COUNT_ITEMS',
            params: { type: 'coil', state: 'inactive' },
            check: { var: '$count', operator: 'greater', value: 0 },
          },
        ],
      },
      actions: [
        {
          id: 'activate_coil',
          type: 'ACTIVATE_ITEMS',
          start: true,
          end: true,
          params: { type: 'coil', count: 1, state: 'active' },
        },
      ],
    },
    {
      id: 'discharge',
      trigger: 'start_turn',
      conditions: {
        all: [
          { fact: 'HERO_ON_BOARD', params: { fighterId: 'tesla' } },
          { fact: 'ALL_ITEMS_ACTIVE', params: { type: 'coil', count: 2 } },
          {
            fact: 'FIGHTERS_IN_RANGE',
            params: { sourceId: 'tesla', side: 'opponent', kind: 'fighter', maxSteps: 1 },
            check: { var: '$candidates', operator: 'isNonEmpty' },
            return: '$candidates',
          },
        ],
      },
      actions: [
        {
          id: 'coil_damage',
          type: 'DAMAGE_FIGHTERS',
          start: true,
          params: { targets: '$candidates', damage: 1 },
        },
        {
          id: 'ask_push',
          type: 'PROMPT',
          return: '$pushAnswer',
          conditions: { all: [{ var: '$pushAnswer', operator: 'isEmpty' }] },
          params: {
            message: 'Передвинуть цели на расстояние 1 клетки?',
            answers: [
              { id: 'push', text: 'Да', value: 'push' },
              { id: 'skip', text: 'Нет', value: 'skip' },
            ],
          },
        },
        {
          id: 'coil_push',
          type: 'PUSH_FIGHTERS',
          end: true,
          conditions: {
            all: [{ var: '$pushAnswer', operator: 'equal', value: 'push' }],
          },
          params: { sourceId: 'tesla', targets: '$candidates', maxSteps: 1 },
        },
      ],
    },
  ],
};
