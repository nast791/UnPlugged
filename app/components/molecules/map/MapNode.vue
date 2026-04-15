<template>
  <v-group :config="{ x: node.x, y: node.y }">
    <v-circle
      :config="{
        radius: nodeSize / 2,
        fill: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        stroke: getStrokeColor,
        strokeWidth: 5,
        shadowBlur: getStrokeColor !== 'transparent' ? 10 : 0,
        shadowColor: 'white',
        listening: true
      }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      @click="onNodeClick"
    />
  </v-group>
</template>

<script setup>
import useMovement from '~/composables/game/useMovement';
import { useGameStore } from '@/store/game';
import { useUnitPlacement } from '~/composables/phases/useUnitPlacement';

const { isDraggingOverCanvas, node, dragFighter } = defineProps([
  'node',
  'nodeSize',
  'scale',
  'isDraggingOverCanvas',
  'dragFighter',
]);
const emit = defineEmits(['select']);
const { intent } = storeToRefs(useGameStore());
const isHovered = ref(false);
const { availableSpawnPoints } = useUnitPlacement();
const { availableCells } = useMovement();

const getStrokeColor = computed(() => {
  if (isDraggingOverCanvas && availableSpawnPoints[dragFighter?.type]?.includes(node.id)) {
    return 'cyan';
  }
  if (intent.value?.selectedAction === 'movement' && availableCells.value.includes(node.id)) {
    return '#facc15';
  }
  return 'transparent';
});

const onNodeClick = () => {
  const color = getStrokeColor.value;

  if (color === '#facc15') {
    emit('select', node.id);
  } else {
    emit('select', node.id);
  }
};
</script>
