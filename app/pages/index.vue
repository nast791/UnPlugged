<template>
  <div class="h-dvh bg-slate-950 overflow-hidden">
    <LazyOrganismsIndexStartDisplay hydrate-on-visible v-if="!isGameStarted" />
    <LazyOrganismsIndexBattleBoard hydrate-on-visible v-else />
  </div>
</template>
<script setup>
import { useGameStore } from '~/store/game.js';

const { isGameStarted } = storeToRefs(useGameStore());
</script>
