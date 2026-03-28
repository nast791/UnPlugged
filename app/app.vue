<template>
  <div>
    <Html
      lang="ru"
      class="overflow-x-hidden scroll-smooth max-h-dvh"
      :class="[stopScrollingPage && 'overflow-y-hidden!']"
    />
    <Head>
      <Title>{{ route.meta?.seo?.title }}</Title>
      <Meta name="robots" content="noindex" />
    </Head>
    <Body
      class="-tracking-[0.01em] leading-[1.2] text-primary text-18 bg-white overflow-x-clip min-w-360 lining-nums scroll-smooth outline-none font-display font-normal max-h-dvh"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup>
import { useAppStore } from '~/store/app.js';
import useSetup from '~/composables/game/useSetup';
import useInitializer from '~/composables/game/useInitializer';
import usePlacementManager from '~/composables/game/usePlacementManager';
import { useGameStore } from '~/store/game';

const route = useRoute();
const { stopScrollingPage } = storeToRefs(useAppStore());

const { setupNewGame } = useSetup();
const { runInit } = useInitializer();
const { startPlacement } = usePlacementManager();
const { $registerActions } = useNuxtApp();

onMounted(() => {
  $registerActions({ setupNewGame, runInit, startPlacement });
});
</script>
