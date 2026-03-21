<template>
  <div
    class="relative shrink-0 rounded-full transition-all"
    :class="[sizes[size], isActive ? 'scale-110 z-10' : 'grayscale-[0.5] hover:grayscale-0']"
    :style="{
      '--hero-color': color,
      'ring-color': color,
      'box-shadow': isActive ? `0 0 20px ${color}66` : 'none',
    }"
  >
    <!-- Сама картинка -->
    <div class="w-full h-full rounded-full overflow-hidden border border-black/40 relative z-1">
      <img
        :src="src"
        class="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-110"
        alt=""
      />
    </div>

    <div
      class="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none"
    />

    <div
      v-if="isActive"
      class="absolute -inset-1 rounded-full animate-pulse opacity-50 z-0"
      :style="{ backgroundColor: color }"
    />
  </div>
</template>
<script setup>
defineProps({
  src: String,
  color: String,
  size: { type: String, default: 's48' },
  isActive: { type: Boolean, default: false },
});

const sizes = {
  32: 'w-32 h-32 ring-2',
  40: 'w-40 h-40 ring-2',
  48: 'w-48 h-48 ring-2',
  80: 'w-80 h-80 ring-4',
};
</script>
