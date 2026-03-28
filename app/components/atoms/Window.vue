<template>
  <DialogRoot :open="isOpen" @update:open="onClose">
    <DialogPortal>
      <div class="fixed inset-0 pointer-events-none" :style="{ zIndex: zIndex }">
        <DraggableResizableVue
          v-model:x="windowRect.x"
          v-model:y="windowRect.y"
          v-model:w="windowRect.width"
          v-model:h="windowRect.height"
          :handles="['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'ml', 'mr']"
          :drag-handle="'.window-header'"
          :active="true"
          @mousedown="emits('focus')"
          class="pointer-events-auto bg-black-100 border-solid! rounded-8 shadow-2xl flex flex-col h-full w-full"
        >
          <div
            class="window-header cursor-move flex items-center justify-between px-16 py-8 text-white font-bold rounded-t-8"
            :style="{ backgroundColor: color, color: getContrastColor(color) >= 130 ? '#000000' : '#ffffff' }"
          >
            <DialogTitle class="text-16 uppercase tracking-wider">
              {{ title }}
            </DialogTitle>

            <DialogClose as-child>
              <button
                class="hover:bg-black/20 rounded transition-colors flex cursor-pointer"
                @click="onClose"
              >
                <Icon name="material-symbols-light:close-rounded" :size="27" />
              </button>
            </DialogClose>
          </div>

          <ScrollArea class="flex-1 text-neutral-200 px-16">
            <slot />
          </ScrollArea>
        </DraggableResizableVue>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>
<script setup>
import DraggableResizableVue from 'draggable-resizable-vue3';
import ScrollArea from '~/components/atoms/ScrollArea.vue';
import useUtils from '~/composables/useUtils';

defineProps({
  title: String,
  color: { type: String, default: '#7a7f8d' },
  isOpen: { type: Boolean, default: false },
  zIndex: Number,
});

const windowRect = ref({
  x: 100,
  y: 100,
  width: 400,
  height: 300,
});

const emits = defineEmits(['close', 'focus']);

const onClose = () => {
  emits('close');
};

const { getContrastColor } = useUtils();
</script>
