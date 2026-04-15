<template>
  <v-group :config="groupConfig">
    <v-circle :config="hoverConfig" v-if="isHovered" />
    <v-circle :config="mainCircleConfig" />
    <v-circle v-if="activeStatus" :config="highlightConfig" />
  </v-group>
</template>

<script setup>
import { useGlobalDrag } from '~/composables/game/useGlobalDrag';
import { useUnitPlacement } from '~/composables/phases/useUnitPlacement';
import { useAppStore } from '~/store/app.js';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  node: { type: Object, required: true },
  nodeSize: { type: Number, default: 40 },
});

const emit = defineEmits(['select']);
const appStore = useAppStore();

const isHovered = ref(false);
const { dragItem } = useGlobalDrag();
const { availableSpawnPoints } = useUnitPlacement();

const highlightings = appStore.glossary?.meta?.highlighting;

const activeStatus = computed(() => {
  if (dragItem.value) {
    const type = dragItem.value.type;
    const isSpawn = availableSpawnPoints.value[type]?.map(String).includes(String(props.node.id));
    return isSpawn ? highlightings?.[0] : null;
  }
  return null;
});

const groupConfig = computed(() => ({
  x: props.node.x,
  y: props.node.y,
  listening: true,
  onClick: e => handlePointerClick(e),
  onTap: e => handlePointerClick(e),
  onMouseEnter: e => {
    isHovered.value = true;
    const stage = e.target.getStage();
    stage.container().style.cursor = 'pointer';
  },
  onMouseLeave: e => {
    isHovered.value = false;
    const stage = e.target.getStage();
    stage.container().style.cursor = 'default';
  },
}));

const mainCircleConfig = computed(() => ({
  x: 0,
  y: 0,
  radius: props.nodeSize / 2,
}));

const hoverConfig = computed(() => ({
  radius: props.nodeSize / 2 + 4,
  fill: 'white',
  opacity: 0.2,
}));

const highlightConfig = computed(() => ({
  x: 0,
  y: 0,
  radius: props.nodeSize / 2 + 5,
  stroke: activeStatus.value.color,
  strokeWidth: 4,
  opacity: 0.9,
  shadowColor: activeStatus.value.color,
  shadowBlur: 10,
  listening: false,
}));

const handlePointerClick = e => {
  if (e.cancelBubble !== undefined) e.cancelBubble = true;
  emit('select', e, props.node.id);
};
</script>
