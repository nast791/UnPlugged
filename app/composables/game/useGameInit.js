import { useGameStore } from '~/store/game.js';
import { PLAYER_TYPES } from '#shared/constants/playerTypes';
import { runEvent } from '#shared/utils/rules/events.js';
import useUtils from '~/composables/useUtils';
import { getMap, getHeroes } from '~/composables/api/plugins';

export const useGameInit = () => {
  const nuxtConfig = useRuntimeConfig();
  const { shuffle } = useUtils();
  const isEnabled = ref(false); 
  const mapQuery = getMap(isEnabled);
  const heroesQuery = getHeroes(isEnabled);

  const runGameInit = async () => {
    isEnabled.value = true;
    await Promise.all([mapQuery.suspense(), heroesQuery.suspense()]);

    const newGameId = crypto.randomUUID();

    const playerCount = heroesQuery?.data.value?.length ?? 0;

    const players = heroesQuery?.data.value?.map((player, index) => {
      const fullDeck = player.cards.flatMap(card =>
        Array.from({ length: card.quantity || 1 }, (_, i) => ({
          ...card,
          instanceId: `${card.id}_${i}`,
          isReversed: false,
        })),
      );
      const shuffledCards = shuffle(fullDeck);

      const fighters = [
        ...(player.heroes?.map(h => ({
          ...h,
          type: 'hero',
          currentHp: h.hp,
          image: `${nuxtConfig.public.pack}${player.folder}${h.image}`,
        })) || []),
        ...(player.assistants?.flatMap(a =>
          Array.from({ length: a.count || 1 }, (_, i) => ({
            ...a,
            id: a.count ? `${a.id}_${i + 1}` : a.id,
            type: 'assistant',
            currentHp: a.hp,
            image: `${nuxtConfig.public.pack}${player.folder}${a.image}`,
            group: a.count ? a.id : null,
          })),
        ) || []),
      ].map(f => ({
        ...f,
        rangeType: f.rangeType ?? f.attackType ?? 'melee',
        active: false,
        bonusMovement: 0,
        canPassThroughEnemies: false,
        position: null,
        startPosition: null,
      }));

      const items = [
        ...(player.items?.flatMap(i => {
          return Array.from({ length: i.count || 1 }, (_, index) => ({
            ...i,
            id: i.count ? `${i.id}_${index + 1}` : i.id,
            group: i.count ? i.id : null,
          }));
        }) || []),
      ];

      const isHuman = player.type === PLAYER_TYPES.HUMAN.id;

      return {
        ...player,
        packId: player.id,
        id: String(index),
        index: index + 1,
        items,
        fighters,
        hand: shuffledCards.splice(-5),
        deck: shuffledCards,
        discard: [],
        visibility: {
          deck: false,
          hand: false,
          discard: false,
        },
        actionsPoints: 0,
        actionsUsed: 0,
        minHandSize: 0,
        maxHandSize: 7,
      };
    });

    runEvent({ players }, { currentPlayer: '0' }, 'ASSIGN_TEAMS', {
      params: { playerCount },
      raw: true,
    });

    const radius = mapQuery?.data.value?.settings?.nodeSize / 2;
    const circles = (mapQuery?.data.value?.nodes || []).map(node => ({
      ...node,
      x: node.x + radius,
      y: node.y + radius,
    }));

    const connections = [];
    circles.forEach(node => {
      node.neighbors?.forEach(neighborId => {
        if (Number(neighborId) > Number(node.id)) {
          const target = circles.find(i => Number(i.id) === Number(neighborId));
          if (target) {
            connections.push({
              id: `l-${node.id}-${neighborId}`,
              points: [node.x, node.y, target.x, target.y],
            });
          }
        }
      });
    });

    const setupData = {
      id: newGameId,
      players,
      map: {
        ...mapQuery?.data.value,
        radius,
        circles,
        connections,
      },
    };

    const store = useGameStore();
    store.activeSetupData = setupData; 

    await navigateTo(`/game/${newGameId}`);
  };

  return { runGameInit };
};
