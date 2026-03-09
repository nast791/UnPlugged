import useApi from '~/composables/api/_client';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/nast791/Unmatched-pack@master/';

export const usePlugins = () => {
  const query = useQuery({
    queryKey: ['plugins-registry'],
    queryFn: () =>
      useApi()(`${CDN_BASE}index.json`).then(data =>
        typeof data === 'string' ? JSON.parse(data) : data,
      ),
  });

  const heroes = computed(() => {
    if (!query.data.value?.heroes) return [];

    return query.data.value.heroes.map(hero => ({
      ...hero,
      avatar: `${CDN_BASE}${hero.folder}avatar.webp`,
    }));
  });

  const maps = computed(() => {
    if (!query.data.value?.maps) return [];

    return query.data.value.maps.map(map => ({
      ...map,
      image: `${CDN_BASE}${map.folder}${map.image || 'background.webp'}`,
    }));
  });

  return {
    ...query,
    heroes,
    maps,
    CDN_BASE,
  };
};

export const startBattle = () => {
  return useMutation({
    mutationKey: ['start-battle'],
    mutationFn: async ({ playerId, aiId, mapId, heroes = [], maps = [] }) => {
      const pReg = heroes.value.find(h => h.id === playerId);
      const aiReg = heroes.value.find(h => h.id === aiId);
      const mReg = maps.value.find(m => m.id === mapId);

      if (!pReg || !aiReg || !mReg) {
        throw new Error('Не удалось найти данные игрока или карты в реестре');
      }

      const [pConfig, aiConfig, mConfig] = await Promise.all([
        useApi()(`${CDN_BASE}${pReg.folder}index.json`),
        useApi()(`${CDN_BASE}${aiReg.folder}index.json`),
        useApi()(`${CDN_BASE}${mReg.folder}index.json`),
      ]);

      const [pCards, aiCards] = await Promise.all([
        useApi()(`${CDN_BASE}${pReg.folder}${pConfig.deckFile}`),
        useApi()(`${CDN_BASE}${aiReg.folder}${aiConfig.deckFile}`),
      ]);

      return {
        player: {
          config: pConfig,
          cards: pCards,
          folder: pReg.folder,
        },
        ai: {
          config: aiConfig,
          cards: aiCards,
          folder: aiReg.folder,
        },
        map: {
          ...mConfig,
          folder: mReg.folder,
        },
      };
    },
  });
};
