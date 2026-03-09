<template>
  <ClientOnly>
    <div v-if="map" class="w-full h-full bg-slate-950">
      <div v-if="isDevMode" class="absolute top-4 left-4 z-50 flex gap-2">
        <button @click="exportMap" class="bg-cyan px-4 py-2 rounded font-black text-22">
          EXPORT JSON
        </button>
        <div class="bg-slate-900/80 p-2 rounded text-20 text-white border border-slate-700">
          L-Click: Add Node | R-Click: Delete
        </div>
        <div class="bg-slate-900/80 p-2 rounded text-20 text-white border border-slate-700">
          Нод: {{ map?.nodes?.length }} | Игрок: {{ player ? 'Есть' : 'Нет' }}
        </div>
      </div>

      <v-stage
        ref="stageRef"
        :config="stageConfig"
        @mousedown="handleStageClick"
        @wheel="handleWheel"
      >
        <v-layer v-if="backgroundConfig">
          <v-group :config="{ ...backgroundConfig, name: 'main-group' }">
            <!-- 1. Фон -->
            <v-image
              :config="{
                image: images.mapBg,
                name: 'map-bg',
                width: images.mapBg.width,
                height: images.mapBg.height,
              }"
            />

            <!-- 2. Линии -->
            <v-line
              v-for="(line, idx) in connections"
              :key="`line-${idx}`"
              :config="{
                points: line.points,
                stroke: 'red',
                strokeWidth: 5,
                opacity: 1,
              }"
            />

            <!-- 3. Ноды -->
            <v-group
              v-for="node in map.nodes"
              :key="node.id"
              :config="{
                x: node.x,
                y: node.y,
                draggable: isDevMode,
                onClick: e => handleNodeClick(e, node.id),
                onTap: e => handleNodeClick(e, node.id),
                onContextMenu: e => e.evt.preventDefault(),
                onDragMove: e => handleDragMove(e, node),
              }"
            >
              <v-circle
                :config="{
                  radius: adaptiveRadius,
                  fill: isDevMode ? 'rgba(34, 211, 238, 0.2)' : 'transparent',
                  stroke: selectedNodeId === node.id ? '#22d3ee' : '#475569',
                  strokeWidth: adaptiveStroke,
                }"
              />
              <v-circle
                :config="{
                  radius: adaptiveStroke * 2,
                  fill: 'white',
                }"
              />
              <v-text
                :config="{
                  text: node.id,
                  fontSize: adaptiveFontSize,
                  x: 5 / currentScale,
                  y: 5 / currentScale,
                  fill: 'white',
                  fontStyle: 'bold',
                }"
              />
            </v-group>

            <!-- 4. ИГРОК -->
            <v-group
              v-if="player && map.nodes.find(n => n.id === player.position)"
              :config="{
                x: map.nodes.find(n => n.id === player.position)?.x,
                y: map.nodes.find(n => n.id === player.position)?.y,
              }"
            >
              <v-circle
                :config="{
                  radius: nodeSize / 2 + 5,
                  stroke: '#22d3ee',
                  strokeWidth: 3,
                }"
              />

              <v-image
                :config="{
                  image: images[`hero_${player.id}`],
                  width: 50,
                  height: 50,
                  x: -25,
                  y: -25,
                  cornerRadius: 25,
                }"
              />
            </v-group>

            <!-- 5. ИИ -->
            <v-group
              v-if="ai && map.nodes.find(n => n.id === ai.position)"
              :config="{
                x: map.nodes.find(n => n.id === ai.position)?.x,
                y: map.nodes.find(n => n.id === ai.position)?.y,
              }"
            >
              <v-circle
                :config="{
                  radius: nodeSize / 2 + 5,
                  stroke: '#22d3ee',
                  strokeWidth: 3,
                }"
              />

              <v-image
                :config="{
                  image: images[`hero_${ai.id}`],
                  width: 50,
                  height: 50,
                  x: -25,
                  y: -25,
                  cornerRadius: 25,
                }"
              />
            </v-group>
          </v-group>
        </v-layer>
      </v-stage>
    </div>
  </ClientOnly>
</template>

<script setup>
import { useGameStore } from '~/store/game.js';
import { usePlugins } from '~/composables/api/plugins';
import useKonvaLoader from '~/composables/useKonvaLoader';

const { map, player, ai } = storeToRefs(useGameStore());
const { CDN_BASE, suspense } = usePlugins();
await Promise.all([suspense()]);

