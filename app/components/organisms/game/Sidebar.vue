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
                :count="player[key]?.length"
                :active="
                  (key === 'discard' && player[key]?.length > 0) ||
                  (!!activePlayer.activeCardBtns.find(i => i.id === player.id && i.type === key) &&
                    player[key]?.length > 0 && player[key]?.type !== 'ai')
                "
                @click="clickCardHandler(player.id, key, item)"
                :style="isWindowActive(player.id, key) && { borderColor: player.color }"
                v-for="(item, key) in decks"
                :key="key"
              >
                {{ item }}
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
      <div class="p-16 min-w-max">
        <ContextMenu>
          <div class="flex gap-8">
            <PlayerCard
              v-for="item in players.find(p => p.id === i.id)?.[i.type]"
              :key="item.id"
              :item="item"
              :player="players.find(p => p.id === i.id)"
            />
          </div>
        </ContextMenu>
      </div>
    </Window>
  </aside>
</template>
<script setup>
import IconCards from '~/svg/cards.svg';
import IconBag from '~/svg/box.svg';
import ScrollArea from '~/components/atoms/ScrollArea.vue';
import ContextMenu from '~/components/atoms/ContextMenu.vue';
import PlayerCard from '~/components/molecules/game/Card.vue';
import Player from '~/components/molecules/sidebar/Player.vue';
import Fighter from '~/components/molecules/sidebar/Fighter.vue';
import Resources from '~/components/molecules/sidebar/Resources.vue';
import Card from '~/components/molecules/sidebar/Card.vue';
import Console from '~/components/molecules/sidebar/Console.vue';
import { useGameStore } from '~/store/game.js';
import Window from '~/components/atoms/Window.vue';
import { useAppStore } from '~/store/app.js';

const { map, players, turn, activePlayerIndex, activePlayer } = storeToRefs(useGameStore());

const emit = defineEmits(['showStats', 'openDiscard', 'zoomEffect']);

const { glossary } = storeToRefs(useAppStore());

const decks = computed(() => glossary?.value?.meta?.decks || {});

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

const clickCardHandler = (id, key, type) => {
  const isAlreadyOpen = activeWindows.value.find(i => i.id === id && i.type === key);

  if (isAlreadyOpen) {
    closeWindow(id, key);
    return;
  }

  activeWindows.value.push({
    id: id,
    type: key,
    typeName: type,
    zIndex: getMaxZIndex() + 1,
  });
};

const closeWindow = (playerId, type) => {
  activeWindows.value = activeWindows.value.filter(i => !(i.id === playerId && i.type === type));
};
</script>
