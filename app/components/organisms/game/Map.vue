<template>
  <section ref="mapContainer" class="relative overflow-hidden min-h-0 min-w-0">
    <ClientOnly>
      <div @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDropOnCanvas" v-if="map">
        <v-stage ref="stageRef" :config="stageConfig" @wheel="handleWheel">
          <v-layer>
            <!-- 1. ФОН -->
            <MapBackground :imageUrl="map.image" @loaded="onMapLoaded" />

            <!-- 2. ЛИНИИ (под нодами) -->
            <MapLines :lines="connections" />

            <!-- 3. НОДЫ -->
            <MapNode
              v-for="node in nodes"
              :key="node.id"
              :node="node"
              :nodeSize="nodeSize"
              :scale="currentScale"
              :isDraggingOverCanvas="isDraggingOverCanvas"
              :dragFighter="dragFighter"
              @select="handleNodeClick"
            />

            <!-- 4. ГЕРОИ -->
            <template v-for="hero in players" :key="hero.id">
              <MapHero
                :position="getNodePosition(item.position, nodes)"
                :imageUrl="item.image"
                :nodeSize="nodeSize"
                :scale="currentScale"
                :color="hero.color"
                :id="item.id"
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
import useKonvaCamera from '~/composables/konva/useKonvaCamera';
import usePlacementManager from '~/composables/game/usePlacementManager';

const mapContainer = ref(null);
const stageRef = ref(null);
const stageConfig = ref({
  width: 0,
  height: 0,
  draggable: true,
});
const currentScale = ref(1);
const observer = ref(null);

const { map, players, activePlayer } = storeToRefs(useGameStore());
const { zoomToPoint, centerOnImage } = useKonvaCamera(stageRef, currentScale);
const { getNodePosition } = useUtils();
const { placeUnit } = usePlacementManager();

const connections = computed(() => map.value?.connections || []);
const nodes = computed(() => map.value?.circles || []);
const nodeSize = computed(() => map.value?.settings?.nodeSize);

const currentMapImg = ref(null);

const onMapLoaded = img => {
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

const handleNodeClick = (e, nodeId) => {
  console.log('Выбрана нода для хода/действия:', nodeId);
};

const handleWheel = e => {
  zoomToPoint(e);
};

const dragFighter = computed(() => activePlayer.value?.fighters?.find(i => i.drag));

const isDraggingOverCanvas = ref(false);

const onDragOver = e => {
  e.preventDefault();
  isDraggingOverCanvas.value = true;
};

const onDragLeave = () => {
  isDraggingOverCanvas.value = false;
};

const onDropOnCanvas = e => {
  isDraggingOverCanvas.value = false;
  const fighterId = e.dataTransfer.getData('fighterId');
  const stage = stageRef.value.getStage();
  stage.setPointersPositions(e);
  const transform = stage.getAbsoluteTransform().copy().invert();
  const pointerPos = transform.point(stage.getPointerPosition());
  const closestNode = map.value.circles.find(i => {
    const dist = Math.sqrt(Math.pow(i.x - pointerPos.x, 2) + Math.pow(i.y - pointerPos.y, 2));
    return dist < 100;
  });

  if (closestNode) {
    placeUnit(fighterId, closestNode.id);
  }
};
</script>
