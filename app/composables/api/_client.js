export default function useApi(baseurl) {
  // const baseURL = baseurl || `/api`;
  const baseURL = baseurl || ``;

  return $fetch.create({
    baseURL,
    async onRequest({ options }) {
      const headers = useRequestHeaders(['cookie']);
      options.headers = { ...headers, ...options.headers };
    },
    onRequestError: async ({ error }) => {
      console.error(error);
    },
    onResponseError: async ({ response, options, request }) => {
      if (response.status === 401) {
        navigateTo('/');
      } else {
        errorHandler(response.status || 408, response._data?.message);
      }
    },
  });
}

const errorHandler = (code, message) => {
  const isFatal = code >= 500;

  throw createError({
    statusCode: code,
    message: message || `Ошибка запроса: ${code}`,
    fatal: isFatal,
  });
};
