<template>
  <div
    class="flex flex-col p-12 rounded-12 bg-linear-to-r from-white/5 to-transparent bg-[#1b1c21] border transition-all border-white/30 relative overflow-hidden group"
    :class="[item.acted && 'grayscale opacity-50', isStacked && item.index > 0 && '-mt-20']"
    v-if="item && player"
  >
    <div class="flex flex-1 justify-between gap-24">
      <div class="flex gap-8 items-center">
        <NuxtImg
          loading="lazy"
          :src="item.imageSrc"
          class="w-37 h-37 rounded-full border-2 object-cover shadow-xl"
          :style="{ borderColor: player.color }"
          alt=""
        />
        <div flex flex-col gap-4>
          <h4 class="font-black text-14 uppercase truncate tracking-wide leading-tight">
            {{ item.name }}
          </h4>
          <p class="text-10 font-bold text-slate-500 uppercase tracking-widest leading-none">
            {{ item.type === 'hero' ? 'Герой' : 'Помощник' }}
          </p>
        </div>
      </div>

      <div
        class="flex flex-col items-end gap-2 bg-blue-500/10 px-8 py-2 rounded border border-blue-500/20 leading-tight"
      >
        <div class="flex gap-4">
          <div class="text-14 font-bold text-white font-mono">{{ item.move }}</div>
          <IconFoot class="text-slate-500 w-15 h-15" />
        </div>
        <div class="flex gap-4">
          <div class="text-14 font-bold text-white font-mono uppercase tracking-wide">
            {{ item.rangeType }}
          </div>
          <IconSwords class="text-slate-500 w-15 h-15" />
        </div>
      </div>
    </div>

    <div class="flex gap-4 relative z-10">
      <!-- Инфо о бойце -->
      <div class="flex-1 min-w-0 flex flex-col justify-between">
        <!-- Визуализация HP -->
        <div class="mt-12">
          <div class="flex justify-between items-end mb-4">
            <span
              class="text-12 font-black font-mono tracking-tighter"
              :class="item.currentHp < item.hp / 3 ? 'text-rose-500' : 'text-slate-400'"
            >
              {{ item.currentHp }} <span class="opacity-30">/ {{ item.hp }}</span>
            </span>
            <span class="text-12 font-bold text-slate-600 uppercase">HP</span>
          </div>
          <div
            class="h-6 w-full bg-black/40 rounded-full border border-white/5 p-1.5 overflow-hidden"
          >
            <div
              class="h-6 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              :class="getHealthColor(item.currentHp, item.hp)"
              :style="{ width: (item.currentHp / item.hp) * 100 + '%' }"
            />
          </div>
        </div>
      </div>
    </div>

    <Note v-if="item.currentHp === 0">Смерть</Note>
    <Note v-else-if="item.acted">Завершил</Note>
  </div>
</template>
<script setup>
import IconFoot from '~/svg/footprint.svg';
import IconSwords from '~/svg/swords.svg';
import Note from '~/components/molecules/game-sidebar/Note.vue';

const { count, item, player } = defineProps({
  item: { type: Object, default: null },
  player: { type: Object, default: null },
  count: { type: Number, default: 1 },
});

const isStacked = computed(() => count > 1);

const getHealthColor = (current, max) => {
  const percent = (current / max) * 100;
  if (percent > 50) return 'bg-emerald-500';
  if (percent > 20) return 'bg-amber-500';
  return 'bg-rose-600';
};

const stackStyle = computed(() => {
  if (!isStacked.value) return { position: 'relative' };

  const step = 35;
  const isActive = item.active;

  return {
    gridArea: '1 / 1', // Все карты накладываются друг на друга в одной ячейке
    // Сдвигаем карты вправо. Активную карту можно НЕ сдвигать или сдвигать чуть-чуть
    transform: `translateX(${item.index * step}px)`,
    zIndex: isActive ? 50 : 10 + item.index,

    // Вместо translateY (прыжка вверх), лучше выделить карту яркостью или границей
    filter: isActive ? 'brightness(1.2)' : 'brightness(0.8)',
    border: isActive ? `1px solid ${player.color}` : '1px solid rgba(255,255,255,0.05)',

    transition: 'all 0.3s ease-out',
    maxWidth: 'calc(100% - 60px)', // Ограничиваем ширину, чтобы хвост не вылезал
  };
});
</script>
