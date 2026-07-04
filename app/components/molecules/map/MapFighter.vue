<template>
  <v-group ref="imageNode" :config="groupConfig" v-if="position?.x || position?.y">
    <v-circle
      v-if="isOwnSelected"
      :config="{
        radius: nodeSize / 3 + 8,
        fill: color,
        opacity: 0.5,
        shadowColor: color,
        shadowBlur: 50,
        shadowOpacity: 0.8,
        listening: false,
      }"
    />
    <v-circle
      :config="{
        radius: nodeSize / 3 + 2,
        fill: 'black',
        opacity: 0.4,
        shadowBlur: 10,
        shadowOffset: { x: 4, y: 4 },
        listening: false,
      }"
    />
    <v-circle
      :config="{
        radius: nodeSize / 3 + 2,
        fillLinearGradientStartPoint: { x: -20, y: -20 },
        fillLinearGradientEndPoint: { x: 20, y: 20 },
        fillLinearGradientColorStops: [0, color, 0.5, color, 1, '#000000'],
        stroke: '#000000',
        strokeWidth: 1,
      }"
    />
    <v-circle
      :config="{
        radius: nodeSize / 3 - 1,
        stroke: 'rgba(255,255,255,0.2)',
        strokeWidth: 2,
        listening: false,
      }"
    />
    <v-group>
      <v-image
        :config="{
          image: heroImg,
          width: nodeSize / 1.6,
          height: nodeSize / 1.6,
          x: -nodeSize / 3.2,
          y: -nodeSize / 3.2,
          cornerRadius: nodeSize / 2,
          stroke: '#000000',
          strokeWidth: 1,
        }"
      />
      <v-line v-if="slashing" :config="slashLineConfig" />
      <v-circle
        v-if="isOwnSelected"
        :config="{
          radius: nodeSize / 3.2,
          fillRadialGradientStartRadius: 0,
          fillRadialGradientEndRadius: nodeSize / 3,
          fillRadialGradientColorStops: [0, 'transparent', 0.7, color, 1, 'transparent'],
          opacity: 0.4,
          globalCompositeOperation: 'overlay',
          listening: false,
        }"
      />
    </v-group>
  </v-group>
</template>

<script setup>
import useKonvaLoader from '~/composables/konva/useKonvaLoader';
import { useBoardgame } from '~/composables/game/useBoardgame';
import { useCardPlayPhase } from '~/composables/game/useCardPlayPhase';
import { useFighterDamageSlash, getLightningKonvaPoints, LIGHTNING_DASH_LEN } from '~/composables/game/useFighterDamageSlash';
import { getOwnPickedId } from '#shared/utils/rules/helpers';

defineOptions({
  inheritAttrs: false,
});

const { imageUrl, position, nodeSize, item } = defineProps({
  position: { type: Object },
  imageUrl: { type: String },
  nodeSize: { type: Number },
  scale: { type: Number, default: 1 },
  color: { type: String },
  item: { type: Object, required: true },
});

const { loadAsset } = useKonvaLoader();
const heroImg = ref(null);
const imageNode = ref(null);
const { client, G } = useBoardgame();
const { isFighterSelectable } = useCardPlayPhase();
const { slashOpacity, slashDashOffset, slashing } = useFighterDamageSlash(
  () => item.id,
  () => item.currentHp,
);

const playerId = computed(() =>
  G.value?.players?.find(p => p.fighters?.some(f => f.id === item.id))?.id,
);

const isOwnSelected = computed(() => getOwnPickedId(G.value) === String(item.id));

const slashLineConfig = computed(() => ({
  points: getLightningKonvaPoints(),
  stroke: '#f8fafc',
  strokeWidth: 3.5,
  lineCap: 'round',
  lineJoin: 'round',
  opacity: Math.max(slashOpacity.value, slashDashOffset.value < LIGHTNING_DASH_LEN ? 0.9 : 0),
  dash: [LIGHTNING_DASH_LEN],
  dashOffset: slashDashOffset.value,
  shadowColor: '#ffffff',
  shadowBlur: 16,
  shadowOpacity: 0.85,
  listening: false,
}));

const canSelect = computed(() => {
  const ownerId = playerId.value;
  if (ownerId == null) return false;
  return isFighterSelectable(item, ownerId);
});

const handleSelect = () => {
  if (!canSelect.value) return;
  client.value?.moves?.selectTarget?.({ fighterId: item.id });
};

const isHovered = ref(false);

const groupConfig = computed(() => {
  let scale = 1;
  if (isHovered.value) scale = 1.1;
  if (isOwnSelected.value) scale = 1.15;

  return {
    x: position?.x || 0,
    y: position?.y || 0,
    scaleX: scale,
    scaleY: scale,
    width: nodeSize,
    height: nodeSize,
    listening: true,
    onClick: () => handleSelect(),
    onTap: () => handleSelect(),
    onMouseEnter: e => {
      if (!canSelect.value) return;
      isHovered.value = true;
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'pointer';
    },
    onMouseLeave: e => {
      isHovered.value = false;
      const stage = e.target.getStage();
      if (stage) stage.container().style.cursor = 'default';
    },
  };
});

const initFighter = async () => {
  if (!imageUrl) return;
  try {
    const img = await loadAsset(imageUrl);
    if (cancelled) return;
    heroImg.value = img;
    await nextTick();
    if (cancelled) return;
    imageNode.value?.getNode()?.getLayer()?.batchDraw();
  } catch (e) {
    console.error('Ошибка', e);
  }
};

let cancelled = false;
onUnmounted(() => {
  cancelled = true;
});

onMounted(initFighter);
watch(() => imageUrl, initFighter);
watch([slashOpacity, slashDashOffset, slashing], () => {
  imageNode.value?.getNode()?.getLayer()?.batchDraw();
});
</script>
