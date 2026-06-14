import { runMove } from '../rules/moves.js';
import { EFFECT_TRIGGERS } from '../../constants/triggers.js';
import { runAllHeroSkills } from './turnstart.js';

export const startGame = {
  next: 'TURN_START',
  onBegin: ({ G, ctx, events }) => {
    if (runAllHeroSkills({ G, ctx, events }, EFFECT_TRIGGERS.START_GAME)) {
      return;
    }
    runMove('END_PHASE', { G, events });
  },
};
