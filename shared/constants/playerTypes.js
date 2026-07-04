export const PLAYER_TYPES = {
  HUMAN: { id: 'human', name: 'Игрок' },
  AI: { id: 'ai', name: 'ИИ' },
};

export const PLAYER_TYPE_LIST = [PLAYER_TYPES.HUMAN, PLAYER_TYPES.AI];

export const PLAYER_SIDEBAR_ROLES = {
  SELF: 'Вы',
  AI: 'ИИ',
  HUMAN: 'Человек',
  TEAMMATE: 'Соратник',
};

/** Размер пары в командном режиме (2v2). */
export const TEAM_PAIR_SIZE = 2;
