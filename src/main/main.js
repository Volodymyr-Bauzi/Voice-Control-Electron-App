const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { spawn } = require('child_process');
const { setupWakeWordDetection } = require('./wakeword');
const { setupVoiceRecognition } = require('./voiceRecognition');
const { CommandManager } = require('./commandManager');
const { InputSimulator } = require('./inputSimulator');

// Initialize store for app settings
const store = new Store({
  name: 'settings',
  defaults: {
    wakeWord: 'bumblebee',  // Using custom wake word 'hey flexi' (lowercase for consistency)
    voiceAppsFolder: null,
    sensitivity: 0.5,  // Lower sensitivity for better detection
    engineType: 'vosk', // 'vosk', 'whisper'
    showNotifications: true,
    startMinimized: false,
    startAtLogin: true,
    customPhonetics: {}
  }
});

// Clear any cached settings and reset to defaults
store.clear();
console.log('Store cleared and reset to defaults');

// Global references
let mainWindow;
let tray;
let inputSimulator;
let wakeWordDetector;
let voiceRecognizer;
let isListening = false;

let isCommandManagerReady = false;
let commandManager = null

// Initialize command manager
async function initializeCommandManager() {
  return new Promise((resolve, reject) => {
    console.log('Main: Initializing command manager...');
    try {
      commandManager = new CommandManager(store);
      
      commandManager.on('ready', () => {
        console.log('Main: Command manager is ready');
        isCommandManagerReady = true;
        console.log('Main: Command manager ready, resolving promise');
        resolve();
      });
      
      commandManager.on('error', (error) => {
        console.error('Main: Command manager error:', error);
        isCommandManagerReady = false;
        reject(error);
      });
      
    } catch (error) {
      console.error('Main: Failed to create command manager:', error);
      isCommandManagerReady = false;
      reject(error);
    }
  });
}

// Initialize app
async function createWindow() {
  try {
    // Wait for command manager to be ready before creating the window
    await initializeCommandManager();
    
    // Create the browser window
    const windowOptions = {
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: !store.get('startMinimized')
    };
  
    // Set the window icon
    try {
      const iconPath = path.join(__dirname, '../../assets/icon.ico');
      if (fs.existsSync(iconPath)) {
        windowOptions.icon = iconPath;
        console.log('Using custom window icon');
      } else {
        console.warn('Custom window icon not found at:', iconPath);
      }
    } catch (error) {
      console.warn('Could not set window icon:', error);
    }
  
    mainWindow = new BrowserWindow(windowOptions);

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    
    // Handle window close to minimize to tray instead
    mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        return false;
      }
      return true;
    });

    // Create tray icon
    createTray();
    
    // Notify renderer that command manager is ready
    if (isCommandManagerReady) {
      mainWindow.webContents.send('command-manager-ready', true);
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    dialog.showErrorBox('Initialization Error', 'Failed to initialize the application. Please check the logs for details.');
    app.quit();
  }

  // Initialize input simulator
  inputSimulator = new InputSimulator();
  
  // Setup voice recognition components
  setupVoiceComponents();
}

