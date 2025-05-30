const { ipcRenderer } = require('electron');

export const api = {
  // Commands
  getCommands: () => ipcRenderer.invoke('get-commands'),
  saveCommand: (command) => ipcRenderer.invoke('save-command', command),
  deleteCommand: (commandId) => ipcRenderer.invoke('delete-command', commandId),
  addDefaultCommands: () => ipcRenderer.invoke('add-default-commands'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Phonetics
  getPhonetics: () => ipcRenderer.invoke('get-phonetics'),
  savePhonetics: (phonetics) => ipcRenderer.invoke('save-phonetics', phonetics),
  
  // Voice
  startListening: () => ipcRenderer.invoke('start-listening'),
  stopListening: () => ipcRenderer.invoke('stop-listening'),
  
  // File dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Events
  onWakeWordDetected: (callback) => {
    ipcRenderer.on('wake-word-detected', callback);
    return () => ipcRenderer.removeListener('wake-word-detected', callback);
  },
  
  onCommandRecognized: (callback) => {
    ipcRenderer.on('command-recognized', callback);
    return () => ipcRenderer.removeListener('command-recognized', callback);
  },
  
  onStatusUpdate: (callback) => {
    ipcRenderer.on('status-update', callback);
    return () => ipcRenderer.removeListener('status-update', callback);
  },
  
  onError: (callback) => {
    ipcRenderer.on('error', callback);
    return () => ipcRenderer.removeListener('error', callback);
  }
};
