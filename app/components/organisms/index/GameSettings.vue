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

    <footer class="p-24 bg-slate-800/30 flex justify-between items-center">
      <div
        class="flex items-center gap-12 select-none group"
        v-if="players?.length > 1 && map && players?.find(i => i.type === 'player')"
      >
        <span
          class="text-12 font-black uppercase tracking-[0.1em] text-slate-500 transition-colors group-hover:text-slate-400"
        >
          Режим
        </span>

        <div
          class="relative px-12 py-4 rounded-8 bg-linear-to-r from-fuchsia-500/10 to-fuchsia-600/5 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]"
          v-if="players.length === 2"
        >
          <span
            class="text-14 font-black uppercase tracking-[0.05em] text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]"
          >
            Дуэль
          </span>
        </div>
      </div>

      <button
        :disabled="players.length < 2 || !players.find(i => i.type === 'player') || !map"
        class="ml-auto px-10 py-3 rounded-xl bg-linear-to-r from-brand-violet to-brand-fuchsia text-white font-black italic uppercase tracking-wider disabled:opacity-30 disabled:grayscale transition hover:brightness-110 active:scale-95 disabled:cursor-default cursor-pointer"
        @click="finishPhase"
      >
        Начать битву
      </button>
    </footer>
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
import { usePlugins, startBattle } from '~/composables/api/plugins';
import { useGameStore } from '~/store/game.js';
import useProcessor from '~/composables/game/useProcessor';
import useSetup from '~/composables/game/useSetup';

onMounted(() => {
  useGameStore().$reset();
  phase.value = 'GAME_SETUP';
});

const { suspense, heroes, maps } = usePlugins();

await Promise.all([suspense()]);

const { players, phase, map } = storeToRefs(useGameStore());
const emits = defineEmits(['close']);

const { setupNewGame } = useSetup();
const { process } = useProcessor({ setupNewGame });

const finishPhase = () => {};
</script>
