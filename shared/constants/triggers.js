/** Когда код игры вызывает runHeroSkills({ G, ctx, events }, trigger). */
export const EFFECT_TRIGGERS = {
  START_GAME: 'start_game',
  START_TURN: 'start_turn',
  END_TURN: 'end_turn',
  ON_MOVEMENT: 'on_movement',
  ON_EFFECT: 'on_effect',
  BEFORE_COMBAT: 'before_combat',
  DURING_COMBAT: 'during_combat',
  AFTER_COMBAT: 'after_combat',
  INSTANT: 'instant',
};

export const TRIGGER_SOURCES = {
  [EFFECT_TRIGGERS.START_GAME]: {
    file: 'shared/utils/phases/startgame.js',
    hook: 'onBegin',
    status: 'active',
  },
  [EFFECT_TRIGGERS.START_TURN]: {
    file: 'shared/utils/phases/turnstart.js',
    hook: 'onBegin',
    status: 'active',
  },
  [EFFECT_TRIGGERS.END_TURN]: {
    file: 'shared/utils/phases/turnend.js',
    hook: 'onBegin',
    status: 'active',
  },
  [EFFECT_TRIGGERS.ON_MOVEMENT]: {
    file: 'shared/utils/phases/movement.js',
    hook: 'onBegin',
    status: 'planned',
  },
  [EFFECT_TRIGGERS.ON_EFFECT]: {
    file: 'shared/utils/phases/effect.js',
    hook: 'onBegin',
    status: 'planned',
  },
  [EFFECT_TRIGGERS.BEFORE_COMBAT]: {
    file: 'shared/utils/phases/attack.js',
    hook: 'combat',
    status: 'planned',
  },
  [EFFECT_TRIGGERS.DURING_COMBAT]: {
    file: 'shared/utils/phases/attack.js',
    hook: 'combat',
    status: 'planned',
  },
  [EFFECT_TRIGGERS.AFTER_COMBAT]: {
    file: 'shared/utils/phases/attack.js',
    hook: 'combat',
    status: 'planned',
  },
  [EFFECT_TRIGGERS.INSTANT]: {
    file: 'shared/utils/rules/pipeline.js',
    hook: 'runEvent / evaluateTrigger',
    status: 'planned',
  },
};

export const TRIGGER_VALUES = Object.values(EFFECT_TRIGGERS);
