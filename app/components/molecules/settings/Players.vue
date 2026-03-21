<template>
  <div class="gap-8 flex flex-col">
    <h3 class="block text-slate-500 text-18 font-bold uppercase tracking-[0.01em]">Герои</h3>

    <div class="flex flex-col gap-8">
      <div class="flex gap-16 items-center" v-for="(item, index) in counter" :key="item">
        <div class="text-white min-w-10" v-if="players?.length">
          {{ index + 1 }}
        </div>

        
        <ASelect
          class="flex-1"
          :modelValue="players[index]"
          placeholder="Выберите героя"
          :options="listHeroes"
          @update:modelValue="addPlayer($event, index)"
        >
          <template #header>
            <ASwitch
              v-model="players[index].type"
              :trueValue="{ id: 'player', name: 'Игрок' }"
              :falseValue="{ id: 'ai', name: 'ИИ' }"
              v-if="players[index]?.type"
            >
              <template #default="{ checked, label }">
                <div class="flex gap-6 w-full">
                  <IconChecked
                    v-if="checked"
                    class="w-14 h-14 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
                  />
                  <div
                    class="text-12 font-bold uppercase tracking-widest transition-colors select-none text-cyan-500 ui-checked:text-emerald-400"
                  >
                    {{ label }}
                  </div>
                </div>
              </template>
            </ASwitch>
          </template>
          <template #option="{ item, selected, active }">
            <div class="flex items-center gap-8">
              <AAvatar
                :src="item.avatar"
                :color="item.color"
                :isActive="active || selected"
                size="40"
              />
              <div>{{ item.name }}</div>
            </div>
          </template>
        </ASelect>


        <div
          class="flex flex-col gap-2 shrink-0"
          v-if="
            (players?.length === counter &&
              players?.length < MAX &&
              listHeroes?.filter(i => !i.disabled).length > 0) ||
            players?.length > 0
          "
        >
          <Stepper
            type="plus"
            @click="addRow"
            v-if="
              players?.length === counter &&
              players?.length < MAX &&
              listHeroes?.filter(i => !i.disabled).length > 0
            "
          />
          <Stepper type="minus" @click="removeRow(index)" v-if="players?.length > 0" />
        </div>


        <AColorBadge :color="players[index].color" v-if="players[index]?.color" />
      </div>
    </div>
  </div>
</template>
<script setup>
import IconChecked from '~/svg/checked.svg';
import ASelect from '~/components/atoms/ASelect.vue';
import AAvatar from '~/components/atoms/AAvatar.vue';
import AColorBadge from '~/components/atoms/AColorBadge.vue';
import ASwitch from '~/components/atoms/ASwitch.vue';
import Stepper from '~/components/molecules/settings/Stepper.vue';
import { useGameStore } from '~/store/game.js';
import useUtils from '~/composables/useUtils';

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

const addPlayer = (item, index) => {
  const player = cloneDeep(item);
  delete player.disabled;
  player.type = !players.value?.length ? 'player' : 'ai';
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
