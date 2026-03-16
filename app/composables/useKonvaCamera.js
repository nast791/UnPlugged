export default function (stageRef, currentScale) {
  
  const zoomToPoint = (e) => {
    const stage = stageRef.value?.getStage();
    if (!stage) return;
    
    const pointer = stage.getPointerPosition();
    const oldScale = stage.scaleX();
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - (pointer.x - stage.x()) * (newScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (newScale / oldScale),
    });
    
    currentScale.value = newScale;
  };

  const centerOnImage = (img) => {
    const stage = stageRef.value?.getStage();
    if (!stage || !img) return;

    const scale = Math.min(stage.width() / img.width, stage.height() / img.height);
    stage.scale({ x: scale, y: scale });
    stage.position({
      x: (window.innerWidth - img.width * scale) / 2,
      y: (window.innerHeight - img.height * scale) / 2,
    });
    currentScale.value = scale;
    stage.batchDraw();
  };

  return { zoomToPoint, centerOnImage };
};