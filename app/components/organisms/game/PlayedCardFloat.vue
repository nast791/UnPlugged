<template>
  <Teleport to="body">
    <div
      v-if="showOverlay"
      class="fixed inset-0 z-190 bg-black/65 backdrop-blur-[2px]"
      @click="skipToMini"
    />
    <div
      v-if="showFloat && playedCard && ownerPlayer"
      class="fixed z-200 overflow-hidden transition-shadow"
      :class="[
        displayMode === 'mini' && 'cursor-pointer rounded-[3px] shadow-[0_4px_24px_rgba(0,0,0,0.7)] ring-1 ring-white/20',
        displayMode !== 'mini' && 'shadow-2xl rounded-[4px]',
        (displayMode === 'mini' || displayMode === 'center' || displayMode === 'expanded') &&
          'cursor-pointer',
      ]"
      :style="floatStyle"
      @click.stop="onFloatClick"
    >
      <Card :item="playedCard" :player="ownerPlayer" presentational />
    </div>
  </Teleport>
</template>

<script setup>
import Card from '~/components/molecules/game/Card.vue';
import {
  CENTER_HOLD_MS,
  MINI_WIDTH,
  clearCardPlayFlyOrigin,
  getAnchorRect,
  getViewportCenterRect,
  useCardPlayAnimation,
} from '~/composables/game/useCardPlayAnimation';
import { useCardPlayPresentation } from '~/composables/game/useCardPlayPresentation';

const { mapContainer } = defineProps({
  mapContainer: { type: Object, default: null },
});

const FULL_WIDTH = 220;
const FLY_MS = 520;

const { flyOrigin, flyClone } = useCardPlayAnimation();
const { playedCard, ownerPlayer, hasPlayedCard, dismiss } = useCardPlayPresentation();

const showFloat = ref(false);
const displayMode = ref('hidden');
const pos = reactive({ left: 0, top: 0, width: FULL_WIDTH });
const transitionMs = ref(0);

let runId = 0;

const showOverlay = computed(
  () => showFloat.value && (displayMode.value === 'center' || displayMode.value === 'expanded'),
);

const floatStyle = computed(() => ({
  left: `${pos.left}px`,
  top: `${pos.top}px`,
  width: `${pos.width}px`,
  transitionProperty: 'left, top, width',
  transitionDuration: `${transitionMs.value}ms`,
  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
}));

const wait = ms => new Promise(r => setTimeout(r, ms));

const moveTo = (rect, animated = true) => {
  transitionMs.value = animated ? FLY_MS : 0;
  pos.left = rect.left;
  pos.top = rect.top;
  pos.width = rect.width;
};

const miniRect = () =>
  getAnchorRect(mapContainer, MINI_WIDTH, (MINI_WIDTH * 7) / 5) ?? {
    left: 0,
    top: 0,
    width: MINI_WIDTH,
    height: (MINI_WIDTH * 7) / 5,
  };

const centerRect = () => getViewportCenterRect(FULL_WIDTH, (FULL_WIDTH * 7) / 5);

const skipToMini = () => {
  if (displayMode.value !== 'center' && displayMode.value !== 'expanded') return;
  runId++;
  const animate = displayMode.value === 'expanded';
  displayMode.value = 'mini';
  moveTo(miniRect(), animate);
  clearCardPlayFlyOrigin();
};

const runPresentation = async () => {
  const origin = flyOrigin.value;
  if (!origin || !hasPlayedCard.value) return;

  const id = ++runId;
  showFloat.value = true;
  displayMode.value = 'center';

  moveTo(origin, false);
  await nextTick();

  moveTo(centerRect(), true);
  await wait(FLY_MS + 40);
  if (id !== runId || !hasPlayedCard.value) return;

  await wait(CENTER_HOLD_MS);
  if (id !== runId || !hasPlayedCard.value) return;

  moveTo(miniRect(), true);
  await wait(FLY_MS + 40);
  if (id !== runId || !hasPlayedCard.value) return;

  displayMode.value = 'mini';
  clearCardPlayFlyOrigin();
};

const expand = () => {
  displayMode.value = 'expanded';
  moveTo(centerRect(), true);
};

const collapse = () => {
  skipToMini();
};

const onFloatClick = () => {
  if (displayMode.value === 'mini') {
    expand();
    return;
  }
  if (displayMode.value === 'center' || displayMode.value === 'expanded') {
    skipToMini();
  }
};

watch(
  () => flyClone.value,
  clone => {
    if (!clone || !hasPlayedCard.value) return;
    runId++;
    displayMode.value = 'hidden';
    nextTick(() => runPresentation());
  },
);

watch(hasPlayedCard, active => {
  if (!active) {
    runId++;
    showFloat.value = false;
    displayMode.value = 'hidden';
    clearCardPlayFlyOrigin();
    dismiss();
  }
});
</script>
