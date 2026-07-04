<template>
  <div
    class="flex flex-col p-12 rounded-12 bg-linear-to-r from-white/5 to-transparent bg-black-100 border transition-all border-white/30 relative overflow-hidden group"
    :class="[
      item.acted && 'grayscale',
      isStacked && index > 0 && `-mt-50`,
      isStacked && !isSelected && !isPipelineTargetCard && `z-${index}`,
      isSelected && !isPipelineTargetCard && `z-1000! border-(--brand-color)! to-white-30!`,
      isPipelineTargetCard && 'z-1000! border-2! border-white/60',
      slashing && 'overflow-visible!',
    ]"
    :style="{ '--brand-color': player.color }"
    v-if="item && player"
    @click.stop="client.moves.selectTarget({ fighterId: item.id })"
  >
    <div
      v-if="slashing"
      class="pointer-events-none absolute inset-0 z-30 overflow-visible rounded-12"
      aria-hidden="true"
    >
      <svg class="damage-lightning damage-lightning--card" viewBox="0 0 40 80">
        <path :d="LIGHTNING_PATH_D" />
      </svg>
    </div>

    <div class="flex flex-1 justify-between gap-24">
      <div class="flex flex-1 gap-8 items-center">
        <div class="relative shrink-0">
          <NuxtImg
            loading="lazy"
            :src="item.image"
            class="w-45 h-45 rounded-full border-2 object-cover shadow-xl select-none"
            :class="[isDraggable && 'cursor-grab active:cursor-grabbing']"
            :style="{ borderColor: player.color }"
            alt=""
            @mousedown.prevent="onStartDragging"
            :draggable="false"
          />
          <svg
            v-if="slashing"
            class="damage-lightning damage-lightning--avatar pointer-events-none absolute inset-0"
            viewBox="0 0 40 80"
            aria-hidden="true"
          >
            <path :d="LIGHTNING_PATH_D" />
          </svg>
        </div>

        <div class="flex flex-col flex-1 gap-4">
          <div class="flex justify-between gap-20 leading-none">
            <h4 class="font-black text-14 uppercase truncate tracking-wide leading-tight">
              {{ item.name }}
            </h4>

            <div class="flex gap-10">
              <div class="flex gap-4">
                <div class="text-14 font-bold text-slate-300 font-mono">
                  {{ Number(item.move) + Number(item.bonusMovement) }}
                </div>
                <div
                  class="text-14 font-bold text-cyan-400 font-mono"
                  v-if="G.bonus && ctx.phase === 'MOVEMENT' && isMyFighter"
                >
                  +{{ G.bonus }}
                </div>
                <Icon name="game-icons:walking-boot" class="text-slate-500 size-14! self-start" />
              </div>

              <component :is="rangeType" class="text-slate-500 w-13 h-13" />
            </div>
          </div>

          <div class="flex justify-between gap-20 leading-none">
            <div class="text-10 font-bold text-slate-500 uppercase tracking-widest leading-none">
              {{ item.type === 'hero' ? 'Герой' : 'Помощник' }}
            </div>

            <div class="flex items-end gap-4">
              <span
                class="text-12 font-black font-mono transition-colors duration-200"
                :class="displayHp < item.hp / 3 ? 'text-rose-500' : 'text-white'"
              >
                {{ displayHp
                }}<span class="text-slate-400"><span class="mx-3">/</span>{{ item.hp }}</span>
              </span>
              <span class="text-12 font-extrabold text-slate-500 uppercase tracking-wide">HP</span>
            </div>
          </div>

          <div class="flex flex-col">
            <div class="h-6 w-full bg-black/40 rounded-full border border-white/5 overflow-hidden">
              <div
                class="h-6 rounded-full relative shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-[width] duration-500 ease-out"
                :class="getHealthColor(displayHp, item.hp)"
                :style="{ width: (displayHp / item.hp) * 100 + '%' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <Note v-if="item.currentHp === 0">Смерть</Note>
    <Note v-else-if="item.acted">Завершил</Note>
  </div>
</template>
<script setup>
import IconSword from '~/svg/sword.svg';
import IconBow from '~/svg/bow.svg';
import IconFlail from '~/svg/flail.svg';
import Note from '~/components/molecules/sidebar/Note.vue';
import { useGlobalDrag } from '~/composables/game/useGlobalDrag';
import { useKonvaPlacement } from '~/composables/konva/useKonvaPlacement';
import { useBoardgame } from '~/composables/game/useBoardgame';
import { useCardPlayPhase } from '~/composables/game/useCardPlayPhase';
import { useFighterDamageSlash, DAMAGE_SLASH_MS, LIGHTNING_PATH_D } from '~/composables/game/useFighterDamageSlash';
import { getOwnPickedId } from '#shared/utils/rules/helpers';

const { group, item, player } = defineProps({
  item: { type: Object, default: null },
  player: { type: Object, default: null },
  group: { type: Array, default: () => [] },
});

const { client, G, ctx, activePlayer } = useBoardgame();
const { isPipelineTarget } = useCardPlayPhase();
const isStacked = computed(() => group?.length > 1);
const isMyTurn = computed(() => {
  if (!(ctx.value || client.value)) return;
  return String(ctx.value.currentPlayer) === String(client.value.playerID);
});

const isMyFighter = computed(() => {
  if (!activePlayer.value) return;
  return String(activePlayer.value.id) === String(player.id);
});

const isDraggable = computed(() => {
  if (!ctx.value) return false;
  const isPlacement = ctx.value.phase === 'UNIT_PLACEMENT';
  return isMyTurn.value && isMyFighter.value && isPlacement;
});

const index = computed(() => group.findIndex(i => i.id === item.id));

const isSelected = computed(() => getOwnPickedId(G.value) === String(item.id));
const isPipelineTargetCard = computed(() => isPipelineTarget(item.id));
const { slashing, displayHp } = useFighterDamageSlash(
  () => item.id,
  () => item.currentHp,
);
const slashDuration = `${DAMAGE_SLASH_MS}ms`;

const rangeType = computed(() => {
  switch (item.rangeType) {
    case 'melee':
      return markRaw(IconSword);
    case 'ranged':
      return markRaw(IconBow);
    case 'through 1':
      return markRaw(IconFlail);
    default:
      return null;
  }
});

const getHealthColor = (current, max) => {
  const percent = (current / max) * 100;
  if (percent > 50) return 'bg-emerald-500';
  if (percent > 20) return 'bg-amber-500';
  return 'bg-rose-600';
};

const { startDrag } = useGlobalDrag();
const { executeDrop } = useKonvaPlacement();

const onStartDragging = () => {
  if (!isDraggable.value) return;

  startDrag(item, (event, fighter) => {
    executeDrop(event, fighter);
  });
};
</script>

<style scoped>
.damage-lightning {
  overflow: visible;
}

.damage-lightning--card {
  position: absolute;
  top: -4%;
  left: 14%;
  width: 32%;
  height: 108%;
}

.damage-lightning--avatar {
  position: absolute;
  width: 115%;
  height: 115%;
  left: -7.5%;
  top: -7.5%;
}

.damage-lightning path {
  fill: none;
  stroke: #f8fafc;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 1))
    drop-shadow(0 0 10px rgba(226, 232, 240, 0.95))
    drop-shadow(0 0 18px rgba(148, 163, 184, 0.75));
  stroke-dasharray: 130;
  stroke-dashoffset: 130;
  animation: damage-lightning-strike v-bind(slashDuration) ease-out forwards;
}

@keyframes damage-lightning-strike {
  0% {
    stroke-dashoffset: 130;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  42% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}
</style>
