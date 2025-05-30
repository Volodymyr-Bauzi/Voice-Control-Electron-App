const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // Command Manager
  isCommandManagerReady: () => ipcRenderer.invoke('command-manager-ready'),
  onCommandManagerReady: (callback) => ipcRenderer.on('command-manager-ready', (_, ready) => callback(ready)),
  off: (event, callback) => ipcRenderer.removeListener(event, callback),
  
  // Voice apps folder
  selectVoiceAppsFolder: () => ipcRenderer.invoke('select-voice-apps-folder'),
  
  // Commands
  getCommands: () => ipcRenderer.invoke('get-commands'),
  addCommand: (command) => ipcRenderer.invoke('add-command', command),
  removeCommand: (commandId) => ipcRenderer.invoke('remove-command', commandId),
  
  // Phonetics
  addPhoneticMapping: (mapping) => ipcRenderer.invoke('add-phonetic-mapping', mapping),
  
  // Event listeners
  onVoiceComponentsReady: (callback) => 
    ipcRenderer.on('voice-components-ready', (_, status) => callback(status)),
  
  onWakeWordDetected: (callback) => 
    ipcRenderer.on('wake-word-detected', () => callback()),
  
  onListeningStatusChanged: (callback) => 
    ipcRenderer.on('listening-status-changed', (_, status) => callback(status)),
  
  onTranscriptionResult: (callback) => 
    ipcRenderer.on('transcription-result', (_, text) => callback(text)),
  
  onRecognitionError: (callback) => 
    ipcRenderer.on('recognition-error', (_, error) => callback(error)),
  
  onCommandExecuted: (callback) => 
    ipcRenderer.on('command-executed', (_, data) => callback(data)),
  
  // Remove event listeners (to prevent memory leaks)
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('voice-components-ready');
    ipcRenderer.removeAllListeners('wake-word-detected');
    ipcRenderer.removeAllListeners('listening-status-changed');
    ipcRenderer.removeAllListeners('transcription-result');
    ipcRenderer.removeAllListeners('recognition-error');
    ipcRenderer.removeAllListeners('command-executed');
  }
});
