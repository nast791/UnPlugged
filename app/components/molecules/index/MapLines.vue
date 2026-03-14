<template>
  <v-group>
    <v-line
      v-for="(line, idx) in lines"
      :key="idx"
      :config="{
        points: line.points,
        stroke: 'red',
        strokeWidth: 5,
        opacity: 0.3,
      }"
    />
  </v-group>
</template>

<script setup>
defineProps(['lines']);
</script>
