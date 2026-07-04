<template>
  <v-group :config="groupConfig">
    <v-circle :config="hoverConfig" v-if="isHovered" />
    <v-circle :config="mainCircleConfig" />
    <v-circle v-if="isHighlighted" :config="highlightConfig" />
  </v-group>
</template>

<script setup>
import { useBoardgame } from '~/composables/game/useBoardgame';
import { useGlobalDrag } from '~/composables/game/useGlobalDrag';
import { useCardPlayPhase } from '~/composables/game/useCardPlayPhase';
import { CELL_HIGHLIGHTS } from '#shared/constants/highlights';
import { getOwnPickedId } from '#shared/utils/rules/helpers';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  node: { type: Object, required: true },
  nodeSize: { type: Number, default: 40 },
});

const emit = defineEmits(['select']);

const isHovered = ref(false);
const { client, activePlayer, G, ctx } = useBoardgame();
const { dragItem } = useGlobalDrag();
const { isSelectingCell, isCellSelectable } = useCardPlayPhase();

watch(dragItem, newItem => {
  if (newItem) {
    client.value.moves.getAvailableCells({ fighterId: newItem.id });
  }
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

const highlightings = CELL_HIGHLIGHTS;

const isHighlighted = computed(() => {
  const id = String(props.node.id);
  if (dragItem.value) {
    const type = dragItem.value.type;
    if (G.value.highlightCells[type] && Array.isArray(G.value.highlightCells[type])) {
      return G.value.highlightCells[type].map(String).includes(id);
    }
    return false;
  }

  if (Array.isArray(G.value.highlightCells)) {
    return G.value.highlightCells.map(String).includes(id);
  }

  return false;
});

const currentPhase = computed(() => ctx.value?.phase);

const currentHighlight = computed(() => {
  if (currentPhase.value === 'UNIT_PLACEMENT') return highlightings?.[0];
  if (currentPhase.value === 'MOVEMENT') return highlightings?.[1];
  if (G.value?.pipeline) return highlightings?.[1];
  return highlightings?.[0];
});

const highlightConfig = computed(() => ({
  x: 0,
  y: 0,
  radius: props.nodeSize / 2 + 5,
  stroke: currentHighlight.value.color,
  strokeWidth: 4,
  opacity: 0.9,
  shadowColor: currentHighlight.value.color,
  shadowBlur: 10,
  listening: false,
}));

const handlePointerClick = e => {
  if (e.cancelBubble !== undefined) e.cancelBubble = true;
  const cellId = String(props.node.id);

  if (isSelectingCell.value && isCellSelectable(cellId)) {
    client.value?.moves?.selectCell?.({ cellId });
    emit('select', e, props.node.id);
    return;
  }

  const pickedId = getOwnPickedId(G.value);
  if (!pickedId) return;
  const phase = currentPhase.value;
  if (phase === 'MOVEMENT' && client.value?.moves?.moveFighter) {
    client.value.moves.moveFighter({ fighterId: pickedId, targetId: props.node.id });
  } else if (phase === 'UNIT_PLACEMENT' && client.value?.moves?.placeUnit) {
    client.value.moves.placeUnit({ unitId: pickedId, circleId: Number(props.node.id) });
  }
  emit('select', e, props.node.id);
};
</script>
