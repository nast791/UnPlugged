<template>
  <ClientOnly>
    <div v-if="map" class="w-full h-full bg-slate-950">
      <v-stage ref="stageRef" :config="stageConfig" @wheel="handleWheel">
        <v-layer v-if="images.mapBg">
          <!-- 1. ФОН -->
          <v-image :config="{ image: images.mapBg }" />

          <!-- 2. ЛИНИИ (под нодами) -->
          <MapLines :lines="connections" />

          <!-- 3. НОДЫ -->
          <MapNode
            v-for="node in nodes"
            :key="node.id"
            :node="node"
            :nodeSize="nodeSize"
            :scale="currentScale"
            @select="handleNodeClick"
          />

          <!-- 4. ГЕРОИ -->
          <MapHero
            v-if="player?.fighters?.position"
            :position="player.fighters.position"
            :image="images.heroPlayer"
            :nodeSize="nodeSize"
            :scale="currentScale"
            color="#22d3ee"
          />

          <MapHero
            v-if="ai?.fighters?.position"
            :position="ai.fighters.position"
            :image="images.heroAI"
            :nodeSize="nodeSize"
            :scale="currentScale"
            color="#f87171"
          />
        </v-layer>
      </v-stage>
    </div>
  </ClientOnly>
</template>

<script setup>
import MapLines from '~/components/molecules/index/MapLines.vue';
import MapNode from '~/components/molecules/index/MapNode.vue';
import MapHero from '~/components/molecules/index/MapHero.vue';
import { useGameStore } from '~/store/game.js';
import { usePlugins } from '~/composables/api/plugins';
import useKonvaLoader from '~/composables/useKonvaLoader';

const { map, player, ai } = storeToRefs(useGameStore());
const { suspense } = usePlugins();
await Promise.all([suspense()]);

const { images, loadAsset } = useKonvaLoader();

const connections = computed(() => map.value?.connections || []);
const nodes = computed(() => map.value?.nodes || []);
const nodeSize = computed(() => map.value?.settings?.nodeSize);

const stageRef = ref(null);
const stageConfig = ref({
  width: 0,
  height: 0,
  draggable: true,
});
const currentScale = ref(1);

const { zoomToPoint, centerOnImage } = useKonvaCamera(stageRef, currentScale);

const handleNodeClick = (e, nodeId) => {
  console.log('Выбрана нода для хода/действия:', nodeId);
};

watch(
  () => images.value.mapBg,
  img => {
    if (img) nextTick(() => centerOnImage(img));
  },
);

const handleWheel = e => {
  zoomToPoint(e);
};

const initAssets = () => {
  if (map.value?.backgroundUrl) loadAsset('mapBg', map.value.backgroundUrl);

  const allFighters = [...(player.value?.fighters || []), ...(ai.value?.fighters || [])];

  allFighters.forEach(f => {
    if (f.avatarUrl) {
      // Ключ для images: 'hero_ID' или 'sidekick_ID'
      loadAsset(`${f.type}_${f.id}`, f.avatarUrl);
    }
  });
};

onMounted(() => {
  const stage = stageRef.value?.getStage();
  if (stage) {
    currentScale.value = stage.scaleX() || 1;
  }

  initAssets();

  stageConfig.value.width = window.innerWidth;
  stageConfig.value.height = window.innerHeight;
  window.addEventListener('resize', () => {
    stageConfig.value.width = window.innerWidth;
    stageConfig.value.height = window.innerHeight;
  });
});
</script>
