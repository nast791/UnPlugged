<template>
  <section ref="mapContainer" class="relative overflow-hidden min-h-0 min-w-0 z-1">
    <ClientOnly>
      <div v-if="G">
        <v-stage
          ref="stageRef"
          :config="stageConfig"
          @wheel="handleWheel"
          @mousedown="handleStageClick"
          @touchstart="handleStageClick"
        >
          <v-layer>
            <MapBackground :imageUrl="mapData.image" @loaded="onMapLoaded" />

            <MapLines :lines="connections" />

            <MapNode
              v-for="node in nodes"
              :key="node.id"
              :node="node"
              :nodeSize="nodeSize"
              :is-highlighted="checkIfHighlighted(node.id)"
              :highlight-type="currentHighlightType"
            />

            <template v-for="player in playersData" :key="player.id">
              <MapFighter
                :position="getNodePosition(item.position, nodes)"
                :imageUrl="item.image"
                :nodeSize="nodeSize"
                :scale="currentScale"
                :color="player.color"
                :item="item"
                v-model="highlightedCells"
                v-for="item in player?.fighters"
                :key="`${player.id}-${item.id}-${item.position}`"
              />
            </template>
          </v-layer>
        </v-stage>
      </div>

      <Teleport to="body">
        <div
          v-if="dragItem"
          class="pointer-events-none fixed z-999 opacity-70"
          :style="{
            left: mousePos.x + 'px',
            top: mousePos.y + 'px',
            transform: 'translate(-50%, -50%)',
          }"
        >
          <img :src="dragItem.image" class="w-64 h-64 border-2 border-white rounded-full" />
        </div>
      </Teleport>
    </ClientOnly>
  </section>
</template>

<script setup>
import MapLines from '~/components/molecules/map/MapLines.vue';
import MapNode from '~/components/molecules/map/MapNode.vue';
import MapFighter from '~/components/molecules/map/MapFighter.vue';
import MapBackground from '~/components/molecules/map/MapBackground.vue';
import useKonvaCamera from '~/composables/konva/useKonvaCamera';
import { useGlobalDrag } from '~/composables/game/useGlobalDrag';
import { useKonvaPlacement } from '~/composables/konva/useKonvaPlacement';
import { useBoardgame } from '~/composables/game/useBoardgame';
import { getAvailablePoints } from '#shared/utils/phases/placement';

const mapContainer = ref(null);
const stageRef = ref(null);
const stageConfig = ref({
  width: 0,
  height: 0,
  draggable: true,
});
const currentScale = ref(1);
const observer = ref(null);

const { client, G, ctx } = useBoardgame();

const mapData = computed(() => G.value?.map);
const playersData = computed(() => G.value?.players || []);
const currentPhase = computed(() => ctx.value?.phase);
const { zoomToPoint, centerOnImage } = useKonvaCamera(stageRef, currentScale);
const { getNodePosition } = useUtils();

const connections = computed(() => mapData.value?.connections || []);
const nodes = computed(() => mapData.value?.circles || []);
const nodeSize = computed(() => mapData.value?.settings?.nodeSize);
const { dragItem, mousePos } = useGlobalDrag();

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

const { registerMap } = useKonvaPlacement();

onMounted(async () => {
  registerMap(stageRef, nodes, nodeSize);
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

const handleWheel = e => {
  zoomToPoint(e);
};

const highlightedCells = ref([]);

const handleStageClick = e => {
  const clickedOnEmpty = e.target === e.target.getStage();
  if (clickedOnEmpty) {
    clearMap();
  }
};

const clearMap = () => {
  highlightedCells.value = [];
  if (client.value) {
    client.value.moves.resetAllFighters();
  }
};

const checkIfHighlighted = nodeId => {
  const id = String(nodeId);
  if (currentPhase.value === 'UNIT_PLACEMENT' && dragItem.value) {
    const points = getAvailablePoints(G.value, ctx.value, dragItem.value.id);
    const type = dragItem.value.type;
    return points[type]?.map(String).includes(id);
  }

  return highlightedCells.value.map(String).includes(id);
};

const currentHighlightType = computed(() => {
  if (currentPhase.value === 'UNIT_PLACEMENT') return 0;
  if (currentPhase.value === 'MOVEMENT') return 1;
  return 0;
});
</script>
