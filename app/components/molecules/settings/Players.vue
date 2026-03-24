<template>
  <div class="gap-8 flex flex-col">
    <h3 class="block text-slate-500 text-18 font-bold uppercase tracking-[0.01em]">Герои</h3>

    <div class="flex flex-col gap-8">
      <div class="flex gap-16 items-center" v-for="(item, index) in counter" :key="item">
        <div class="text-white min-w-10" v-if="players?.length">
          {{ index + 1 }}
        </div>

        <Select
          class="flex-1"
          :modelValue="players[index]?.id"
          placeholder="Выберите героя"
          :options="listHeroes"
          @update:modelValue="addPlayer($event, index)"
        >
          <template #header>
            <Switch
              class="w-full"
              :modelValue="players[index]?.type"
              :trueValue="{ id: 'player', name: 'Игрок' }"
              :falseValue="{ id: 'ai', name: 'ИИ' }"
              @click.stop
              @pointerdown.stop
              v-if="players[index]?.type"
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
          :show-plus="players?.length === counter && players.length < MAX && hasHeroes"
          :show-minus="players.length > 0"
          @add="addRow"
          @remove="removeRow(index)"
          v-if="players?.length > 0"
        />

        <ColorPicker v-model="players[index].color" v-if="players[index]?.color"/>
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
import useUtils from '~/composables/useUtils';
import Select from '~/components/atoms/Select.vue';

const { heroes } = defineProps({
  heroes: Array,
});

const MAX = 4;

const { players } = storeToRefs(useGameStore());
const { cloneDeep } = useUtils();

const listHeroes = computed(
  () =>
    cloneDeep(heroes)?.map(i => {
      i.disabled = !!players.value?.find(p => p.id === i.id);
      return i;
    }) || [],
);

const hasHeroes = computed(() => listHeroes.value?.filter(i => !i.disabled).length > 0);

const addPlayer = (id, index) => {
  const item = heroes.find(i => i.id === id);
  const player = cloneDeep(item);
  delete player.disabled;
  player.type = !players.value?.length ? 'player' : 'ai';
  player.index = index + 1;
  if (players.value[index]) {
    players.value[index] = player;
  } else {
    players.value.push(player);
  }
};

const counter = ref(1);

const addRow = () => {
  if (counter.value >= MAX) return;
  counter.value++;
};

const removeRow = index => {
  players.value?.splice(index, 1);
  if (counter.value > 1) {
    counter.value--;
  }
};
</script>
