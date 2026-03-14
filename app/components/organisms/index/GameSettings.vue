<template>
  <section
    class="w-full max-w-800 min-w-800 max-h-[80vh] overflow-hidden flex flex-col bg-slate-900 border border-slate-800 rounded-20 shadow-2xl"
  >
    <header class="p-24 border-b border-slate-800 flex justify-between items-center">
      <h2 class="text-2xl font-black italic text-white uppercase">
        <span class="text-cyan">Настройки</span> Битвы
      </h2>

      <div class="flex bg-slate-950 p-4 rounded-12 border border-slate-800">
        <button
          @click="selectionMode = 'player'"
          :class="[
            'px-16 py-8 rounded-8 text-12 font-black uppercase italic transition-all cursor-pointer',
            selectionMode === 'player'
              ? 'bg-cyan text-slate-900'
              : 'text-slate-500 hover:text-white',
          ]"
        >
          Игрок
        </button>
        <button
          @click="selectionMode = 'ai'"
          :class="[
            'px-16 py-8 rounded-8 text-12 font-black uppercase italic transition-all cursor-pointer',
            selectionMode === 'ai' ? 'bg-fuchsia text-white' : 'text-slate-500 hover:text-white',
          ]"
        >
          ИИ Оппонент
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto p-24 gap-16 flex flex-col">
      <label class="block text-slate-500 text-18 font-bold uppercase tracking-[0.01em]">
        {{ selectionMode === 'player' ? 'Выберите вашего героя' : 'Выберите противника' }}
      </label>

      <div v-if="isLoading" class="grid grid-cols-4 gap-4 animate-pulse">
        <div v-for="n in 4" :key="n" class="aspect-3/4 bg-slate-800 rounded-xl" />
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-16">
        <div
          v-for="hero in heroes"
          :key="hero.id"
          @click="handleHeroClick(hero.id)"
          :class="[
            'group relative aspect-3/4 cursor-pointer rounded-8 overflow-hidden border-2 transition-all p-12 flex',
            selectedPlayerHero === hero.id
              ? 'border-cyan shadow-[0_0_15_rgba(34,211,238,0.4)]'
              : selectedAiHero === hero.id
                ? 'border-fuchsia shadow-[0_0_15_rgba(217,70,239,0.4)]'
                : 'border-slate-800 hover:border-slate-600',
          ]"
        >
          <div
            v-if="selectedPlayerHero === hero.id"
            class="absolute top-8 left-8 z-10 bg-cyan text-slate-900 text-10 font-black px-6 py-2 rounded-4 uppercase"
          >
            Вы
          </div>
          <div
            v-if="selectedAiHero === hero.id"
            class="absolute top-8 right-8 z-10 bg-fuchsia text-white text-10 font-black px-6 py-2 rounded-4 uppercase"
          >
            ИИ
          </div>

          <NuxtImg
            :src="hero.avatar"
            loading="lazy"
            class="absolute top-0 left-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
          <div
            class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent opacity-80"
          />
          <div class="relative text-white font-bold uppercase text-14 italic z-1 self-end">
            {{ hero.name }}
          </div>
        </div>
      </div>
    </div>

    <footer class="p-24 bg-slate-800/30 flex justify-between items-center">
      <div class="flex gap-16 items-center">
        <div class="flex flex-col">
          <span class="text-10 uppercase text-slate-500 font-bold">Игрок:</span>
          <span class="text-cyan font-black italic uppercase text-14">{{
            selectedPlayerHero || '???'
          }}</span>
        </div>
        <div class="w-1 h-24 bg-slate-700"></div>
        <div class="flex flex-col">
          <span class="text-10 uppercase text-slate-500 font-bold">ИИ:</span>
          <span class="text-fuchsia font-black italic uppercase text-14">{{
            selectedAiHero || '???'
          }}</span>
        </div>
      </div>

      <button
        :disabled="!selectedPlayerHero || !selectedAiHero"
        class="px-10 py-3 rounded-xl bg-linear-to-r from-brand-violet to-brand-fuchsia text-white font-black italic uppercase tracking-wider disabled:opacity-30 disabled:grayscale transition hover:brightness-110 active:scale-95 disabled:cursor-default cursor-pointer"
        @click="handleStartBattle"
      >
        Начать битву
      </button>
    </footer>
  </section>
</template>
<script setup>
import { usePlugins, startBattle } from '~/composables/api/plugins';
import { useGameStore } from '~/store/game.js';

const { suspense, heroes, maps, isLoading, CDN_BASE } = usePlugins();
const { mutateAsync } = startBattle();

await Promise.all([suspense()]);

const selectedPlayerHero = ref(null);
const selectedAiHero = ref(null);
const selectionMode = ref('player');

const handleHeroClick = id => {
  if (selectionMode.value === 'player') {
    selectedPlayerHero.value = id;
    if (!selectedAiHero.value) selectionMode.value = 'ai';
  } else {
    selectedAiHero.value = id;
  }
};

const { initGame } = useGameStore();
const emits = defineEmits(['close']);

const handleStartBattle = async () => {
  await mutateAsync(
    {
      playerId: selectedPlayerHero.value,
      aiId: selectedAiHero.value,
      mapId: 'alchemy',
      heroes,
      maps,
    },
    {
      onSuccess: data => {
        initGame(data, CDN_BASE);
        emits('close');
      },
      onError: err => {
        console.error('Битва не началась:', err);
      },
    },
  );
};
</script>
