<template>
  <ClientOnly>
    <div v-if="map" class="w-full h-full bg-slate-950">
      <v-stage ref="stageRef" :config="stageConfig" @wheel="handleWheel">
        <v-layer>
          <!-- 1. ФОН -->
          <MapBackground 
            :imageUrl="map.imageSrc" 
            @loaded="centerOnImage" 
          />

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
            :position="getNodePosition(item.position, nodes)"
            :imageUrl="item.imageSrc"
            :nodeSize="nodeSize"
            :scale="currentScale"
            color="#22d3ee"
            v-for="item in player?.fighters"
            :key="item.id"
          />

          <MapHero
            :position="getNodePosition(item.position, nodes)"
            :imageUrl="item.imageSrc"
            :nodeSize="nodeSize"
            :scale="currentScale"
            color="#f87171"
            v-for="item in ai?.fighters"
            :key="item.id"
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
import MapBackground from '~/components/molecules/index/MapBackground.vue';
import { useGameStore } from '~/store/game.js';
import { usePlugins } from '~/composables/api/plugins';

const stageRef = ref(null);
const stageConfig = ref({
  width: 0,
  height: 0,
  draggable: true,
});
const currentScale = ref(1);

const { map, player, ai } = storeToRefs(useGameStore());
const { zoomToPoint, centerOnImage } = useKonvaCamera(stageRef, currentScale);
const { getNodePosition } = useUtils();

const connections = computed(() => map.value?.connections || []);
const nodes = computed(() => map.value?.nodes || []);
const nodeSize = computed(() => map.value?.settings?.nodeSize);

const handleResize = () => {
  if (import.meta.client) {
    stageConfig.value.width = window.innerWidth;
    stageConfig.value.height = window.innerHeight;
  }
};

onMounted(async () => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', handleResize);
  }
});

const { suspense } = usePlugins();
await Promise.all([suspense()]);

const handleNodeClick = (e, nodeId) => {
  console.log('Выбрана нода для хода/действия:', nodeId);
};

const handleWheel = e => {
  zoomToPoint(e);
};
</script>
