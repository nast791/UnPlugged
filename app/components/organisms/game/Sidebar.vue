<template>
  <aside
    class="h-full bg-black-90/70 text-slate-200 flex flex-col border-l border-white/10 shadow-2xl overflow-hidden"
  >
    <ScrollArea class="flex-1 p-16">
      <div class="flex flex-col gap-24">
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

          <div class="flex gap-12 items-center" v-if="player?.items?.length">
            <IconBag class="size-18" />
            <div class="flex gap-8 flex-1">
              <Resources :items="player.items" />
            </div>
          </div>

          <div class="flex gap-12 items-center">
            <IconCards class="size-18" />
            <div class="flex gap-8 flex-1">
              <Card
                :count="player[item.id]?.length"
                :active="
                  item.id === 'discard' ||
                  !!activePlayer.activeCardBtns.find(i => i.id === player.id && i.type === item.id)
                "
                @click="clickCardHandler(player.id, item)"
                :style="isWindowActive(player.id, item.id) && { borderColor: player.color }"
                v-for="item in cardsTypes"
                :key="item.id"
              >
                {{ item.name }}
              </Card>
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>

    <Console />

    <Window
      v-for="i in activeWindows"
      :isOpen="true"
      @close="closeWindow(i.id, i.type)"
      @focus="bringToFront(i.id, i.type)"
      :z-index="i.zIndex"
      :title="`${players.find(p => p.id === i.id)?.name}: ${i.typeName}`"
      :color="players.find(p => p.id === i.id)?.color"
    >
      <div class="py-16">{{ players.find(p => p.id === i.id)?.[i.type] || '' }}</div>
    </Window>
  </aside>
</template>
<script setup>
import IconCards from '~/svg/cards.svg';
import IconBag from '~/svg/box.svg';
import ScrollArea from '~/components/atoms/ScrollArea.vue';
import Player from '~/components/molecules/sidebar/Player.vue';
import Fighter from '~/components/molecules/sidebar/Fighter.vue';
import Resources from '~/components/molecules/sidebar/Resources.vue';
import Card from '~/components/molecules/sidebar/Card.vue';
import Console from '~/components/molecules/sidebar/Console.vue';
import { useGameStore } from '~/store/game.js';
import Window from '~/components/atoms/Window.vue';
import cardsTypes from '#shared/constants/cards';

const { map, players, turn, activePlayerIndex, activePlayer } = storeToRefs(useGameStore());

const emit = defineEmits(['showStats', 'openDiscard', 'zoomEffect']);

const activeWindows = ref([]);

const isWindowActive = (id, type) => {
  return activeWindows.value.some(i => i.id === id && i.type === type);
};

const bringToFront = (id, type) => {
  const win = activeWindows.value.find(i => i.id === id && i.type === type);
  if (win) win.zIndex = getMaxZIndex() + 1;
};

const getMaxZIndex = () => {
  return activeWindows.value.length > 0 ? Math.max(...activeWindows.value.map(i => i.zIndex)) : 100;
};

const clickCardHandler = (id, type) => {
  const isAlreadyOpen = activeWindows.value.find(i => i.id === id && i.type === type.id);

  if (isAlreadyOpen) {
    bringToFront(id, type.id);
    return;
  }

  activeWindows.value.push({
    id: id,
    type: type.id,
    typeName: type.name,
    zIndex: getMaxZIndex() + 1,
  });
};

const closeWindow = (playerId, type) => {
  activeWindows.value = activeWindows.value.filter(i => !(i.id === playerId && i.type === type));
};
</script>
