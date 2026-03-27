<template>
  <div
    class="flex flex-wrap w-max gap-14 gap-4 items-center justify-center rounded-8 border-white/30 py-8 px-12 shadow-xl bg-[#282934] bg-linear-to-r from-white/5 to-transparent transition uppercase font-boldshadow-inner"
  >
    <div
      v-for="(states, type) in groupedInventory"
      :key="type"
      class="flex flex-wrap items-center gap-4"
    >
      <template v-for="(stack, state) in states" :key="state">
        <TooltipProvider v-if="stack.length > max">
          <Tooltip :content="stack[0].name">
            <div class="flex items-center gap-6 group cursor-help">
              <div
                class="relative flex items-center justify-center transition-all group-hover:scale-110"
                :class="getStateClass(stack[0].state)"
              >
                <Icon
                  :name="stack[0].icon"
                  class="text-18 relative"
                  :style="{ color: stack[0].color }"
                />

                <div
                  v-if="state === 'active'"
                  class="absolute inset-0 blur-xl opacity-20 scale-150"
                  :style="{ backgroundColor: stack[0].color }"
                />
              </div>

              <div
                class="flex gap-4 items-center text-13 font-bold tracking-tighter transition-all"
                :class="state === 'active' ? 'text-white' : 'text-gray-600'"
              >
                <span>x</span>{{ stack.length }}
              </div>
            </div>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider v-else class="flex flex-wrap">
          <Tooltip v-for="item in stack" :key="item.id" :content="item.name">
            <div :class="getStateClass(item.state)" class="relative group flex gap-8 cursor-help">
              <Icon
                :name="item.icon"
                class="text-18 transition-transform group-hover:scale-110"
                :style="{ color: item.color }"
              />
            </div>
          </Tooltip>
        </TooltipProvider>
      </template>
    </div>
  </div>
</template>
<script setup>
import Tooltip from '~/components/atoms/Tooltip.vue';

const { items } = defineProps({
  items: { type: Array, default: () => [] },
  max: { type: Number, default: 5 },
});

const groupedInventory = computed(() => {
  const groups = {};

  items.forEach(item => {
    if (!groups[item.type]) groups[item.type] = {};
    if (!groups[item.type][item.state]) groups[item.type][item.state] = [];
    groups[item.type][item.state].push(item);
  });

  return groups;
});

const getStateClass = state => {
  return state === 'active' ? 'opacity-100' : 'opacity-40 grayscale';
};
</script>
