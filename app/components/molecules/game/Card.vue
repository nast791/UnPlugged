<template>
  <div
    class="flex flex-col relative aspect-[5/7] w-full @container rounded-[0.5cqw] overflow-hidden shadow-2xl border-[0.05cqw] border-black bg-slate-900 group select-none"
    :style="{ '--brand-color': settings.color }"
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
      class="flex flex-col gap-[2cqw] w-full min-h-[60cqw] max-h-[60cqw] relative flex-1 bg-slate-950/95 border-t-[0.2cqw] border-white/10 p-[4cqw] pb-[3cqw]"
    >
      <div
        class="absolute -top-[6cqw] right-[4cqw] w-[12cqw] h-[12cqw] rounded-full text-[5.5cqw] font-bold text-white bg-slate-900 border-[0.5cqw] border-white flex items-center justify-center shadow-xl leading-none"
      >
        {{ item.bonus }}
      </div>

      <h3 class="text-white font-black uppercase text-[5.3cqw] leading-tight tracking-tight">
        {{ item.title }}
      </h3>

      <div class="flex flex-col gap-[4cqw] justify-between flex-1">
        <div class="text-slate-300 text-[4.6cqw] leading-[1.3]">
          <div
            v-html="
              item.text.replace(
                /(НЕМЕДЛЕННО:|ВО ВРЕМЯ БОЯ:|ПОСЛЕ БОЯ:)/g,
                '<b class=\'text-white\'>$1</b>',
              )
            "
          />
        </div>

        <div class="flex justify-between items-center opacity-50">
          <span class="text-[3.3cqw] text-white uppercase font-bold tracking-widest">
            {{ player.id }}
          </span>
          <span class="text-[3.3cqw] text-white font-mono">x{{ item.quantity }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useAppStore } from '~/store/app.js';

const { item, player } = defineProps({
  item: {
    type: Object,
    required: true,
  },
  player: {
    type: Object,
    required: true,
  },
});

const { glossary } = storeToRefs(useAppStore());

const settings = computed(() => glossary?.value?.meta?.cards?.[item.type] || {});

const fighterName = computed(
  () => player?.fighters.find(i => item.fighter === i.id)?.name || 'все',
);
</script>
