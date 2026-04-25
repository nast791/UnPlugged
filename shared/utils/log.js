export const addLog = (G, msg, type = 'info') => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  G.log.push({ msg, type, time });
};