export const useGlobalDrag = () => {
  const dragItem = useState('global-drag-item', () => null);
  const mousePos = useState('global-drag-mouse', () => ({ x: 0, y: 0 }));

  const onDropCallback = ref(null);
  let detachListeners = null;

  const cleanupDrag = () => {
    detachListeners?.();
    detachListeners = null;
    onDropCallback.value = null;
    dragItem.value = null;
  };

  onScopeDispose(cleanupDrag);

  const startDrag = (item, onDrop) => {
    if (!import.meta.client) return;

    cleanupDrag();

    dragItem.value = item;
    onDropCallback.value = onDrop;

    const handleMouseMove = e => {
      mousePos.value = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = e => {
      const item = dragItem.value;
      const drop = onDropCallback.value;
      cleanupDrag();
      drop?.(e, item);
    };

    detachListeners = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { capture: true, once: true });
  };

  return { dragItem, mousePos, startDrag };
};
