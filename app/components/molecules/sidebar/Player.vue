<template>
  <div
    class="flex items-center justify-between group transition-all rounded-8 px-8 -mx-8"
    :class="[
      selectable && 'cursor-pointer hover:bg-white/5',
      highlight && 'bg-red-950/20',
    ]"
    v-if="item"
    @click="handleClick"
  >
    <div class="flex flex-col">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-2">
          <h3
            class="text-20 font-black italic uppercase tracking-tight"
            :style="{ color: getContrastColor(item.color) <= 90 ? '#FFFFFF' : item.color }"
          >
            Игрок {{ item.index }}
          </h3>
          <div class="text-14 font-bold uppercase italic opacity-40 ml-6 self-end mb-2">
            {{ role }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-12">
      <div
        v-if="isTurn && actionsTotal > 0"
        class="flex items-center gap-6 text-slate-400 text-14 font-mono"
      >
        <div
          class="size-12 rounded-full animate-pulse shrink-0"
          :style="{ backgroundColor: item.color }"
        />
        <span>{{ actionsRemaining }}/{{ actionsTotal }}</span>
      </div>

      <div v-if="heroSkill" ref="skillHintRef" class="relative shrink-0">
        <button
          ref="skillButtonRef"
          type="button"
          class="text-slate-500 hover:text-white transition-colors cursor-pointer"
          :class="skillOpen && 'text-white'"
          :aria-expanded="skillOpen"
          aria-haspopup="dialog"
          @click.stop="toggleSkillHint"
        >
          <div
            class="w-25 h-25 rounded-full border font-black border-current flex items-center justify-center text-13 leading-none"
          >
            !
          </div>
        </button>

        <Teleport to="body">
          <div
            v-if="skillOpen"
            ref="skillPopoverRef"
            class="fixed z-200 w-280 max-w-[calc(100vw-2rem)] overflow-hidden rounded-12 border border-white/12 bg-black px-14 py-12 shadow-[0_12px_40px_rgba(0,0,0,0.65)] animate-in fade-in duration-150"
            :style="skillPopoverStyle"
            role="dialog"
            @click.stop
          >
            <div class="text-13 font-black uppercase tracking-wide text-amber-200/90 mb-8">
              {{ heroSkill.name }}
            </div>
            <p class="text-15 leading-snug text-slate-200/90">
              {{ heroSkill.text }}
            </p>
          </div>
        </Teleport>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onClickOutside } from '@vueuse/core';
import useUtils from '~/composables/useUtils';
import { useBoardgame } from '~/composables/game/useBoardgame';
import { getPlayerSidebarRole } from '#shared/utils/rules/helpers.js';

const { item, selectable, highlight } = defineProps({
  item: { type: Object, default: null },
  selectable: { type: Boolean, default: false },
  highlight: { type: Boolean, default: false },
});

const { client, G, activePlayer } = useBoardgame();
const { getContrastColor } = useUtils();

const skillHintRef = ref(null);
const skillButtonRef = ref(null);
const skillPopoverRef = ref(null);
const skillOpen = ref(false);
const skillPopoverStyle = ref(null);

const updateSkillPopoverPosition = () => {
  const button = skillButtonRef.value;
  if (!button) return false;

  const rect = button.getBoundingClientRect();
  skillPopoverStyle.value = {
    top: `${rect.bottom + 6}px`,
    left: `${rect.right}px`,
    transform: 'translateX(-100%)',
  };
  return true;
};

const role = computed(() =>
  getPlayerSidebarRole(item, client.value?.playerID, G.value?.players ?? []),
);

const heroSkill = computed(() => {
  const skill = item?.skill;
  if (!skill?.text) return null;
  return { name: skill.name || 'Способность героя', text: skill.text };
});

const isTurn = computed(() => activePlayer.value?.id === item.id);
const actionsTotal = computed(() => Number(activePlayer.value?.actionsPoints ?? 0));
const actionsRemaining = computed(() =>
  Math.max(0, actionsTotal.value - Number(activePlayer.value?.actionsUsed ?? 0)),
);

const toggleSkillHint = () => {
  if (skillOpen.value) {
    skillOpen.value = false;
    return;
  }
  if (!updateSkillPopoverPosition()) return;
  skillOpen.value = true;
};

onClickOutside(skillHintRef, event => {
  if (skillPopoverRef.value?.contains(event.target)) return;
  skillOpen.value = false;
});

watch(skillOpen, open => {
  if (!open) {
    skillPopoverStyle.value = null;
    return;
  }
  updateSkillPopoverPosition();
});

watch(
  () => item?.id,
  () => {
    skillOpen.value = false;
  },
);

const handleClick = () => {
  if (!selectable) return;
  client.value?.moves?.selectOpponentPlayer?.({ playerId: item.id });
};
</script>
