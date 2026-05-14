export const useGlobalDrag = () => {
  const dragItem = useState('global-drag-item', () => null);
  const mousePos = useState('global-drag-mouse', () => ({ x: 0, y: 0 }));
  
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

      onDropCallback.value = null;
      dragItem.value = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { capture: true, once: true });
  };

  return { dragItem, mousePos, startDrag };
};