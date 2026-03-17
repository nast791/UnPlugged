<template>
  <v-image 
    v-if="bgImg" 
    ref="bgNode"
    :config="{ image: bgImg }" 
  />
</template>
<script setup>
const {imageUrl} = defineProps({
  imageUrl: String,
});
  
const emit = defineEmits(['loaded']);
const { loadAsset } = useKonvaLoader();
const bgImg = ref(null);
const bgNode = ref(null);
  
const initBackground = async () => {
  if (!imageUrl) return;
  try {
    const img = await loadAsset(imageUrl);
    bgImg.value = img;
    await nextTick();
    const node = bgNode.value?.getNode();
    const layer = node?.getLayer();
    
    if (layer) {
      layer.batchDraw();
      emit('loaded', img);
    }
  } catch (e) {
    console.error("Ошибка загрузки фона карты:", e);
  }
};
  
onMounted(initBackground);
  
watch(() => imageUrl, initBackground);
</script>