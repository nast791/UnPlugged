<template>
  <div class="relative inline-block">
    <input
      ref="colorInput"
      type="color"
      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      v-model="colorModel"
    />

    <div
      :class="styles({ isShadow: true })"
      :style="{
        backgroundColor: colorModel,
        boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), 0 0 15px ${colorModel}66`,
      }"
    />
  </div>
</template>

<script setup>
const colorModel = defineModel({ default: '' });

const colorPickerStyles = tv({
  base: 'w-27 h-27 rounded-6 transition-all ring-1 ring-black/40 border border-white/10 hover:scale-105 active:scale-95 cursor-pointer outline-none',
  variants: {
    isShadow: {
      true: 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.3)]',
    },
  },
  defaultVariants: {
    isShadow: true,
  },
});

const styles = colorPickerStyles;
</script>
