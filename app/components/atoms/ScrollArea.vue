<template>
  <ScrollAreaRoot ref="rootRef" class="relative overflow-hidden group/scroll">
    <ScrollAreaViewport class="w-full h-full p-inherit">
      <slot />
    </ScrollAreaViewport>

    <!-- Вертикальный скроллбар -->
    <ScrollAreaScrollbar
      class="flex select-none touch-none bg-slate-950/10 transition-colors w-6 hover:bg-black/20"
      orientation="vertical"
    >
      <ScrollAreaThumb
        class="flex-1 bg-slate-700 rounded-full relative transition-colors hover:bg-slate-500/80 cursor-pointer"
      />
    </ScrollAreaScrollbar>

    <!-- Горизонтальный (опционально) -->
    <!-- <ScrollAreaScrollbar
      class="flex select-none touch-none bg-slate-950/10 transition-colors h-6 hover:bg-black/20"
      orientation="horizontal"
    >
      <ScrollAreaThumb class="flex-1 bg-slate-700 rounded-full relative" />
    </ScrollAreaScrollbar> -->

    <ScrollAreaCorner class="bg-black/20" />
  </ScrollAreaRoot>
</template>

<script setup>
const rootRef = ref(null);

const scrollToBottom = () => {
  const viewport = rootRef.value?.$el.querySelector('[data-radix-scroll-area-viewport]');

  if (viewport) {
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth',
    });
  } else {
    const fallback = rootRef.value?.$el.querySelector('.w-full.h-full');
    if (fallback) fallback.scrollTop = fallback.scrollHeight;
  }
};

defineExpose({ scrollToBottom });
</script>
