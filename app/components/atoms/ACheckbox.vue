<template>
  <label
    data-atom="checkbox"
    class="flex items-center group relative w-fit"
    :class="[$attrs.readonly ? 'cursor-default' : 'cursor-pointer']"
  >
    <input
      :id="id ? $attrs.name + '-' + id : $attrs.name"
      :value="id ? id : $attrs.name"
      class="hidden"
      type="checkbox"
      v-model="checked"
      :name="$attrs.name"
      :disabled="$attrs.disabled || $attrs.readonly"
      @input="update"
    />

    <div class="text-gray-40" :class="[$attrs.triggerClass]" v-if="trigger === 'default'">
      <IconChecked
        class="opacity-0 group-has-checked:opacity-100 transition h-24 w-24"
        v-if="checked"
      />
      <IconDefault class="opacity-100 group-has-checked:opacity-0 transition h-24 w-24" v-else />
    </div>

    <div class="transition" :class="[$attrs.labelClass]" v-if="$slots.default || label">
      <slot>{{ label }}</slot>
    </div>
  </label>
</template>
<script setup>
import IconChecked from '~/svg/checkbox-checked.svg';
import IconDefault from '~/svg/checkbox-default.svg';

const { id } = defineProps({
  id: { type: [String, Number], required: false, default: null },
  label: { type: String, required: false, default: '' },
  trigger: {
    type: String,
    default: '',
    validator: v => ['', 'default'].includes(v),
  },
});
const checked = defineModel();

const emits = defineEmits(['update:all']);

const attrs = useAttrs();
const update = e => {
  if (attrs.readonly) return e.preventDefault();
  emits('update:all', { checked: e.target?.checked, id: id || attrs.name });
};
</script>
