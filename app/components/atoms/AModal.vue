<template>
  <div
    data-atom="modal"
    class="scrollbar-hidden fixed inset-0 flex top-0 l-0 items-center justify-center bg-[rgba(4,4,4,0.7)] backdrop-blur-[3px] min-h-screen overflow-x-hidden overflow-y-auto z-1000"
    @click.self="emits('close')"
  >
    <div class="w-auto flex flex-col relative">
      <!-- <IconCross
        class="absolute top-6 right-6 cursor-pointer text-slate-500"
        @click.self="emits('close')"
      /> -->
      <slot />
    </div>
  </div>
</template>
<script setup>
import IconCross from '~/svg/cross-24.svg';
import useUtils from '~/composables/useUtils';

const { toggleStopScrolling } = useUtils();

const emits = defineEmits(['close']);

onMounted(() => {
  toggleStopScrolling(true);
});

onUnmounted(() => {
  toggleStopScrolling(false);
});
</script>
