<template>
  <DialogRoot v-model:open="isOpen">
    <DialogPortal>
      <DialogOverlay :class="styles.overlay()" />

      <DialogContent :class="styles.content()">
        <VisuallyHidden>
          <DialogTitle>Модальное окно</DialogTitle>
          <DialogDescription>Описание контента модального окна</DialogDescription>
        </VisuallyHidden>

        <slot />

        <DialogClose :class="styles.close()">
          <IconCross />
          <span class="sr-only">Закрыть</span>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup>
import IconCross from '~/svg/cross-24.svg';

const isOpen = defineModel({ default: false });

const modalStyles = tv({
  slots: {
    overlay:
      'fixed inset-0 z-50 bg-black/70 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    content:
      'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
    close:
      'absolute right-6 top-6 rounded-sm opacity-70 transition-opacity hover:opacity-100 cursor-pointer text-slate-500 hidden',
  },
});
const styles = modalStyles();
</script>
