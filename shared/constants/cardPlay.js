import { GAME_PHASES } from './phases.js';

/** Фазы, в которых основное действие — розыгрыш карты из руки. */
export const CARD_PLAY_ACTION_PHASES = [
  GAME_PHASES.ATTACK,
  GAME_PHASES.DEFENSE,
  GAME_PHASES.EFFECT,
];

/** Vars pipeline, в которых хранится id целевого игрока. */
export const CARD_PLAY_TARGET_PLAYER_VARS = ['$opponentId', '$targetPlayerId'];

/** UI-тексты розыгрыша (оверлей, подсказки, консоль). */
export const CARD_PLAY_PROMPTS = {
  [GAME_PHASES.ATTACK]: {
    selectOpponent: 'Выберите игрока для атаки',
    selectTarget: title => `«${title}» — выберите цель`,
    toPlayer: (title, name) => `«${title}» — атака на игрока ${name}`,
    applying: title => `«${title}» разыграна`,
  },
  [GAME_PHASES.DEFENSE]: {
    selectOpponent: 'Выберите игрока',
    selectTarget: title => `«${title}» — выберите цель`,
    toPlayer: (title, name) => `«${title}» — защита игрока ${name}`,
    applying: title => `«${title}» разыграна`,
  },
  [GAME_PHASES.EFFECT]: {
    selectOpponent: 'Выберите игрока для эффекта',
    selectTarget: title => `Эффект «${title}» — выберите цель`,
    toPlayer: (title, name) => `Эффект «${title}» применяется к игроку ${name}`,
    applying: title => `Эффект «${title}» применяется`,
  },
};

export const isCardPlayActionPhase = phase =>
  CARD_PLAY_ACTION_PHASES.includes(phase);
