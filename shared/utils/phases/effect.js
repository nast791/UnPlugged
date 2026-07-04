import { runMove } from '../rules/moves.js';

import { runEvent } from '../rules/events.js';

import { getPlayableEffectCardIds } from '../rules/pipeline.js';

import { getActivePlayer } from '../rules/helpers.js';



export const effect = {

  onBegin: ({ G, ctx }) => {

    runEvent(G, ctx, 'SELECT_CARDS', {

      params: {

        types: ['effect'],

        phase: 'EFFECT',

        source: 'hand',

        selection: 1,

        message: 'Выберите карту эффекта',

        candidates: getPlayableEffectCardIds(G, ctx),

      },

      return: '$effectCardId',

    });

    runMove('REFRESH_CARD_UI', { G, ctx });

  },

  next: ({ G, ctx }) => {

    const player = getActivePlayer(G, ctx);

    if (player.actionsUsed >= player.actionsPoints) {

      return 'TURN_END';

    }

    return 'ACTION_SELECTION';

  },

  onEnd: ({ G, ctx }) => {

    G.combat = null;

    G.selectedCardId = null;



    const player = getActivePlayer(G, ctx);

    player.actionsUsed++;



    if (player.actionsUsed >= player.actionsPoints) {

      runMove('LOG', { G, ctx }, { message: `Действия игрока ${player.name} исчерпаны.` });

    }

  },

};

