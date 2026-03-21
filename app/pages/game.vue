<template>
  <div class="h-dvh bg-slate-950 overflow-hidden">
    <LazyOrganismsIndexStartDisplay hydrate-on-visible />
  </div>
</template>
<script setup>
import { useGameStore } from '~/store/game.js';

const { id, isGameStarted } = storeToRefs(useGameStore());
const route = useRoute();
if (String(route.id) !== String(id) || !isGameStarted.value) {
  throw createError({
    statusCode: 404,
    message: 'Error',
    fatal: true,
  });
}
</script>