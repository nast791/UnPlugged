import { runMove } from '../rules/moves.js';
import { getActivePlayer, resolvePlayer } from '../rules/helpers.js';
import { EFFECT_TRIGGERS } from '../../constants/triggers.js';
import { evaluateTrigger, startPipeline } from '../rules/pipeline.js';

const getHookActions = hook => hook.actions ?? hook.event?.params?.actions;

export const runHeroSkills = (
  { G, ctx, events },
  trigger,
  { playerId, pendingOnly = false } = {},
) => {
  const ownerId = String(playerId ?? ctx.currentPlayer);
  const ownerCtx = { ...ctx, currentPlayer: ownerId };
  const player = resolvePlayer(G, ownerCtx, { playerId: ownerId });
  const hooks = (player?.skill?.triggers ?? []).filter(h => h.trigger === trigger);

  for (const hook of hooks) {
    if (!evaluateTrigger(trigger, hook, G, ownerCtx)) continue;

    const actions = getHookActions(hook);
    if (actions?.length) {
      startPipeline(G, ownerCtx, events, actions, player.skill.id);
      return pendingOnly ? G.pipeline !== null : true;
    }
  }
  return false;
};

export const runAllHeroSkills = ({ G, ctx, events }, trigger) => {
  for (let i = 0; i < G.players.length; i++) {
    if (runHeroSkills({ G, ctx, events }, trigger, { playerId: String(i), pendingOnly: true })) {
      return true;
    }
  }
  return false;
};

export const turnStart = {
  next: 'ACTION_SELECTION',
  turn: {
    onBegin: ({ G, ctx, events }) => {
      const player = getActivePlayer(G, ctx);
      const isHeroAlive = player.fighters.some(f => f.type === 'hero' && (f.currentHp ?? 0) > 0);
      if (!isHeroAlive) return events.endTurn();
    },
  },
  onBegin: ({ G, ctx, events }) => {
    const player = getActivePlayer(G, ctx);
    const isHeroAlive = player.fighters.some(f => f.type === 'hero' && (f.currentHp ?? 0) > 0);
    if (!isHeroAlive) return;

    G.turn++;
    player.actionsUsed = 0;
    player.actionsPoints = 2;
    player.fighters.forEach(f => {
      f.startPosition = f.position;
    });
    G.targetSelection = null;

    if (!runHeroSkills({ G, ctx, events }, EFFECT_TRIGGERS.START_TURN)) {
      runMove('END_PHASE', { G, events });
    }
  },
  onEnd: ({ G, ctx }) => {
    const player = getActivePlayer(G, ctx);
    const round = Math.floor(G.turn / G.players.length) + 1;
    runMove('LOG', { G, ctx }, { message: `Ход игрока: ${player.name} (Раунд ${round})` });
  },
};
