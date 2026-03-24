<template>
  <div class="h-dvh bg-slate-950 overflow-hidden">
    <div v-if="!isGameInitialized" class="text-white">Загружаем карту Unmatched...</div>
    <LazyOrganismsGameBattleBoard hydrate-on-visible v-else />
  </div>
</template>
<script setup>
import { useGameStore } from '~/store/game.js';
import { getMap, getHeroes } from '~/composables/api/plugins';
import useInitializer from '~/composables/game/useInitializer';
import useProcessor from '~/composables/game/useProcessor';

const { id, map, isGameInitialized, players, phase } = storeToRefs(useGameStore());
const route = useRoute();

if (String(route.params.id) !== String(id.value)) {
  throw createError({
    statusCode: 404,
    message: 'Error',
    fatal: true,
  });
}
const { suspense: suspenseMap } = getMap();
const { suspense: suspenseHeroes } = getHeroes();

await Promise.all([suspenseMap(), suspenseHeroes()]);


const { runInit } = useInitializer();
const { process } = useProcessor({ runInit });
process();
</script>