const { images, loadAsset } = useKonvaLoader();
const { isDevMode, addNode, exportMap, handleEditorNodeClick, selectedNodeId, addNodeWithColor } =
  useMapEditor(map);

const nodeSize = computed(() => map.value?.settings?.nodeSize || 50);

const handleStageClick = e => {
  if (!isDevMode.value) return;
  if (e.target.hasName('map-bg')) {
    const stage = e.target.getStage();
    const transform = stage.findOne('.main-group').getAbsoluteTransform().copy().invert();
    const pos = transform.point(stage.getPointerPosition());
    addNodeWithColor(pos.x, pos.y, stage);
  }
};

const handleNodeClick = (e, nodeId) => {
  // 1. РЕЖИМ РЕДАКТОРА
  if (isDevMode.value) {
    if (e.evt.button === 2) {
      deleteNode(nodeId);
      return;
    }
    if (e.evt.shiftKey) {
      handleEditorNodeClick(nodeId, true);
      return;
    }
  }

  // 2. РЕЖИМ ИГРЫ
  console.log('Выбрана нода для хода/действия:', nodeId);
};

const stageRef = ref(null);
const stageConfig = ref({
  width: 0,
  height: 0,
  draggable: true,
});
const currentScale = ref(1);

const backgroundConfig = computed(() => {
  const bg = images.value.mapBg;
  if (!bg) return null;
  const stageW = stageConfig.value.width;
  const stageH = stageConfig.value.height;

  const scale = Math.min(stageW / bg.width, stageH / bg.height);

  return {
    x: (stageW - bg.width * scale) / 2,
    y: (stageH - bg.height * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    draggable: false,
  };
});

const handleWheel = e => {
  const stage = e.target.getStage();
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();

  const scaleBy = 1.1; // Скорость зума
  const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

  stage.scale({ x: newScale, y: newScale });

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };
  stage.position({
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  });
  currentScale.value = newScale;
};

const baseNodeSize = computed(() => 240 || map.value?.settings?.nodeSize);
const adaptiveRadius = computed(() => baseNodeSize.value / 2 / currentScale.value);
const adaptiveStroke = computed(() => 3 / currentScale.value);
const adaptiveFontSize = computed(() => {
  const scale = Math.max(currentScale.value, 0.01);
  const size = 14 / scale;
  return isNaN(size) ? 14 : size;
});

const connections = computed(() => {
  const nodes = map.value?.nodes || [];
  if (nodes.length === 0) return [];

  const lines = [];
  nodes.forEach(node => {
    if (!node.neighbors) return;

    node.neighbors.forEach(neighborId => {
      // Приводим к числу для надежного сравнения
      const nId = Number(neighborId);
      const cId = Number(node.id);

      if (nId > cId) {
        const target = nodes.find(n => Number(n.id) === nId);
        if (target) {
          lines.push({
            // Берем координаты напрямую из реактивных объектов
            points: [node.x, node.y, target.x, target.y],
            id: `line-${cId}-${nId}`,
          });
        }
      }
    });
  });
  return lines;
});

// Добавь эту функцию, чтобы линии двигались ВМЕСТЕ с кружком
const handleDragMove = (e, node) => {
  if (!isDevMode.value) return;
  // Обновляем координаты прямо в объекте стора
  node.x = Math.round(e.target.x());
  node.y = Math.round(e.target.y());
};

onMounted(() => {
  const stage = stageRef.value?.getStage();
  if (stage) {
    currentScale.value = stage.scaleX() || 1;
  }

  const mapUrl = `${CDN_BASE}maps/${map.value?.id}/${map.value?.assets?.background}`;
  const playerUrl = `${CDN_BASE}heroes/${player.value?.id}/${player.value?.assets.avatar}`;
  const aiUrl = `${CDN_BASE}heroes/${ai.value?.id}/${ai.value?.assets?.avatar}`;
  loadAsset('mapBg', mapUrl);
  loadAsset(`hero_${player.value?.id}`, playerUrl);
  loadAsset(`hero_${ai.value?.id}`, aiUrl);

  stageConfig.value.width = window.innerWidth;
  stageConfig.value.height = window.innerHeight;
  window.addEventListener('resize', () => {
    stageConfig.value.width = window.innerWidth;
    stageConfig.value.height = window.innerHeight;
  });
});
</script>
