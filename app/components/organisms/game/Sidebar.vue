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
            String(player.id) === String(activePlayerIndex)
              ? 'opacity-100 scale-100'
              : 'opacity-70 scale-[0.98]',
          ]"
        >
          <Player
            :item="player"
            :selectable="isOpponentSelectable(player.id)"
            :highlight="isSelectingOpponent && isOpponentSelectable(player.id)"
          />

          <!-- Герои  -->
          <div class="flex flex-col gap-6">
            <Fighter
              v-for="unit in player.fighters"
              :key="`${player.id}-${unit.id}`"
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
                :count="getZoneCount(player, item.id)"
                :active="isZoneVisible(player.id, item.id)"
                @click="clickCardHandler(player.id, item)"
                :style="isWindowActive(player.id, item.id) && { borderColor: player.color }"
                v-for="item in decks"
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
import Window from '~/components/atoms/Window.vue';
import { DECK_LABELS } from '#shared/constants/decks';
import { useBoardgame } from '~/composables/game/useBoardgame';
import { useCardPlayPhase } from '~/composables/game/useCardPlayPhase';
import { useCardPlayPresentation } from '~/composables/game/useCardPlayPresentation';

const emit = defineEmits(['showStats', 'openDiscard', 'zoomEffect']);
const { client, G, ctx } = useBoardgame();
const { isSelectingMainCard, isSelectingOpponent, isOpponentSelectable } = useCardPlayPhase();
const { hasPlayedCard } = useCardPlayPresentation();

const decks = DECK_LABELS;
const players = computed(() => G.value?.players || []);
const activePlayerIndex = computed(() => ctx.value?.currentPlayer);

const getZoneCount = (player, zone) =>
  player?.zoneCounts?.[zone] ??
  G.value?.cardZoneCounts?.[String(player.id)]?.[zone] ??
  0;

const isZoneVisible = (playerId, zone) => {
  const zones =
    G.value?.cardZoneUI?.[String(playerId)] ??
    players.value.find(p => String(p.id) === String(playerId))?.visibility;
  if (!zones?.[zone]) return false;
  const player = players.value.find(p => String(p.id) === String(playerId));
  return getZoneCount(player, zone) > 0;
};

const activeWindows = ref([]);

const isMyTurn = computed(() => {
  if (!ctx.value || !client.value) return false;
  return String(ctx.value.currentPlayer) === String(client.value.playerID);
});

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

const openWindow = (playerId, type, typeName) => {
  if (isWindowActive(playerId, type)) {
    bringToFront(playerId, type);
    return;
  }

  activeWindows.value.push({
    id: playerId,
    type,
    typeName,
    zIndex: getMaxZIndex() + 1,
  });
};

const clickCardHandler = (id, item) => {
  if (!isZoneVisible(id, item.id)) return;

  const isAlreadyOpen = activeWindows.value.find(i => i.id === id && i.type === item.id);

  if (isAlreadyOpen) {
    closeWindow(id, item.id);
    return;
  }

  openWindow(id, item.id, item.name);
};

const closeWindow = (playerId, type) => {
  activeWindows.value = activeWindows.value.filter(i => !(i.id === playerId && i.type === type));
};

watch(
  () => hasPlayedCard.value,
  active => {
    if (!active || !isMyTurn.value) return;
    const playerId = ctx.value?.currentPlayer;
    if (playerId != null) closeWindow(playerId, 'hand');
  },
);

watch(
  () => isSelectingMainCard.value,
  (selecting, wasSelecting) => {
    if (!isMyTurn.value) return;

    const playerId = ctx.value?.currentPlayer;
    if (selecting && playerId != null) {
      openWindow(playerId, 'hand', 'Рука');
      return;
    }

    if (wasSelecting && playerId != null) {
      closeWindow(playerId, 'hand');
    }
  },
);

watch(
  () => G.value?.zoneVisibilityGrants?.map(g => g.id).join(','),
  () => {
    if (!isMyTurn.value) return;
    const viewerId = String(ctx.value?.currentPlayer ?? '');
    for (const grant of G.value?.zoneVisibilityGrants ?? []) {
      if (String(grant.viewerId) !== viewerId) continue;
      if (grant.zone !== 'hand') continue;
      if (!isZoneVisible(grant.ownerId, 'hand')) continue;
      openWindow(grant.ownerId, 'hand', 'Рука');
    }
  },
);
</script>
