<template>
  <div
    class="flex flex-col p-12 rounded-12 bg-linear-to-r from-white/5 to-transparent bg-[#1b1c21] border transition-all border-white/30 relative overflow-hidden group"
    :class="[
      item.acted && 'grayscale',
      isStacked && item.index > 0 && `-mt-50`,
      isStacked && !item.active && `z-${item.index}`,
      item.active && `z-1000!`,
    ]"
    v-if="item && player"
    @click.stop="setActiveItem()"
  >
    <div class="flex flex-1 justify-between gap-24">
      <div class="flex flex-1 gap-8 items-center">
        <NuxtImg
          loading="lazy"
          :src="item.imageSrc"
          class="w-45 h-45 rounded-full border-2 object-cover shadow-xl"
          :style="{ borderColor: player.color }"
          alt=""
        />

        <div class="flex flex-col flex-1 gap-4">
          <div class="flex justify-between gap-20 leading-none">
            <h4 class="font-black text-14 uppercase truncate tracking-wide leading-tight">
              {{ item.name }}
            </h4>

            <div class="flex gap-10">
              <div class="flex gap-4">
                <div class="text-14 font-bold text-slate-300 font-mono">{{ item.move }}</div>
                <IconFoot class="text-slate-500 w-12 h-12" />
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
                class="text-12 font-black font-mono"
                :class="item.currentHp < item.hp / 3 ? 'text-rose-500' : 'text-white'"
              >
                {{ item.currentHp
                }}<span class="text-slate-400"><span class="mx-3">/</span>{{ item.hp }}</span>
              </span>
              <span class="text-12 font-extrabold text-slate-500 uppercase tracking-wide">HP</span>
            </div>
          </div>

          <div class="flex flex-col">
            <div class="h-6 w-full bg-black/40 rounded-full border border-white/5 overflow-hidden">
              <div
                class="h-6 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                :class="getHealthColor(item.currentHp, item.hp)"
                :style="{ width: (item.currentHp / item.hp) * 100 + '%' }"
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
import IconFoot from '~/svg/footprint.svg';
import IconSword from '~/svg/sword.svg';
import IconBow from '~/svg/bow.svg';
import IconFlail from '~/svg/flail.svg';
import Note from '~/components/molecules/game-sidebar/Note.vue';

const { group, item, player } = defineProps({
  item: { type: Object, default: null },
  player: { type: Object, default: null },
  group: { type: Array, default: () => [] },
});

const isStacked = computed(() => group?.length > 1);

const rangeType = computed(() => {
  switch (item.rangeType) {
    case 'melee':
      return markRaw(IconSword);
    case 'ranged':
      return markRaw(IconBow);
    case 'through 1':
      return markRaw(IconFlail);
  }
});

const setActiveItem = () => {
  if (item.active) return;
  const currentActive = group.find(i => i.active);
  currentActive.active = false;
  item.active = true;
};

const getHealthColor = (current, max) => {
  const percent = (current / max) * 100;
  if (percent > 50) return 'bg-emerald-500';
  if (percent > 20) return 'bg-amber-500';
  return 'bg-rose-600';
};
</script>