function createTray() {
  // Path to the icon file
  const iconPath = path.join(__dirname, '../../assets/icon.ico');
  
  try {
    tray = new Tray(iconPath);
    console.log('Tray created with custom icon');
  } catch (error) {
    console.error('Failed to create tray with custom icon, using no icon:', error);
    // If that fails, create tray without an icon
    tray = new Tray(process.execPath);
  }
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Voice Commander', 
      click: () => mainWindow.show() 
    },
    { 
      label: 'Start Listening',
      click: () => {
        startListening();
        mainWindow.webContents.send('listening-status-changed', true);
      }
    },
    { 
      label: 'Stop Listening',
      click: () => {
        stopListening();
        mainWindow.webContents.send('listening-status-changed', false);
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Voice Commander');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

async function setupVoiceComponents() {
  try {
    // Setup wake word detection
    wakeWordDetector = await setupWakeWordDetection({
      wakeWord: store.get('wakeWord'),
      sensitivity: store.get('sensitivity'),
      onWakeWordDetected: handleWakeWordDetected
    });
    
    // Setup voice recognition
    voiceRecognizer = await setupVoiceRecognition({
      engineType: store.get('engineType'),
      customPhonetics: store.get('customPhonetics'),
      onTranscriptionResult: handleTranscriptionResult,
      onError: handleRecognitionError
    });
    
    // Start wake word detection by default
    wakeWordDetector.start();
    
    // Notify renderer that components are ready
    mainWindow.webContents.send('voice-components-ready', true);
  } catch (error) {
    console.error('Failed to initialize voice components:', error);
    dialog.showErrorBox(
      'Initialization Error',
      `Failed to initialize voice components: ${error.message}`
    );
    mainWindow.webContents.send('voice-components-ready', false);
  }
}

function handleWakeWordDetected() {
  console.log('Wake word detected!');
  
  // Notify UI
  mainWindow.webContents.send('wake-word-detected');
  
  // Start listening for commands
  startListening();
}

function startListening() {
  if (isListening) return;
  
  isListening = true;
  wakeWordDetector.pause();
  voiceRecognizer.start();
  
  // Update UI
  mainWindow.webContents.send('listening-status-changed', true);
  
  // Auto-stop listening after 10 seconds if no command is detected
  setTimeout(() => {
    if (isListening) {
      stopListening();
    }
  }, 10000);
}

function stopListening() {
  if (!isListening) return;
  
  isListening = false;
  voiceRecognizer.stop();
  wakeWordDetector.resume();
  
  // Update UI
  mainWindow.webContents.send('listening-status-changed', false);
}

function handleTranscriptionResult(text) {
  console.log('Recognized:', text);
  
  // Send to UI for display
  mainWindow.webContents.send('transcription-result', text);
  
  // Process command
  const command = commandManager.findMatchingCommand(text);
  if (command) {
    executeCommand(command, text);
    stopListening();
  }
}

function handleRecognitionError(error) {
  console.error('Recognition error:', error);
  mainWindow.webContents.send('recognition-error', error);
  stopListening();
}

function executeCommand(command, originalText) {
  console.log(`Executing command: ${command.type} - ${command.action}`);
  
  // Send to UI
  mainWindow.webContents.send('command-executed', {
    command: command,
    originalText: originalText
  });
  
  // Execute based on command type
  switch (command.type) {
    case 'app':
      // Launch application or file
      const childProcess = spawn(command.action, [], {
        detached: true,
        stdio: 'ignore'
      });
      childProcess.unref();
      break;
      
    case 'keyboard':
      // Simulate keyboard input
      inputSimulator.simulateKeyboard(command.action);
      break;
      
    case 'system':
      // Handle system commands
      handleSystemCommand(command.action);
      break;
      
    default:
      console.log('Unknown command type:', command.type);
  }
}

function handleSystemCommand(action) {
  switch (action) {
    case 'quit':
      app.isQuitting = true;
      app.quit();
      break;
      
    case 'minimize':
      mainWindow.minimize();
      break;
      
    case 'show':
      mainWindow.show();
      break;
      
    default:
      console.log('Unknown system action:', action);
  }
}

ipcMain.handle('command-manager-ready', () => {
  console.log('Main: command-manager-ready check - Ready:', isCommandManagerReady);
  return isCommandManagerReady;
});

// IPC handlers for renderer process communication
ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('update-settings', (_, settings) => {
  store.set(settings);
  
  // Update components with new settings
  if (wakeWordDetector) {
    wakeWordDetector.updateSettings({
      wakeWord: settings.wakeWord,
      sensitivity: settings.sensitivity
    });
  }
  
  if (voiceRecognizer) {
    voiceRecognizer.updateSettings({
      engineType: settings.engineType,
      customPhonetics: settings.customPhonetics
    });
  }
  
  return true;
});

ipcMain.handle('select-voice-apps-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    store.set('voiceAppsFolder', folderPath);
    commandManager.scanVoiceAppsFolder(folderPath);
    return folderPath;
  }
  
  return null;
});

ipcMain.handle('get-commands', async () => {
  if (!isCommandManagerReady) {
    return new Promise((resolve) => {
      const checkReady = setInterval(() => {
        if (isCommandManagerReady) {
          clearInterval(checkReady);
          resolve(commandManager.getAllCommands());
        }
      }, 100);
    });
  }
  return commandManager.getAllCommands();
});

const withCommandManager = (handler) => {
  return async (...args) => {
    if (!isCommandManagerReady) {
      await new Promise((resolve) => {
        const checkReady = setInterval(() => {
          if (isCommandManagerReady) {
            clearInterval(checkReady);
            resolve();
          }
        }, 100);
      });
    }
    return handler(...args);
  };
};

ipcMain.handle('add-command', withCommandManager((_, command) => {
  return commandManager.addCommand(command);
}));

ipcMain.handle('remove-command', withCommandManager((_, commandId) => {
  return commandManager.removeCommand(commandId);
}));

ipcMain.handle('add-phonetic-mapping', withCommandManager((_, { word, phonetic }) => {
  const customPhonetics = store.get('customPhonetics') || {};
  customPhonetics[word] = phonetic;
  store.set('customPhonetics', customPhonetics);
  
  if (voiceRecognizer) {
    voiceRecognizer.updateSettings({
      customPhonetics: customPhonetics
    });
  }
  
  return true;
}));

// App lifecycle events
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Clean up resources
  if (wakeWordDetector) {
    wakeWordDetector.stop();
  }
  
  if (voiceRecognizer) {
    voiceRecognizer.stop();
  }
});
