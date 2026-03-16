import useApi from '~/composables/api/_client';

export const usePlugins = () => {
  const config = useRuntimeConfig(); 

  const query = useQuery({
    queryKey: ['plugins-registry'],
    queryFn: () =>
      useApi()(`${config.public.pack}index.json?v=1`).then(data =>
        typeof data === 'string' ? JSON.parse(data) : data,
      ),
  });

  const heroes = computed(() => {
    if (!query.data.value?.heroes) return [];

    return query.data.value.heroes.map(hero => ({
      ...hero,
      avatar: `${config.public.pack}${hero.folder}${hero.image || 'avatar.webp'}`,
    }));
  });

  const maps = computed(() => {
    if (!query.data.value?.maps) return [];

    return query.data.value.maps.map(map => ({
      ...map,
      image: `${config.public.pack}${map.folder}${map.image || 'background.webp'}`,
    }));
  });

  return {
    ...query,
    heroes,
    maps
  };
};

export const startBattle = () => {
  const config = useRuntimeConfig(); 

  return useMutation({
    mutationKey: ['start-battle'],
    mutationFn: async ({ playerId, aiId, mapId, heroes = [], maps = [] }) => {
      const player = heroes.value.find(i => i.id === playerId);
      const ai = heroes.value.find(i => i.id === aiId);
      const map = maps.value.find(i => i.id === mapId);

      if (!player || !ai || !map) {
        throw new Error('Не удалось найти данные игрока или карты в реестре');
      }

      const [playerConfig, aiConfig, mapConfig] = await Promise.all([
        useApi()(`${config.public.pack}${player.folder}index.json?v=1`),
        useApi()(`${config.public.pack}${ai.folder}index.json?v=1`),
        useApi()(`${config.public.pack}${map.folder}index.json?v=1`),
      ]);

      const [playerCards, aiCards] = await Promise.all([
        useApi()(`${config.public.pack}${player.folder}${playerConfig.deckFile}`),
        useApi()(`${config.public.pack}${ai.folder}${aiConfig.deckFile}`),
      ]);

      return {
        player: {
          config: playerConfig,
          cards: playerCards,
          info: player,
        },
        ai: {
          config: aiConfig,
          cards: aiCards,
          info: ai,
        },
        map: {
          config: mapConfig,
          info: map,
        },
      };
    },
  });
};
