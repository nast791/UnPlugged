export const useGlobalDrag = () => {
  // Данные храним в useState - это безопасно для Nuxt
  const dragItem = useState('global-drag-item', () => null);
  const mousePos = useState('global-drag-mouse', () => ({ x: 0, y: 0 }));
  
  // Колбэк — это временная ссылка, только для клиента
  const onDropCallback = ref(null);

  const startDrag = (item, onDrop) => {
    if (!import.meta.client) return;

    dragItem.value = item;
    onDropCallback.value = onDrop;

    const handleMouseMove = (e) => {
      mousePos.value = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e) => {
      window.removeEventListener('mousemove', handleMouseMove);
      
      if (onDropCallback.value) {
        onDropCallback.value(e, dragItem.value);
      }

      // Полная очистка
      onDropCallback.value = null;
      
      dragItem.value = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    // Использование { capture: true } гарантирует, что мы поймаем событие первыми
    window.addEventListener('mouseup', handleMouseUp, { capture: true, once: true });
  };

  return { dragItem, mousePos, startDrag };
};