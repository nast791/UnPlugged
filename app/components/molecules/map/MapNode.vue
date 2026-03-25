<template>
  <v-group :config="{ x: node.x, y: node.y }">
    <v-circle
      :config="{
        radius: nodeSize / 2,
        fill: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        stroke: isDraggingOverCanvas && availableSpawnPoints[dragFighter.type]?.includes(node.id)
      ? 'cyan'
      : 'transparent',
        strokeWidth: 5,
        shadowBlur:
          isDraggingOverCanvas && availableSpawnPoints[dragFighter.type]?.includes(node.id)
            ? 10
            : 0,
        shadowColor: 'white'
      }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      @click="$emit('select', node.id)"
    />
  </v-group>
</template>

<script setup>
import usePlacementManager from '~/composables/game/usePlacementManager';

defineProps(['node', 'nodeSize', 'scale', 'isDraggingOverCanvas', 'dragFighter']);
defineEmits(['select']);
const isHovered = ref(false);
const { availableSpawnPoints } = usePlacementManager();
</script>
