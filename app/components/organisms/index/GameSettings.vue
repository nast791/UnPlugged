<template>
  <section
    class="w-full max-w-800 min-w-800 max-h-[80vh] overflow-hidden flex flex-col bg-slate-900 border border-slate-800 rounded-20 shadow-2xl"
  >
    <header class="p-24 border-b border-slate-800 flex justify-between items-center">
      <h2 class="text-2xl font-black italic text-white uppercase">
        <span class="text-cyan">Настройки</span> Битвы
      </h2>
    </header>

    <div class="flex-1 p-24 gap-16 flex flex-col">
      <label class="block text-slate-500 text-18 font-bold uppercase tracking-[0.01em]">
        Герои
      </label>

      <div v-if="isLoading" class="grid grid-cols-4 gap-4 animate-pulse">
        <div v-for="n in 4" :key="n" class="aspect-3/4 bg-slate-800 rounded-xl" />
      </div>

      <div class="flex flex-col gap-8" v-else>
        <div class="flex gap-16 items-center" v-for="(item, index) in counter" :key="item">
          <div class="text-white min-w-6">
            {{ index + 1 }}
          </div>

          <ASelect
            class="flex-1"
            :modelValue="players[index]?.id"
            placeholder="Выберите героя"
            :options="listHeroes"
            @active="addPlayer($event, index)"
          />

          <div
            class="w-30 h-30 rounded-8"
            :style="`background: ${players[index].color}`"
            v-if="players[index]?.color"
          />

          <div
            class="flex flex-col gap-4"
            v-if="
              (players?.length === counter &&
                players?.length < MAX &&
                listHeroes?.filter(i => !i.disabled).length > 0) ||
              players?.length > 0
            "
          >
            <IconPlus
              class="text-white w-24 h-24 cursor-pointer"
              @click="addRow"
              v-if="
                players?.length === counter &&
                players?.length < MAX &&
                listHeroes?.filter(i => !i.disabled).length > 0
              "
            />
            <IconMinus
              class="text-white w-24 h-24 cursor-pointer"
              @click="removeRow(index)"
              v-if="players?.length > 0"
            />
          </div>
        </div>
      </div>

      <!-- <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-16">
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
      </div> -->
    </div>

    <footer class="p-24 bg-slate-800/30 flex justify-between items-center">
      <div class="flex gap-16 items-center">
        <div class="flex flex-col">
          <span class="text-10 uppercase text-slate-500 font-bold">Игрок:</span>
          <span class="text-cyan font-black italic uppercase text-14">{{ '???' }}</span>
        </div>
        <div class="w-1 h-24 bg-slate-700"></div>
        <div class="flex flex-col">
          <span class="text-10 uppercase text-slate-500 font-bold">ИИ:</span>
          <span class="text-fuchsia font-black italic uppercase text-14">{{ '???' }}</span>
        </div>
      </div>

      <button
        :disabled="players.length < 2"
        class="px-10 py-3 rounded-xl bg-linear-to-r from-brand-violet to-brand-fuchsia text-white font-black italic uppercase tracking-wider disabled:opacity-30 disabled:grayscale transition hover:brightness-110 active:scale-95 disabled:cursor-default cursor-pointer"
        @click="finishPhase"
      >
        Начать битву
      </button>
    </footer>
  </section>
</template>
<script setup>
// TODO: галка Игрок и ИИ.
// TODO: по умолчанию галка ставится на 1 героя, если в массиве героев он только 1
// TODO: при клике по Игроку или ИИ переключается тип
// TODO: Кнопка начать игру заблокирована, если не выбран ровно 1 игрок
// TODO: Селект стили
// TODO: Перетаскивание селектов
// TODO: Цвет - что-то придумать
// TODO: В строке селекта в списке выбора показывать аватар, обведенный цветом
// TODO: Рандомно или нет выбор очередности ходов (тоже переключатель, по умолчанию - не рандомно)
// TODO: выбор карты - название - макс. кол-во игроков

// TODO: Поиск у селекта по названию.
// TODO: Сортировка у селекта карт.
// TODO: Лимит времени на ход (для PVP).
// TODO: Если игроков 4, нужно выбрать: это режим «2 на 2» или «каждый сам за себя» (Free-for-all).
// TODO: Уровень сложности ИИ (если выбран хотя бы 1 ИИ).
// TODO: Рандомный выбор за игрока и/или ИИ
import IconPlus from '~/svg/plus.svg';
import IconMinus from '~/svg/minus.svg';
import ASelect from '~/components/atoms/ASelect.vue';
import { usePlugins, startBattle } from '~/composables/api/plugins';
import { useGameStore } from '~/store/game.js';
import useProcessor from '~/composables/game/useProcessor';
import useSetup from '~/composables/game/useSetup';
import useUtils from '~/composables/useUtils';

const MAX = 4;
const { suspense, heroes, maps, isLoading } = usePlugins();
// const { mutateAsync } = startBattle();

await Promise.all([suspense()]);

// const selectedPlayerHero = ref(null);
// const selectedAiHero = ref(null);

// const handleStartBattle = async () => {
//   await mutateAsync(
//     {
//       playerId: selectedPlayerHero.value,
//       aiId: selectedAiHero.value,
//       mapId: 'alchemy',
//       heroes,
//       maps,
//     },
//     {
//       onSuccess: data => {
//         initGame(data);
//         emits('close');
//       },
//       onError: err => {
//         console.error('Битва не началась:', err);
//       },
//     },
//   );
// };

const { players, phase } = storeToRefs(useGameStore());
const counter = ref(1);
const emits = defineEmits(['close']);

const { setupNewGame } = useSetup();
const { process } = useProcessor({ setupNewGame });
const { cloneDeep } = useUtils();

onMounted(() => {
  useGameStore().$reset();
  phase.value = 'GAME_SETUP';
});

const listHeroes = computed(() =>
  heroes.value?.map(i => {
    if (players.value?.find(p => p.id === i.id)) {
      i.disabled = true;
    } else {
      i.disabled = false;
    }
    return i;
  }),
);

const addPlayer = (item, index) => {
  const player = cloneDeep(item);
  delete player.disabled;
  if (players.value[index]) {
    players.value[index] = player;
  } else {
    players.value.push(player);
  }
};

const addRow = () => {
  if (counter.value < MAX) {
    counter.value++;
  }
};

const removeRow = index => {
  if (counter.value > 1) {
    players.value?.splice(index, 1);
    counter.value--;
  }
};

const finishPhase = () => {};
</script>
