<template>
  <aside
    class="h-full bg-black-90/70 text-slate-200 flex flex-col border-l border-white/10 shadow-2xl overflow-hidden"
  >
    <div class="flex-1 overflow-y-auto p-16 space-y-24">
      <section
        v-for="player in players"
        :key="player.id"
        class="relative flex flex-col gap-12 transition-all"
        :class="[
          +player.index === +activePlayerIndex
            ? 'opacity-100 scale-100'
            : 'opacity-70 scale-[0.98]',
        ]"
      >
        <Player :item="player" />

        <!-- Герои  -->
        <div class="flex flex-col gap-6">
          <Fighter
            v-for="unit in player.fighters"
            :item="unit"
            :player="player"
            :group="player.fighters?.filter(i => i.type === unit.type)"
          />
        </div>

        <div class="flex gap-12 items-center">
          <IconCards class="w-18 h-18" />
          <div class="flex gap-8 flex-1">
            <Card :count="player.deck?.length">Колода</Card>
            <Card :count="player.hand?.length">Рука</Card>
            <Card :count="player.discard?.length" :active="true">Сброс</Card>
          </div>
        </div>
      </section>
    </div>

    <Console />
  </aside>
</template>
<script setup>
import IconCards from '~/svg/cards.svg';
import Player from '~/components/molecules/sidebar/Player.vue';
import Fighter from '~/components/molecules/sidebar/Fighter.vue';
import Card from '~/components/molecules/sidebar/Card.vue';
import Console from '~/components/molecules/sidebar/Console.vue';
import { useGameStore } from '~/store/game.js';

const { map, players, turn, activePlayerIndex, phase } = storeToRefs(useGameStore());

const emit = defineEmits(['showStats', 'openDiscard', 'zoomEffect']);
</script>
