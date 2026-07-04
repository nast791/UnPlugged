import { isEmpty } from '#shared/constants/operators.js';
import { getHandCardId } from '#shared/utils/rules/helpers.js';
import { CARD_PLAY_ACTION_PHASES } from '#shared/constants/cardPlay.js';
import { useBoardgame } from '~/composables/game/useBoardgame';

const isAwaitingSelection = (G, kind) => {
  const sel = G?.targetSelection;
  if (!sel || sel.kind !== kind || !sel.returnKey) return false;
  if (G?.outputVar === sel.returnKey) return true;
  return isEmpty(G?.vars?.[sel.returnKey]);
};

export const useCardPlayPhase = () => {
  const { client, G, ctx } = useBoardgame();

  const isMyTurn = computed(() => {
    if (!ctx.value || !client.value) return false;
    return String(ctx.value.currentPlayer) === String(client.value.playerID);
  });

  const myPlayerId = computed(() => client.value?.playerID ?? null);

  const phase = computed(() => ctx.value?.phase ?? null);
  const targetSelection = computed(() => G.value?.targetSelection ?? null);

  const isCardPlayPhase = computed(() => CARD_PLAY_ACTION_PHASES.includes(phase.value));

  const cardCandidates = computed(() => {
    const sel = targetSelection.value;
    if (!sel || sel.kind !== 'card') return new Set();
    return new Set(sel.candidates.map(String));
  });

  const isSelectingMainCard = computed(
    () =>
      isMyTurn.value &&
      isCardPlayPhase.value &&
      !G.value?.pipeline &&
      targetSelection.value?.kind === 'card',
  );

  const isPipelineCardSelection = computed(
    () => isMyTurn.value && isAwaitingSelection(G.value, 'card') && !!G.value?.pipeline,
  );

  const isHandCardSelection = computed(
    () => isSelectingMainCard.value || isPipelineCardSelection.value,
  );

  const isCardSelectable = card => {
    if (!isHandCardSelection.value) return false;
    return cardCandidates.value.has(getHandCardId(card));
  };

  const isCardDisabled = card => {
    const id = String(getHandCardId(card));
    const ui = G.value?.handCardUI;

    if (ui?.selectableIds?.length) {
      return !ui.selectableIds.map(String).includes(id);
    }
    if (ui?.disabledIds?.map(String).includes(id)) return true;

    return isHandCardSelection.value && !isCardSelectable(card);
  };

  const isSelectingOpponent = computed(
    () => isMyTurn.value && isAwaitingSelection(G.value, 'opponent'),
  );

  const isOpponentSelectable = playerId => {
    if (!isSelectingOpponent.value) return false;
    return targetSelection.value.candidates.map(String).includes(String(playerId));
  };

  const isSelectingTarget = computed(
    () => isMyTurn.value && isAwaitingSelection(G.value, 'target'),
  );

  const isTargetSelectable = fighterId => {
    if (!isSelectingTarget.value) return false;
    return targetSelection.value.candidates.map(String).includes(String(fighterId));
  };

  const isSelectingCell = computed(
    () => isMyTurn.value && isAwaitingSelection(G.value, 'cell'),
  );

  const isCellSelectable = cellId =>
    isSelectingCell.value &&
    targetSelection.value.candidates.map(String).includes(String(cellId));

  const isOwnFighterPhase = computed(() =>
    ['UNIT_PLACEMENT', 'MOVEMENT'].includes(phase.value),
  );

  const isOwnFighterSelectable = (fighter, playerId) => {
    if (!isMyTurn.value) return false;
    if (isTargetSelectable(fighter.id)) return true;
    if (!isOwnFighterPhase.value) return false;
    if (String(playerId) !== String(myPlayerId.value)) return false;
    if ((fighter.currentHp ?? 0) <= 0) return false;
    return true;
  };

  /** Боец в списке целей pipeline (свой или чужой). */
  const isPipelineTarget = fighterId => isTargetSelectable(fighterId);

  const isFighterSelectable = (fighter, playerId) => {
    if (isTargetSelectable(fighter.id)) return true;
    if (isOwnFighterSelectable(fighter, playerId)) return true;
    return false;
  };

  return {
    phase,
    isCardPlayPhase,
    isSelectingMainCard,
    isPipelineCardSelection,
    isHandCardSelection,
    isCardSelectable,
    isCardDisabled,
    isSelectingOpponent,
    isOpponentSelectable,
    isSelectingTarget,
    isTargetSelectable,
    isSelectingCell,
    isCellSelectable,
    isOwnFighterPhase,
    isOwnFighterSelectable,
    isFighterSelectable,
    isPipelineTarget,
  };
};
