import { resolveCardPlayContext } from '#shared/utils/combat.js';
import { useBoardgame } from '~/composables/game/useBoardgame';

/** hidden | flying | mini | expanded */
const stage = ref('hidden');

export const useCardPlayPresentation = () => {
  const { G, ctx } = useBoardgame();

  const playContext = computed(() => resolveCardPlayContext(G.value, ctx.value));
  const playedCard = computed(() => playContext.value?.card ?? null);
  const ownerId = computed(() => playContext.value?.ownerId ?? null);

  const ownerPlayer = computed(() => {
    const id = ownerId.value;
    if (id == null) return null;
    return G.value?.players?.find(p => String(p.id) === String(id)) ?? null;
  });

  const hasPlayedCard = computed(() => playedCard.value != null);

  const setStage = next => {
    stage.value = next;
  };

  const toggleExpanded = () => {
    if (stage.value === 'mini') stage.value = 'expanded';
    else if (stage.value === 'expanded') stage.value = 'mini';
  };

  const dismiss = () => {
    stage.value = 'hidden';
  };

  return {
    stage: readonly(stage),
    playContext,
    playedCard,
    ownerPlayer,
    hasPlayedCard,
    setStage,
    toggleExpanded,
    dismiss,
  };
};
