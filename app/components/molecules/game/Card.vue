<template>
  <div
    ref="rootRef"
    class="flex flex-col relative aspect-[5/7] w-full @container rounded-[0.5cqw] overflow-hidden shadow-2xl border-[0.05cqw] border-black bg-slate-900 group select-none transition-all"
    :class="[
      item.isReversed ? '-translate-y-[3%]' : !disabled && !presentational && 'hover:-translate-y-[3%]',
      disabled && 'opacity-35 grayscale pointer-events-none cursor-not-allowed',
      selectable && 'cursor-pointer',
      presentational && 'pointer-events-none',
    ]"
    :style="{ '--brand-color': settings.color }"
    @click.stop="onRootClick"
  >
    <div class="relative aspect-square overflow-hidden">
      <NuxtImg
        src="/images/foto.jpg"
        class="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        alt=""
      />

      <div class="flex flex-col w-[16cqw] relative z-1 text-white">
        <div
          :class="[
            `bg-(--brand-color)`,
            'p-[2cqw] flex flex-col gap-[1.5cqw] items-center justify-center text-[8cqw] font-black border-[0.2cqw] border-white/20 h-[25cqw] leading-none',
          ]"
        >
          <icon
            :name="settings.icon"
            class="text-[9cqw]"
            :class="[item.type === 'scheme' && 'text-[11cqw]']"
          />
          {{ item.value }}
        </div>

        <div
          class="bg-black/80 px-[0.5cqw] py-[4cqw] rounded-b-[1.5cqw] border-[0.2cqw] border-white/20 flex items-center justify-center text-[4.5cqw] font-bold text-white uppercase tracking-[0.1em]"
        >
          <span class="[writing-mode:vertical-lr] rotate-180">
            {{ fighterName }}
          </span>
        </div>
      </div>
    </div>

    <div
      class="card-lower flex flex-col flex-1 min-h-[60cqw] max-h-[60cqw] relative border-t-[0.2cqw] border-white/10"
    >
      <div
        class="card-bonus absolute -top-[6cqw] right-[4cqw] w-[12cqw] h-[12cqw] rounded-full text-[5.5cqw] font-bold text-white border-[0.5cqw] border-white/80 flex items-center justify-center shadow-xl leading-none z-2"
      >
        {{ item.bonus }}
      </div>

      <div class="shrink-0 px-[4cqw] pt-[4cqw] pb-[2.5cqw]">
        <h3
          class="text-white font-black uppercase text-[5.3cqw] leading-tight tracking-tight pr-[11cqw]"
        >
          {{ item.title }}
        </h3>
        <div
          class="mt-[2.5cqw] h-[0.2cqw] bg-white/25 rounded-full"
          aria-hidden="true"
        />
      </div>

      <div class="relative flex-1 min-h-0">
        <ScrollArea ref="scrollRef" class="card-body-scroll h-full">
          <div
            class="px-[4cqw] py-[2.5cqw] text-rose-100/85 text-[5.1cqw] leading-[1.35]"
            v-html="formattedText"
          />
        </ScrollArea>
        <div
          v-show="scrollFade"
          class="card-scroll-fade pointer-events-none absolute inset-x-0 bottom-0 h-[10cqw]"
          aria-hidden="true"
        />
      </div>

      <div
        class="shrink-0 flex justify-between items-center px-[4cqw] py-[2cqw] pb-[3cqw] border-t-[0.15cqw] border-white/8 opacity-50"
      >
        <span class="text-[3.3cqw] text-white uppercase font-bold tracking-widest">
          {{ packLabel }}
        </span>
        <span class="text-[3.3cqw] text-white font-mono">x{{ item.quantity ?? 1 }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import ScrollArea from '~/components/atoms/ScrollArea.vue';
import { getCardType } from '#shared/constants/cardTypes';
import { getHandCardId } from '#shared/utils/rules/helpers.js';
import { useBoardgame } from '~/composables/game/useBoardgame';
import { useCardPlayPhase } from '~/composables/game/useCardPlayPhase';
import { setCardPlayFlyOrigin } from '~/composables/game/useCardPlayAnimation';

const { item, player, presentational } = defineProps({
  item: {
    type: Object,
    required: true,
  },
  player: {
    type: Object,
    required: true,
  },
  presentational: {
    type: Boolean,
    default: false,
  },
});

const settings = computed(() => getCardType(item.type));
const { client, ctx } = useBoardgame();
const { isHandCardSelection, isCardSelectable, isCardDisabled } = useCardPlayPhase();

const fighterName = computed(
  () => player?.fighters.find(i => item.fighter === i.id)?.name || 'все',
);

const packLabel = computed(() => String(player?.packId ?? player?.id ?? '').toUpperCase());

const formattedText = computed(() =>
  (item.text ?? '').replace(
    /(МГНОВЕННО:|ВО ВРЕМЯ БИТВЫ:|ПОСЛЕ БИТВЫ:)/g,
    '<b class=\'text-white\'>$1</b>',
  ),
);

const cardId = computed(() => getHandCardId(item));
const disabled = computed(() => isCardDisabled(item));
const selectable = computed(() => isHandCardSelection.value && isCardSelectable(item));

const rootRef = ref(null);
const scrollRef = ref(null);
const scrollFade = ref(false);

let scrollViewport = null;
let scrollResizeObserver = null;

const getScrollViewport = () =>
  scrollRef.value?.$el?.querySelector('[data-radix-scroll-area-viewport]') ?? null;

const updateScrollFade = () => {
  const viewport = scrollViewport ?? getScrollViewport();
  if (!viewport) {
    scrollFade.value = false;
    return;
  }
  const { scrollTop, scrollHeight, clientHeight } = viewport;
  scrollFade.value =
    scrollHeight > clientHeight + 2 && scrollTop + clientHeight < scrollHeight - 2;
};

const bindScrollViewport = () => {
  scrollViewport?.removeEventListener('scroll', updateScrollFade);
  scrollResizeObserver?.disconnect();

  scrollViewport = getScrollViewport();
  if (!scrollViewport) {
    scrollFade.value = false;
    return;
  }

  scrollViewport.addEventListener('scroll', updateScrollFade, { passive: true });
  scrollResizeObserver = new ResizeObserver(updateScrollFade);
  scrollResizeObserver.observe(scrollViewport);
  updateScrollFade();
};

onMounted(() => nextTick(bindScrollViewport));
onUnmounted(() => {
  scrollViewport?.removeEventListener('scroll', updateScrollFade);
  scrollResizeObserver?.disconnect();
});
watch(() => item.text, () => nextTick(updateScrollFade));

const handleCardClick = () => {
  if (disabled.value) return;

  if (selectable.value) {
    setCardPlayFlyOrigin(rootRef.value);
    client.value?.moves?.selectCard?.({ cardId: cardId.value });
    return;
  }

  if (ctx.value?.phase === 'MOVEMENT' && client.value?.moves?.applyBonus) {
    client.value.moves.applyBonus(item.id);
  }
};

const onRootClick = () => {
  if (presentational) return;
  handleCardClick();
};
</script>

<style scoped>
.card-lower {
  --card-panel-bg: #4a2c3a;
  --card-panel-mid: #3a2230;
  --card-panel-deep: #2d1824;
  --card-bonus-bg: #5c3848;
  background:
    radial-gradient(120% 80% at 50% -20%, rgb(255 200 160 / 8%) 0%, transparent 55%),
    linear-gradient(180deg, var(--card-panel-bg) 0%, var(--card-panel-mid) 52%, var(--card-panel-deep) 100%);
}

.card-bonus {
  background: linear-gradient(145deg, var(--card-bonus-bg) 0%, var(--card-panel-mid) 100%);
  box-shadow:
    0 0.4cqw 1.2cqw rgb(0 0 0 / 35%),
    inset 0 0.15cqw 0.4cqw rgb(255 255 255 / 12%);
}

.card-scroll-fade {
  background: linear-gradient(to top, var(--card-panel-deep) 10%, transparent 100%);
}

.card-body-scroll :deep([data-radix-scroll-area-viewport]) {
  height: 100%;
}

.card-body-scroll :deep(.bg-slate-950\/10) {
  width: 0.35cqw;
  min-width: 3px;
  background: rgb(255 220 210 / 12%);
}

.card-body-scroll :deep(.bg-slate-700) {
  width: 0.35cqw;
  min-width: 3px;
  background: rgb(255 200 180 / 38%);
}
</style>
