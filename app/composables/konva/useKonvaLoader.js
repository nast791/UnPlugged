export default function () {
  const loadAsset = (url) => {
    if (import.meta.server || !url) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        const msg = `Ошибка загрузки ассета: по адресу ${url}`;
        console.error(msg);
        reject(new Error(msg));
      };
    });
  };

  return { loadAsset };
}
