<template>
  <v-group ref="imageNode" :config="groupConfig" v-if="position?.x || position?.y">
    <!-- Внешнее кольцо (подсветка хода) -->
    <v-circle
      :config="{
        radius: nodeSize / 3 + 1,
        stroke: color,
        strokeWidth: 3 / scale,
      }"
    />
    <!-- Аватар -->
    <v-image
      :config="{
        image: heroImg,
        width: nodeSize / 1.5,
        height: nodeSize / 1.5,
        x: -nodeSize / 3,
        y: -nodeSize / 3,
        cornerRadius: nodeSize / 2,
      }"
    />
  </v-group>
</template>

<script setup>
import useKonvaLoader from '~/composables/konva/useKonvaLoader';

const { imageUrl, position, nodeSize } = defineProps({
  position: { type: Object },
  imageUrl: { type: String },
  nodeSize: { type: Number },
  scale: { type: Number },
  color: { type: String },
  id: { type: [String, Number] },
});

const { loadAsset } = useKonvaLoader();
const heroImg = ref(null);
const imageNode = ref(null);

const groupConfig = computed(() => ({
  x: position?.x || 0,
  y: position?.y || 0,
  width: nodeSize,
  height: nodeSize,
}));

const initHero = async () => {
  if (!imageUrl) return;
  try {
    const img = await loadAsset(imageUrl);
    heroImg.value = img;
    await nextTick();
    const node = imageNode.value?.getNode();
    node?.getLayer()?.batchDraw();
  } catch (e) {
    console.error('Ошибка в MapHero:', e);
  }
};

onMounted(initHero);

watch(() => imageUrl, initHero);
</script>
