<template>
  <footer :class="styles.footer()">
    <div v-if="isValidSelection" class="flex items-center gap-12 select-none group">
      <span class="text-12 font-black uppercase tracking-[0.1em] text-slate-500 transition-colors group-hover:text-slate-400">
        Режим
      </span>

      <div v-if="players.length === 2" :class="styles.badge({ mode: 'duel' })">
        <span :class="styles.badgeText({ mode: 'duel' })">
          Дуэль
        </span>
      </div>
    </div>

    <Primitive
      as="button"
      :disabled="!isReady"
      :class="styles.startButton()"
      @click="$emit('start')"
    >
      Начать битву
    </Primitive>
  </footer>
</template>

<script setup>
import { useAppStore } from '~/store/app';

const {players, map} = defineProps({
  players: { type: Array, default: () => [] },
  map: { type: Object, default: null },
  isReady: { type: Boolean, default: false }
});

const { glossary } = storeToRefs(useAppStore());
defineEmits(['start']);

const human = computed(() => glossary.value?.meta?.players?.[0]);
const hasPlayer = computed(() => players.some(i => i.type === human.value?.id));
const isValidSelection = computed(() => players.length > 1 && map && hasPlayer.value);

const footerStyles = tv({
  slots: {
    footer: 'p-24 bg-slate-800/30 flex justify-between items-center',
    badge: 'relative px-12 py-2 rounded-8 border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
    badgeText: 'text-12 font-black uppercase tracking-[0.05em]',
    startButton: 'ml-auto px-10 py-3 rounded-xl bg-linear-to-r from-brand-violet to-brand-fuchsia text-white font-black italic uppercase tracking-wider transition hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-default cursor-pointer'
  },
  variants: {
    mode: {
      duel: {
        badge: 'bg-linear-to-r from-fuchsia-500/10 to-fuchsia-600/5 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]',
        badgeText: 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]'
      }
      // Тут можно добавить 'team' или 'solo' позже
    }
  }
});

const styles = footerStyles();
</script>