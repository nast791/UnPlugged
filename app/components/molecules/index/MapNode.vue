<template>
  <v-group :config="{ x: node.x, y: node.y }">
    <v-circle
      :config="{
        radius: nodeSize / 2,
        fill: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        stroke: '#000000',
        strokeWidth: 2 / scale,
      }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      @click="$emit('select', node.id)"
    />
  </v-group>
</template>

<script setup>
const props = defineProps(['node', 'nodeSize', 'scale']);
defineEmits(['select']);
const isHovered = ref(false);
</script>
