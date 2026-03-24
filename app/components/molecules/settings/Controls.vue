<template>
  <div :class="styles.container()">
    <Primitive
      v-if="showPlus"
      as="button"
      type="button"
      :class="styles.button()"
      @click="$emit('add')"
    >
      <IconPlus :class="styles.icon({ intent: 'plus' })" />
    </Primitive>

    <Primitive
      v-if="showMinus"
      as="button"
      type="button"
      :class="styles.button()"
      @click="$emit('remove')"
    >
      <IconMinus :class="styles.icon({ intent: 'minus' })" />
    </Primitive>
  </div>
</template>
<script setup>
import IconPlus from '~/svg/plus.svg';
import IconMinus from '~/svg/minus.svg';

defineProps({
  showPlus: Boolean,
  showMinus: Boolean
});

defineEmits(['add', 'remove']);

const controlStyles = tv({
  slots: {
    container: 'flex flex-col gap-2 shrink-0',
    button: 'group flex items-center justify-center size-27 rounded-6 bg-linear-to-b from-[#3a4255] to-[#1e232d] border border-black/60 ring-1 ring-inset ring-white/10 shadow-md cursor-pointer transition-all hover:from-[#434c62] active:translate-y-0.5 active:shadow-inner',
    icon: 'size-14 text-slate-400 transition-colors',
  },
  variants: {
    intent: {
      plus: { icon: 'group-hover:text-cyan-400' },
      minus: { icon: 'group-hover:text-red-400' }
    }
  }
});

const styles = controlStyles();
</script>