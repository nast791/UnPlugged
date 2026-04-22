<template>
  <div class="gap-8 flex flex-col">
    <h3 class="block text-slate-500 text-18 font-bold uppercase tracking-[0.01em]">Герои</h3>

    <div class="flex flex-col gap-8">
      <div class="flex gap-16 items-center" v-for="(item, index) in counter" :key="item">
        <div class="text-white min-w-10" v-if="selectedPlayers?.length">
          {{ index + 1 }}
        </div>

        <Select
          class="flex-1"
          :modelValue="selectedPlayers[index]?.id"
          placeholder="Выберите героя"
          :options="listHeroes"
          @update:modelValue="addPlayer($event, index)"
        >
          <template #header>
            <Switch
              class="w-full"
              v-model="selectedPlayers[index].type"
              :trueValue="human"
              :falseValue="ai"
              @click.stop
              @pointerdown.stop
              v-if="selectedPlayers[index]?.type"
            />
          </template>
          <template #option="{ item, selected, active }">
            <div class="flex items-center gap-8">
              <Avatar
                :src="item.image"
                :alt="item.name"
                :color="item.color"
                :isActive="active || selected || false"
                size="md"
              />
              <div>{{ item.name }}</div>
            </div>
          </template>
        </Select>

        <Controls
          :show-plus="selectedPlayers?.length === counter && selectedPlayers.length < MAX && hasHeroes"
          :show-minus="selectedPlayers.length > 0"
          @add="addRow"
          @remove="removeRow(index)"
          v-if="selectedPlayers?.length > 0"
        />

        <ColorPicker v-model="selectedPlayers[index].color" v-if="selectedPlayers[index]?.color" />
      </div>
    </div>
  </div>
</template>
<script setup>
import Avatar from '~/components/atoms/Avatar.vue';
import ColorPicker from '~/components/atoms/ColorPicker.vue';
import Switch from '~/components/atoms/Switch.vue';
import Controls from '~/components/molecules/settings/Controls.vue';
import { useGameStore } from '~/store/game.js';
import { useAppStore } from '~/store/app';
import useUtils from '~/composables/useUtils';
import Select from '~/components/atoms/Select.vue';

const { heroes } = defineProps({
  heroes: Array,
});

const MAX = 2;

const { glossary } = storeToRefs(useAppStore());
const { selectedPlayers, localPlayerId } = storeToRefs(useGameStore());
const { cloneDeep } = useUtils();

const listHeroes = computed(
  () =>
    cloneDeep(heroes)?.map(i => {
      i.disabled = !!selectedPlayers.value?.find(p => p.id === i.id);
      return i;
    }) || [],
);

const hasHeroes = computed(() => listHeroes.value?.filter(i => !i.disabled).length > 0);
const human = computed(() => glossary.value?.meta?.players?.[0]);
const ai = computed(() => glossary.value?.meta?.players?.[1]);

const addPlayer = (id, index) => {
  const item = heroes.find(i => i.id === id);
  const player = cloneDeep(item);
  delete player.disabled;
  player.type = !selectedPlayers.value?.length || !selectedPlayers.value?.find(i => i.type === human.value?.id) ? human.value?.id : ai.value?.id;
  player.index = index + 1;
  if (selectedPlayers.value[index]) {
    selectedPlayers.value[index] = player;
  } else {
    selectedPlayers.value.push(player);
  }
  const humanIndex = selectedPlayers.value.findIndex(p => p.type === human.value?.id);
  if (humanIndex !== -1) {
    localPlayerId.value = String(humanIndex);
  }
};

const counter = ref(1);

const addRow = () => {
  if (counter.value >= MAX) return;
  counter.value++;
};

const removeRow = index => {
  selectedPlayers.value?.splice(index, 1);
  if (counter.value > 1) {
    counter.value--;
  }
  const humanIndex = selectedPlayers.value.findIndex(p => p.type === human.value?.id);
  localPlayerId.value = humanIndex !== -1 ? String(humanIndex) : "0";
};

watch(
  () => selectedPlayers.value.map(p => p.type),
  (newTypes) => {
    const humanIndex = newTypes.findIndex(t => t === human.value?.id);
    if (humanIndex !== -1) {
      localPlayerId.value = String(humanIndex);
    }
  },
  { deep: true }
);
</script>
