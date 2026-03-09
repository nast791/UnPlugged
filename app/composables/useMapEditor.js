export const useMapEditor = (mapRef) => {
  const isDevMode = ref(true);
  const selectedNodeId = ref(null); 

  const toggleNeighbor = (id1, id2) => {
    if (!mapRef.value || id1 === id2) return;
    
    const node1 = mapRef.value.nodes.find(n => n.id === id1);
    const node2 = mapRef.value.nodes.find(n => n.id === id2);

    if (node1 && node2) {
      if (node1.neighbors.includes(id2)) {
        node1.neighbors = node1.neighbors.filter(nId => nId !== id2);
        node2.neighbors = node2.neighbors.filter(nId => nId !== id1);
      } else {
        node1.neighbors.push(id2);
        node2.neighbors.push(id1);
      }
    }
  };

  const addNode = (x, y) => {
    if (!mapRef.value) return;

    const nodes = mapRef.value.nodes;
    const newId = nodes.length > 0 
      ? Math.max(...nodes.map(n => n.id)) + 1 
      : 1;

    nodes.push({
      id: newId,
      x: Math.round(x),
      y: Math.round(y),
      zones: ["#ccc"], 
      neighbors: []
    });
  };

  const deleteNode = (id) => {
    if (!mapRef.value) return;
    mapRef.value.nodes = mapRef.value.nodes.filter(n => n.id !== id);
    mapRef.value.nodes.forEach(n => {
      n.neighbors = n.neighbors.filter(neighborId => neighborId !== id);
    });
  };

  const handleEditorNodeClick = (nodeId, isShiftPressed) => {
    if (isShiftPressed) {
      if (selectedNodeId.value && selectedNodeId.value !== nodeId) {
        toggleNeighbor(selectedNodeId.value, nodeId);
        selectedNodeId.value = null;
      } else {
        selectedNodeId.value = nodeId;
      }
    }
  };

  const getColorAtPointer = (stage) => {
    const bgNode = stage.findOne('.map-bg');
    if (!bgNode) return '#ccc';
    const pos = stage.getPointerPosition();
    const rgba = bgNode.getLayer().getContext().getImageData(pos.x, pos.y, 1, 1).data;
    const rgbToHex = (r, g, b) => 
      "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    
    return rgbToHex(rgba[0], rgba[1], rgba[2]);
  };

  const addNodeWithColor = (x, y, stage) => {
    const color = getColorAtPointer(stage);
    
    mapRef.value.nodes.push({
      id: mapRef.value.nodes.length + 1,
      x: Math.round(x),
      y: Math.round(y),
      zones: [color], 
      neighbors: []
    });
  };

  const exportMap = () => {
    if (!mapRef.value) return;
    const data = JSON.stringify(mapRef.value.nodes, null, 2);
    console.log("=== КАРТА ЭКСПОРТИРОВАНА ===");
    console.log(data);
    navigator.clipboard.writeText(data);
    alert("JSON скопирован в буфер обмена!");
  };

  return { 
    isDevMode, 
    addNode, 
    deleteNode, 
    exportMap,
    selectedNodeId, 
    handleEditorNodeClick,
    addNodeWithColor
  };
};