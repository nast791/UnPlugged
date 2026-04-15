import {useUnitPlacement} from '~/composables/phases/useUnitPlacement';

const dropHandler = ref(null);

export const useKonvaPlacement = () => {
  const { placeUnit } = useUnitPlacement();

  // Регистрация карты (вызывает Карта при mounted)
  const registerMap = (stageRef, nodes, nodeSize) => {
    if (!import.meta.client) return;

    dropHandler.value = (e, dragItem) => {
      if (!dragItem || !stageRef.value) return;

      const stage = stageRef.value.getStage();
      const rect = stage.container().getBoundingClientRect();
      
      const transform = stage.getAbsoluteTransform().copy().invert();
      const pointerPos = transform.point({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });

      const closestNode = nodes.value.find(node => {
        const dist = Math.sqrt(Math.pow(node.x - pointerPos.x, 2) + Math.pow(node.y - pointerPos.y, 2));
        // Используем 1.5 радиуса для "липкости"
        return dist < (nodeSize.value * 0.75); 
      });

      if (closestNode) {
        placeUnit(dragItem.id, closestNode.id);
      }
    };

    // Очистка при размонтировании карты, чтобы не было утечек памяти
    onUnmounted(() => {
      dropHandler.value = null;
    });
  };

  const executeDrop = (e, dragItem) => {
    if (dropHandler.value) {
      dropHandler.value(e, dragItem);
    }
  };

  return { registerMap, executeDrop };
};