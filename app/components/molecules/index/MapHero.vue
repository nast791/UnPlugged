<template>
  <v-group :config="{ x: position.x, y: position.y }">
    <!-- Внешнее кольцо (подсветка хода) -->
    <v-circle
      :config="{
        radius: nodeSize / 2 + 5,
        stroke: color,
        strokeWidth: 3 / scale,
      }"
    />
    <!-- Аватар -->
    <v-image
      :config="{
        image: image,
        width: nodeSize,
        height: nodeSize,
        x: -nodeSize / 2,
        y: -nodeSize / 2,
        cornerRadius: nodeSize / 2,
      }"
    />
  </v-group>
</template>

<script setup>
defineProps({
  position: {type: Number},
  image: {type: String},
  nodeSize: {type: Number},
  scale: {type: Number},
  color: {type: String},
});
</script>