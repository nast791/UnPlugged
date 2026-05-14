<template>
  <section
    class="w-full max-w-800 min-w-800 max-h-[80vh] overflow-hidden flex flex-col bg-slate-900 border border-slate-800 rounded-20 shadow-2xl"
  >
    <header class="p-24 border-b border-slate-800 flex justify-between items-center">
      <h2 class="text-2xl font-black italic text-white uppercase">
        <span class="text-cyan">Настройки</span> Битвы
      </h2>
    </header>

    <div class="flex flex-col gap-24 p-24">
      <Players :heroes="heroes" />
      <Maps :maps="maps" />
    </div>

    <Footer
      :players="selectedPlayers"
      :map="selectedMap"
      :isReady="!!isReadyToStart"
      @start="runGameInit()"
    />
  </section>
</template>
<script setup>
// TODO: Рандомно или нет выбор очередности ходов (тоже переключатель, по умолчанию - не рандомно)
// TODO: Поиск у селекта по названию.
// TODO: Сортировка у селекта карт.
// TODO: Лимит времени на ход (для PVP).
// TODO: Если игроков 4, нужно выбрать: это режим «2 на 2» или «каждый сам за себя» (Free-for-all).
// TODO: Уровень сложности ИИ (если выбран хотя бы 1 ИИ).
// TODO: Рандомный выбор за игрока и/или ИИ
// TODO: Перетаскивание селектов
import Players from '~/components/molecules/settings/Players.vue';
import Maps from '~/components/molecules/settings/Maps.vue';
import Footer from '~/components/molecules/settings/Footer.vue';
import { usePlugins } from '~/composables/api/plugins';
import { useGameStore } from '~/store/game.js';
import { useGameInit } from '~/composables/game/useGameInit';
import { useAppStore } from '~/store/app';

const { selectedPlayers, selectedMap } = storeToRefs(useGameStore());
const { runGameInit } = useGameInit();
const appStore = useAppStore();

const { suspense, heroes, maps } = usePlugins();

await Promise.all([suspense()]);

const emits = defineEmits(['close']);

const isReadyToStart = computed(() => {
  return (
    selectedMap.value?.id &&
    selectedPlayers.value?.length === 2 &&
    selectedPlayers.value?.find(i => i.type === appStore.glossary?.meta?.players?.[0]?.id) &&
    selectedPlayers.value?.find(i => i.type === appStore.glossary?.meta?.players?.[1]?.id)
  );
});
</script>
