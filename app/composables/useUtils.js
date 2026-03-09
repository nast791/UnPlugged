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

  return {
    toggleStopScrolling,
    cloneDeep,
    shuffle
  };
}
