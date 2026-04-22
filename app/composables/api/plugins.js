import useApi from '~/composables/api/_client';
import { useQueries } from '@tanstack/vue-query';
import { useGameStore } from '~/store/game.js';
import useUtils from '~/composables/useUtils';

export const usePlugins = () => {
  const config = useRuntimeConfig();

  const query = useQuery({
    queryKey: ['plugins-registry'],
    queryFn: () =>
      useApi()(`${config.public.pack}index.json?v=3`).then(data =>
        typeof data === 'string' ? JSON.parse(data) : data,
      ),
  });

  const heroes = computed(() => {
    if (!query.data.value?.heroes) return [];

    return query.data.value.heroes.map(hero => ({
      ...hero,
      image: `${config.public.pack}${hero.folder}${hero.image || 'avatar.webp'}`,
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
    maps,
  };
};

export const getMap = (isEnabled) => {
  const config = useRuntimeConfig();
  const { selectedMap } = storeToRefs(useGameStore());

  return useQuery({
    queryKey: ['get-map', unref(selectedMap)?.id],
    queryFn: async () => {
      const data = await useApi()(
        `${config.public.pack}${selectedMap.value?.folder}index.json?v=2`,
      );
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return { ...parsed, ...selectedMap.value };
    },
    enabled: isEnabled,
  });
};

export const getHeroes = (isEnabled) => {
  const config = useRuntimeConfig();
  const { selectedPlayers } = storeToRefs(useGameStore());

  return useQuery({
    queryKey: ['get-all-heroes', selectedPlayers.value.map(p => p.id)],
    queryFn: async () => {
      const promises = selectedPlayers.value.map(async hero => {
        const baseUrl = `${config.public.pack}${hero.folder}`;
        const [heroData, deckData] = await Promise.all([
          useApi()(`${baseUrl}${hero.main}?v=2`),
          useApi()(`${baseUrl}${hero.deck}?v=2`),
        ]);
        return {
          ...(typeof heroData === 'string' ? JSON.parse(heroData) : heroData),
          cards: typeof deckData === 'string' ? JSON.parse(deckData) : deckData,
          ...hero,
        };
      });
      return Promise.all(promises);
    },
    enabled: isEnabled,
  });
};
