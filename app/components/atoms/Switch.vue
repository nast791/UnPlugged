<template>
  <SwitchRoot v-model:checked="isChecked" :class="styles.root()" as="div">
    <slot :checked="isChecked" :label="label">
      <div :class="styles.label()">
        <IconChecked
          v-if="isChecked"
          class="w-14 h-14 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
        />
        <span>{{ label }}</span>
      </div>
    </slot>
  </SwitchRoot>
</template>

<script setup>
import IconChecked from '~/svg/checked.svg';

const { trueValue, falseValue } = defineProps({
  trueValue: { type: Object, required: true },
  falseValue: { type: Object, required: true },
});

const modelValue = defineModel();

const isChecked = computed({
  get: () => modelValue.value === trueValue.id,
  set: val => (modelValue.value = val ? trueValue.id : falseValue.id),
});

const label = computed(() => (isChecked.value ? trueValue.name : falseValue.name));

const switchStyles = tv({
  slots: {
    root: 'group relative inline-flex items-center transition-all outline-none select-none cursor-pointer disabled:cursor-not-allowed',
    label: 'flex gap-6 w-full text-12! font-bold uppercase tracking-widest transition-color',
  },
  variants: {
    isChecked: {
      true: {
        label: 'text-emerald-400',
      },
      false: {
        label: 'text-cyan-500',
      },
    },
  },
});

const styles = computed(() => switchStyles({ isChecked: isChecked.value }));
</script>
