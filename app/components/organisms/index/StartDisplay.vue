<template>
  <section
    class="relative flex min-h-dvh flex-col items-center justify-center bg-slate-950 overflow-hidden px-24"
  >
    <div class="text-center">
      <h1 class="text-150 font-black italic tracking-tighter uppercase mb-2 drop-shadow-2xl">
        <span class="text-gradient">Un</span>Plugged
      </h1>

      <button
        @click="isModalOpen = true"
        class="group relative inline-flex items-center gap-10 rounded-full bg-slate-900 border border-slate-800 px-20 py-10 text-30 font-bold text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <div
          class="absolute -inset-0.5 rounded-full bg-linear-to-r from-brand-cyan via-brand-violet to-brand-fuchsia opacity-50 blur group-hover:opacity-100 transition"
        />
        <span
          class="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-cyan text-slate-500"
          >+</span
        >
        <span class="relative">НОВАЯ ИГРА</span>
      </button>
    </div>

    <Modal v-model="isModalOpen">
      <GameSettings @close="isModalOpen = false" />
    </Modal>
  </section>
</template>
<script setup>
import Modal from '~/components/atoms/Modal.vue';
import GameSettings from '~/components/organisms/index/GameSettings.vue';
const isModalOpen = ref(false);
</script>
