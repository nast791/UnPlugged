<template>
  <AvatarRoot :class="styles.root({ size, isActive })" :style="customStyles">
    <div v-if="isActive" :class="styles.glow()" />

    <div :class="styles.container()">
      <AvatarImage :src="src" :alt="alt" :class="styles.image()" />
      <AvatarFallback :class="styles.fallback()" :delay-ms="600">
        {{ initials }}
      </AvatarFallback>
    </div>

    <div :class="styles.overlay()" />
  </AvatarRoot>
</template>

<script setup>
const { color, alt } = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: String, default: 'md' },
  isActive: { type: Boolean, default: false },
  color: { type: String, default: '#06b6d4' },
});

const customStyles = computed(() => ({
  '--hero-color': color,
}));

const initials = computed(() => alt?.slice(0, 2).toUpperCase() || '?');

const avatarStyles = tv({
  slots: {
    root: 'relative shrink-0 rounded-full transition-all duration-300 group select-none',
    container:
      'flex items-center justify-center relative w-full h-full rounded-full overflow-hidden border border-black/40 z-10 bg-[#1a1f2e]',
    image:
      'w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110',
    fallback:
      'flex h-full w-full items-center justify-center bg-slate-800 text-white font-bold text-12',
    overlay:
      'absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none z-20',
    glow: 'absolute -inset-1 rounded-full animate-pulse opacity-50 z-0 bg-(--hero-color)',
  },
  variants: {
    size: {
      sm: { root: 'h-32 w-32' },
      md: { root: 'h-40 w-40' },
      lg: { root: 'h-64 w-64' },
      xl: { root: 'h-80 w-80' },
    },
    isActive: {
      true: {
        root: 'scale-110 z-30 shadow-[0_0_20px_color-mix(in_srgb,var(--hero-color),transparent_60%)]',
        glow: 'block',
      },
      false: {
        root: 'shadow-none',
        glow: 'hidden',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const styles = avatarStyles();
</script>
