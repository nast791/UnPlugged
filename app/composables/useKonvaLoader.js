export default function () {
  const images = ref({});

  const loadAsset = (id, url) => {
    if (process.server || !url) return;
    if (images.value[id]) return;

    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      images.value[id] = img;
    };
    img.onerror = () => {
      console.error(`Ошибка загрузки ассета: ${id} по адресу ${url}`);
    };
  };

  return { images, loadAsset };
}
