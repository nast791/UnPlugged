<template>
  <div
    class="grid max-h-dvh h-dvh w-dvw grid-cols-[calc(400*var(--spacing))_1fr] overflow-hidden bg-slate-950"
  >
    <Sidebar :turn-number="5" game-time="12:45" />

    <Map />
  </div>
</template>

<script setup>
import Map from '~/components/organisms/game/Map.vue';
import Sidebar from '~/components/organisms/game/Sidebar.vue';
import { useGameStore } from '~/store/game.js';

const { map, players } = storeToRefs(useGameStore());
</script>
