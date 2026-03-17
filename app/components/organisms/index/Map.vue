<template>
  <section ref="mapContainer" class="relative overflow-hidden min-h-0 min-w-0">
    <ClientOnly>
      <div v-if="map">
        <v-stage ref="stageRef" :config="stageConfig" @wheel="handleWheel">
          <v-layer>
            <!-- 1. ФОН -->
            <MapBackground :imageUrl="map.imageSrc" @loaded="onMapLoaded" />

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
            <template v-for="hero in players" :key="hero.id">
              <MapHero
                :position="getNodePosition(item.position, nodes)"
                :imageUrl="item.imageSrc"
                :nodeSize="nodeSize"
                :scale="currentScale"
                :color="hero.color"
                v-for="item in hero?.fighters"
                :key="item.id"
              />
            </template>
          </v-layer>
        </v-stage>
      </div>
    </ClientOnly>
  </section>
</template>

<script setup>
import MapLines from '~/components/molecules/map/MapLines.vue';
import MapNode from '~/components/molecules/map/MapNode.vue';
import MapHero from '~/components/molecules/map/MapHero.vue';
import MapBackground from '~/components/molecules/map/MapBackground.vue';
import { useGameStore } from '~/store/game.js';
import { usePlugins } from '~/composables/api/plugins';

const mapContainer = ref(null);
const stageRef = ref(null);
const stageConfig = ref({
  width: 0,
  height: 0,
  draggable: true,
});
const currentScale = ref(1);
const observer = ref(null);

const { map, players } = storeToRefs(useGameStore());
const { zoomToPoint, centerOnImage } = useKonvaCamera(stageRef, currentScale);
const { getNodePosition } = useUtils();

const connections = computed(() => map.value?.connections || []);
const nodes = computed(() => map.value?.nodes || []);
const nodeSize = computed(() => map.value?.settings?.nodeSize);

const currentMapImg = ref(null);

const onMapLoaded = (img) => {
  currentMapImg.value = img; 
  centerOnImage(img);       
};

const updateDimensions = () => {
  if (mapContainer.value) {
    stageConfig.value.width = mapContainer.value.clientWidth;
    stageConfig.value.height = mapContainer.value.clientHeight;
    
    if (currentMapImg.value) {
      centerOnImage(currentMapImg.value);
    }
  }
};

onMounted(async () => {
  updateDimensions();
  observer.value = new ResizeObserver(updateDimensions);
  if (mapContainer.value) {
    observer.value.observe(mapContainer.value);
  }
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
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
