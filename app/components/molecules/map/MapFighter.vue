<template>
  <v-group ref="imageNode" :config="groupConfig" v-if="position?.x || position?.y">
    <v-circle
      v-if="item.active"
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

    <!-- 1. Тень под фишкой (для эффекта левитации) -->
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

    <!-- 2. Основание фишки (пластиковый борт) -->
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

    <!-- 3. Внутренняя кромка (создает объемный бортик) -->
    <v-circle
      :config="{
        radius: nodeSize / 3 - 1,
        stroke: 'rgba(255,255,255,0.2)',
        strokeWidth: 2,
        listening: false,
      }"
    />

    <!-- 3. АВАТАР -->
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

      <!-- НОВОЕ: Слой для "сочности" цветов (Overlay) -->
      <v-circle
        v-if="item.active"
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

const model = defineModel();
const { loadAsset } = useKonvaLoader();
const heroImg = ref(null);
const imageNode = ref(null);
const emit = defineEmits(['click']);

const isHovered = ref(false);

const groupConfig = computed(() => {
  let scale = 1;
  if (isHovered.value) scale = 1.1;
  if (item.active) scale = 1.15;

  return {
    x: position?.x || 0,
    y: position?.y || 0,
    scaleX: scale,
    scaleY: scale,
    width: nodeSize,
    height: nodeSize,
    listening: true,
    onClick: onFighterSelect,
    onTap: onFighterSelect,
    onMouseEnter: e => {
      isHovered.value = true;
      const stage = e.target.getStage();
      if (stage) {
        stage.container().style.cursor = 'pointer';
      }
    },

    onMouseLeave: e => {
      isHovered.value = false;
      const stage = e.target.getStage();
      if (stage) {
        stage.container().style.cursor = 'default';
      }
    },
  };
});

const initFighter = async () => {
  if (!imageUrl) return;
  try {
    const img = await loadAsset(imageUrl);
    heroImg.value = img;
    await nextTick();
    const node = imageNode.value?.getNode();
    node?.getLayer()?.batchDraw();
  } catch (e) {
    console.error('Ошибка', e);
  }
};

const { $handleFighterClick } = useNuxtApp();

const onFighterSelect = () => {
  const result = $handleFighterClick(item);
  model.value = result || [];
};

onMounted(initFighter);

watch(() => imageUrl, initFighter);
watch(
  () => item.active,
  isActive => {
    if (!isActive) {
      model.value = [];
    }
  },
);
</script>
