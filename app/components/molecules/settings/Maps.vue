<template>
  <div class="gap-8 flex flex-col">
    <h3 class="block text-slate-500 text-18 font-bold uppercase tracking-[0.01em]">Карта</h3>

    <div class="flex flex-col gap-8">
      <Select
        :modelValue="selectedMap?.id"
        placeholder="Выберите поле"
        :options="listMaps"
        @update:modelValue="addMap"
      >
        <template #option="{ item, selected, active }">
          <div class="flex items-center gap-8">
            <div>{{ item.name }}</div>
            <span
              class="px-10 py-2 text-12 font-black uppercase tracking-widest rounded-8 transition-all duration-300 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30 shadow-[0_0_12px_rgba(217,70,239,0.3)] group-hover:bg-fuchsia-500/20 group-hover:shadow-[0_0_15px_rgba(217,70,239,0.5)]"
            >
              {{ item.players }} Игрока
            </span>
          </div>
        </template>
      </Select>
    </div>
  </div>
</template>
<script setup>
import { useGameStore } from '~/store/game.js';
import useUtils from '~/composables/useUtils';
import Select from '~/components/atoms/Select.vue';

const { maps } = defineProps({
  maps: Array,
});

const { selectedMap, selectedPlayers } = storeToRefs(useGameStore());
const { cloneDeep } = useUtils();

const listMaps = computed(
  () =>
    maps?.map(i => {
      i.disabled = i.players < selectedPlayers.value?.length;
      return i;
    }) || [],
);

const addMap = id => {
  const item = maps.find(i => i.id === id);
  const field = cloneDeep(item);
  delete field.disabled;
  selectedMap.value = field;
};
</script>
