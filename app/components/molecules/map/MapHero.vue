<template>
  <v-group ref="imageNode" :config="imageConfig">
    <!-- Внешнее кольцо (подсветка хода) -->
    <v-circle
      :config="{
        radius: nodeSize / 4 + 1,
        stroke: color,
        strokeWidth: 3 / scale,
      }"
    />
    <!-- Аватар -->
    <v-image
      :config="{
        image: heroImg,
        width: nodeSize / 2,
        height: nodeSize / 2,
        x: -nodeSize / 4,
        y: -nodeSize / 4,
        cornerRadius: nodeSize / 2,
      }"
    />
  </v-group>
</template>

<script setup>
const { imageUrl, position, nodeSize } = defineProps({
  position: { type: Object },
  imageUrl: { type: String },
  nodeSize: { type: Number },
  scale: { type: Number },
  color: { type: String },
});

const { loadAsset } = useKonvaLoader();
const heroImg = ref(null);
const imageNode = ref(null);

const imageConfig = computed(() => ({
  image: heroImg.value,
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
