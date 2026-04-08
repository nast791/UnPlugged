export const useGlossary = () => {
  return useQuery({
    queryKey: ['glossary'],
    queryFn: async () => {
      const data = await queryCollection('content').path('/glossary').first();
      return data;
    },
  });
}