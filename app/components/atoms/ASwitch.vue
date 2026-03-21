<template>
  <HSwitch
    v-model="isChecked"
    class="group relative inline-flex items-center transition-all outline-none select-none cursor-pointer disabled:cursor-not-allowed"
    v-slot="{ checked }"
  >
    <slot :checked="checked" :label="label">{{ label }}</slot>
  </HSwitch>
</template>
<script setup>
const { trueValue, falseValue } = defineProps({
  trueValue: Object,
  falseValue: Object,
});

const modelValue = defineModel();

const isChecked = computed({
  get: () => modelValue.value === trueValue.id,
  set: val => (modelValue.value = val ? trueValue.id : falseValue.id),
});

const label = computed(() => (isChecked.value ? trueValue?.name : falseValue?.name));
</script>
