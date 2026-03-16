import { useAppStore } from '~/store/app.js';
import { storeToRefs } from 'pinia';

export default function () {
  const { stopScrollingPage } = storeToRefs(useAppStore());

  const toggleStopScrolling = stop => {
    stopScrollingPage.value = stop;
  };

  const cloneDeep = obj => {
    if (!obj) return {};
    const rawObject = toRaw(obj);
    return structuredClone(rawObject);
  };

  const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getNodePosition = (nodeId, nodes) => {
    const node = nodes.find(i => i.id === nodeId || i.id === Number(nodeId));
    if (node) {
      return { x: node.x, y: node.y };
    }
    return { x: 0, y: 0 };
  };

  return {
    toggleStopScrolling,
    cloneDeep,
    shuffle,
    getNodePosition
  };
}
