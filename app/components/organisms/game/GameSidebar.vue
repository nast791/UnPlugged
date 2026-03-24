<template>
  <aside
    class="h-full bg-black-90/70 text-slate-200 flex flex-col border-l border-white/10 shadow-2xl overflow-hidden"
  >
    <TurnTracker />

    <div class="flex-1 overflow-y-auto p-16 space-y-24">
      <section
        v-for="player in players"
        :key="player.id"
        class="relative flex flex-col gap-12 transition-all"
        :class="[player.isTurn ? 'opacity-100 scale-100' : 'opacity-70 scale-[0.98]']"
      >
        <Player :item="player" />

        <!-- Герои  -->
        <div>
          <Fighter
            v-for="unit in player.fighters?.filter(i => i.type === 'hero')"
            :item="unit"
            :player="player"
            :group="player.fighters?.filter(i => i.type === 'hero')"
          />
        </div>

        <!-- Помощники -->
        <div v-if="player.fighters?.filter(i => i.type === 'assistant')?.length > 0">
          <Fighter
            v-for="unit in player.fighters?.filter(i => i.type === 'assistant')"
            :group="player.fighters?.filter(i => i.type === 'assistant')"
            :item="unit"
            :player="player"
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
  </aside>
</template>
<script setup>
import IconCards from '~/svg/cards.svg';
import TurnTracker from '~/components/molecules/game-sidebar/TurnTracker.vue';
import Player from '~/components/molecules/game-sidebar/Player.vue';
import Fighter from '~/components/molecules/game-sidebar/Fighter.vue';
import Card from '~/components/molecules/game-sidebar/Card.vue';
import { useGameStore } from '~/store/game.js';

const { map, players } = storeToRefs(useGameStore());

const emit = defineEmits(['showStats', 'openDiscard', 'zoomEffect']);
</script>
