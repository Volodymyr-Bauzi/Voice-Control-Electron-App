// DOM Elements
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const recognitionText = document.getElementById('recognition-text');
const wakeWordText = document.getElementById('wake-word-text');
const wakeWordDisplay = document.getElementById('wake-word-display');
const listenBtn = document.getElementById('listen-btn');
const stopBtn = document.getElementById('stop-btn');
const commandsList = document.getElementById('commands-list');
const folderPath = document.getElementById('folder-path');
const selectFolderBtn = document.getElementById('select-folder-btn');
const addCommandBtn = document.getElementById('add-command-btn');
const addDefaultCommandsBtn = document.getElementById('add-default-commands-btn');
const editWakeWordBtn = document.getElementById('edit-wake-word-btn');

// Navigation elements
const navButtons = document.querySelectorAll('.nav-button');
const tabContents = document.querySelectorAll('.tab-content');

// Command lists
const systemCommandsList = document.getElementById('system-commands');
const appCommandsList = document.getElementById('app-commands');
const keyboardCommandsList = document.getElementById('keyboard-commands');

// Settings form elements
const wakeWordInput = document.getElementById('wake-word-input');
const sensitivitySlider = document.getElementById('sensitivity-slider');
const engineSelect = document.getElementById('engine-select');
const startMinimizedCheckbox = document.getElementById('start-minimized');
const startAtLoginCheckbox = document.getElementById('start-at-login');
const showNotificationsCheckbox = document.getElementById('show-notifications');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Phonetics form elements
const wordInput = document.getElementById('word-input');
const phoneticInput = document.getElementById('phonetic-input');
const addPhoneticBtn = document.getElementById('add-phonetic-btn');
const phoneticsList = document.getElementById('phonetics-list');

// Modal elements
const addCommandModal = document.getElementById('add-command-modal');
const closeCommandModalBtn = document.getElementById('close-command-modal');
const commandPhraseInput = document.getElementById('command-phrase');
const commandTypeSelect = document.getElementById('command-type');
const appActionGroup = document.getElementById('app-action-group');
const keyboardActionGroup = document.getElementById('keyboard-action-group');
const systemActionGroup = document.getElementById('system-action-group');
const appPathInput = document.getElementById('app-path');
const browseAppBtn = document.getElementById('browse-app-btn');
const keyboardActionSelect = document.getElementById('keyboard-action');
const systemActionSelect = document.getElementById('system-action');
const commandDescriptionInput = document.getElementById('command-description');
const saveCommandBtn = document.getElementById('save-command-btn');
const cancelCommandBtn = document.getElementById('cancel-command-btn');

// State
let isListening = false;
let settings = {};
let commands = [];
let customPhonetics = {};

// Initialize the application
async function initializeApp() {
  try {
    console.log('Starting application initialization...');
    updateStatus('initializing', 'Initializing command manager...');
    
    // Listen for command manager ready event
    await new Promise((resolve) => {
      const onReady = (ready) => {
        if (ready) {
          console.log('Command manager is ready');
          window.api.off('command-manager-ready', onReady);
          resolve();
        }
      };
      
      // Set timeout as a safety measure
      const timeout = setTimeout(() => {
        console.error('Command manager ready event timed out');
        window.api.off('command-manager-ready', onReady);
        resolve(); // Continue even if timeout occurs
      }, 10000); // 10 second timeout
      
      window.api.onCommandManagerReady(onReady);
      
      // Also check current status in case we missed the event
      window.api.isCommandManagerReady().then(ready => {
        if (ready) {
          clearTimeout(timeout);
          onReady(true);
        }
      });
    });

    console.log('Loading settings and commands...');
    updateStatus('initializing', 'Loading settings...');
    settings = await window.api.getSettings();
    
    updateStatus('initializing', 'Loading commands...');
    commands = await window.api.getCommands();
    
    console.log('Updating UI...');
    updateUIFromSettings();
    updateCommandsUI();
    
    console.log('Setting up event listeners...');
    setupEventListeners();
    setupAPIEventListeners();
    
    console.log('Initialization complete');
    updateStatus('ready', 'Ready');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    updateStatus('error', `Initialization failed: ${error.message}`);
  }
}

// Update UI elements based on settings
function updateUIFromSettings() {
  // Update wake word display
  wakeWordText.textContent = settings.wakeWord;
  wakeWordDisplay.textContent = settings.wakeWord;
  wakeWordInput.value = settings.wakeWord;
  
  // Update sensitivity slider
  sensitivitySlider.value = settings.sensitivity;
  
  // Update engine select
  engineSelect.value = settings.engineType;
  
  // Update checkboxes
  startMinimizedCheckbox.checked = settings.startMinimized;
  startAtLoginCheckbox.checked = settings.startAtLogin;
  showNotificationsCheckbox.checked = settings.showNotifications;
  
  // Update folder path
  if (settings.voiceAppsFolder) {
    folderPath.textContent = settings.voiceAppsFolder;
  } else {
    folderPath.textContent = 'No folder selected';
  }
  
  // Update custom phonetics
  customPhonetics = settings.customPhonetics || {};
  updatePhoneticsUI();
}

// Update commands UI
function updateCommandsUI() {
  // Clear existing commands
  commandsList.innerHTML = '';
  systemCommandsList.innerHTML = '';
  appCommandsList.innerHTML = '';
  keyboardCommandsList.innerHTML = '';
  
  if (commands.length === 0) {
    // Show empty state
    commandsList.innerHTML = `
      <div class="empty-state">
        <p>No commands configured yet</p>
        <button id="add-default-commands-btn" class="text-button">Add Default Commands</button>
      </div>
    `;
    // Re-attach event listener
    document.getElementById('add-default-commands-btn').addEventListener('click', addDefaultCommands);
    return;
  }
  
  // Group commands by type
  const systemCommands = commands.filter(cmd => cmd.type === 'system');
  const appCommands = commands.filter(cmd => cmd.type === 'app');
  const keyboardCommands = commands.filter(cmd => cmd.type === 'keyboard');
  
  // Populate main commands list
  commands.forEach(command => {
    const commandItem = createCommandItem(command);
    commandsList.appendChild(commandItem);
  });
  
  // Populate sidebar command lists
  systemCommands.forEach(command => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="command-text">${command.phrase}</span>
      <span class="command-action">${command.description || command.action}</span>
    `;
    systemCommandsList.appendChild(li);
  });
  
  appCommands.forEach(command => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="command-text">${command.phrase}</span>
      <span class="command-action">${command.description || 'Launch application'}</span>
    `;
    appCommandsList.appendChild(li);
  });
  
  keyboardCommands.forEach(command => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="command-text">${command.phrase}</span>
      <span class="command-action">${command.description || command.action}</span>
    `;
    keyboardCommandsList.appendChild(li);
  });
}

// Create a command item element
function createCommandItem(command) {
  const div = document.createElement('div');
  div.className = 'command-item';
  div.innerHTML = `
    <div class="command-info">
      <div class="command-phrase">${command.phrase}</div>
      <div class="command-description">${command.description || `${command.type}: ${command.action}`}</div>
    </div>
    <div class="command-actions">
      <button class="icon-button edit-command-btn" data-id="${command.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
      </button>
      <button class="icon-button delete-command-btn" data-id="${command.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Add event listeners
  div.querySelector('.edit-command-btn').addEventListener('click', () => {
    editCommand(command);
  });
  
  div.querySelector('.delete-command-btn').addEventListener('click', () => {
    deleteCommand(command.id);
  });
  
  return div;
}

// Update phonetics UI
function updatePhoneticsUI() {
  phoneticsList.innerHTML = '';
  
  const phoneticEntries = Object.entries(customPhonetics);
  
  if (phoneticEntries.length === 0) {
    phoneticsList.innerHTML = `
      <div class="empty-state">
        <p>No custom pronunciations added yet</p>
      </div>
    `;
    return;
  }
  
  phoneticEntries.forEach(([word, phonetic]) => {
    const phoneticItem = document.createElement('div');
    phoneticItem.className = 'phonetic-item';
    phoneticItem.innerHTML = `
      <div>
        <div class="phonetic-word">${word}</div>
        <div class="phonetic-pronunciation">${phonetic}</div>
      </div>
      <button class="icon-button delete-phonetic-btn" data-word="${word}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;
    
    phoneticItem.querySelector('.delete-phonetic-btn').addEventListener('click', () => {
      deletePhoneticMapping(word);
    });
    
    phoneticsList.appendChild(phoneticItem);
  });
}

// Update status display
function updateStatus(state, message) {
  statusText.textContent = message;
  
  // Reset classes
  statusDot.className = 'status-dot';
  
  // Add appropriate class based on state
  switch (state) {
    case 'active':
      statusDot.classList.add('active');
      break;
    case 'listening':
      statusDot.classList.add('listening');
      break;
    case 'error':
      statusDot.classList.add('error');
      break;
    default:
      // Default state (initializing)
      break;
  }
}

// Set up event listeners
function setupEventListeners() {
  // Navigation
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active button
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show selected tab
      tabContents.forEach(tab => {
        if (tab.id === `${tabId}-tab`) {
          tab.classList.remove('hidden');
        } else {
          tab.classList.add('hidden');
        }
      });
    });
  });
  
  // Listen button
  listenBtn.addEventListener('click', () => {
    startListening();
  });
  
  // Stop button
  stopBtn.addEventListener('click', () => {
    stopListening();
  });
  
  // Select folder button
  selectFolderBtn.addEventListener('click', async () => {
    const selectedFolder = await window.api.selectVoiceAppsFolder();
    if (selectedFolder) {
      folderPath.textContent = selectedFolder;
    }
  });
  
  // Add command button
  addCommandBtn.addEventListener('click', () => {
    showAddCommandModal();
  });
  
  // Add default commands button
  addDefaultCommandsBtn.addEventListener('click', addDefaultCommands);
  
  // Edit wake word button
  editWakeWordBtn.addEventListener('click', () => {
    // Switch to settings tab
    document.querySelector('.nav-button[data-tab="settings"]').click();
    // Focus wake word input
    wakeWordInput.focus();
  });
  
  // Save settings button
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Add phonetic mapping button
  addPhoneticBtn.addEventListener('click', addPhoneticMapping);
  
  // Command type select
  commandTypeSelect.addEventListener('change', updateCommandTypeUI);
  
  // Browse app button
  browseAppBtn.addEventListener('click', browseForApplication);
  
  // Modal buttons
  closeCommandModalBtn.addEventListener('click', hideAddCommandModal);
  cancelCommandBtn.addEventListener('click', hideAddCommandModal);
  saveCommandBtn.addEventListener('click', saveCommand);
}

// Set up API event listeners
function setupAPIEventListeners() {
  // Voice components ready
  window.api.onVoiceComponentsReady((status) => {
    if (status) {
      updateStatus('active', 'Ready');
    } else {
      updateStatus('error', 'Failed to initialize voice components');
    }
  });
  
  // Wake word detected
  window.api.onWakeWordDetected(() => {
    updateStatus('listening', 'Wake word detected!');
    recognitionText.textContent = `Wake word detected! Listening...`;
    document.querySelector('.recognition-box').classList.add('active');
  });
  
  // Listening status changed
  window.api.onListeningStatusChanged((status) => {
    isListening = status;
    
    if (status) {
      updateStatus('listening', 'Listening...');
      listenBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      updateStatus('active', 'Ready');
      listenBtn.disabled = false;
      stopBtn.disabled = true;
      document.querySelector('.recognition-box').classList.remove('active');
      recognitionText.textContent = `Say "${settings.wakeWord}" to activate`;
    }
  });
  
  // Transcription result
  window.api.onTranscriptionResult((text) => {
    recognitionText.textContent = text;
  });
  
  // Recognition error
  window.api.onRecognitionError((error) => {
    updateStatus('error', 'Recognition error');
    recognitionText.textContent = `Error: ${error}`;
    setTimeout(() => {
      updateStatus('active', 'Ready');
      recognitionText.textContent = `Say "${settings.wakeWord}" to activate`;
    }, 3000);
  });
  
  // Command executed
  window.api.onCommandExecuted((data) => {
    const { command, originalText } = data;
    
    recognitionText.textContent = `Executing: "${command.phrase}" (${originalText})`;
    
    setTimeout(() => {
      recognitionText.textContent = `Say "${settings.wakeWord}" to activate`;
      document.querySelector('.recognition-box').classList.remove('active');
    }, 3000);
  });
}

// Start listening for commands
function startListening() {
  if (isListening) return;
  
  // Update UI
  updateStatus('listening', 'Listening...');
  document.querySelector('.recognition-box').classList.add('active');
  recognitionText.textContent = 'Listening...';
  listenBtn.disabled = true;
  stopBtn.disabled = false;
  
  // Start listening via API
  window.api.startListening();
}

// Stop listening for commands
function stopListening() {
  if (!isListening) return;
  
  // Update UI
  updateStatus('active', 'Ready');
  document.querySelector('.recognition-box').classList.remove('active');
  recognitionText.textContent = `Say "${settings.wakeWord}" to activate`;
  listenBtn.disabled = false;
  stopBtn.disabled = true;
  
  // Stop listening via API
  window.api.stopListening();
}

// Save settings
async function saveSettings() {
  try {
    // Get values from form
    const newSettings = {
      wakeWord: wakeWordInput.value,
      sensitivity: parseFloat(sensitivitySlider.value),
      engineType: engineSelect.value,
      startMinimized: startMinimizedCheckbox.checked,
      startAtLogin: startAtLoginCheckbox.checked,
      showNotifications: showNotificationsCheckbox.checked,
      voiceAppsFolder: settings.voiceAppsFolder,
      customPhonetics: settings.customPhonetics
    };
    
    // Validate wake word
    if (!newSettings.wakeWord) {
      alert('Wake word cannot be empty');
      return;
    }
    
    // Update settings
    const success = await window.api.updateSettings(newSettings);
    
    if (success) {
      // Update local settings
      settings = newSettings;
      
      // Update UI
      wakeWordText.textContent = settings.wakeWord;
      wakeWordDisplay.textContent = settings.wakeWord;
      
      // Show success message
      updateStatus('active', 'Settings saved');
      setTimeout(() => {
        updateStatus('active', 'Ready');
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('Failed to save settings');
  }
}

// Add phonetic mapping
async function addPhoneticMapping() {
  const word = wordInput.value.trim();
  const phonetic = phoneticInput.value.trim();
  
  if (!word || !phonetic) {
    alert('Both word and phonetic pronunciation are required');
    return;
  }
  
  try {
    const success = await window.api.addPhoneticMapping({ word, phonetic });
    
    if (success) {
      // Update local phonetics
      customPhonetics[word] = phonetic;
      settings.customPhonetics = customPhonetics;
      
      // Update UI
      updatePhoneticsUI();
      
      // Clear inputs
      wordInput.value = '';
      phoneticInput.value = '';
    }
  } catch (error) {
    console.error('Failed to add phonetic mapping:', error);
    alert('Failed to add phonetic mapping');
  }
}

// Delete phonetic mapping
async function deletePhoneticMapping(word) {
  if (!confirm(`Delete phonetic mapping for "${word}"?`)) {
    return;
  }
  
  try {
    // Remove from local phonetics
    delete customPhonetics[word];
    settings.customPhonetics = customPhonetics;
    
    // Update settings
    const success = await window.api.updateSettings(settings);
    
    if (success) {
      // Update UI
      updatePhoneticsUI();
    }
  } catch (error) {
    console.error('Failed to delete phonetic mapping:', error);
    alert('Failed to delete phonetic mapping');
  }
}

// Show add command modal
function showAddCommandModal() {
  // Reset form
  commandPhraseInput.value = '';
  commandTypeSelect.value = 'app';
  appPathInput.value = '';
  keyboardActionSelect.value = 'space';
  systemActionSelect.value = 'quit';
  commandDescriptionInput.value = '';
  
  // Show appropriate action group
  updateCommandTypeUI();
  
  // Show modal
  addCommandModal.classList.add('visible');
}

// Hide add command modal
function hideAddCommandModal() {
  addCommandModal.classList.remove('visible');
}

// Update command type UI
function updateCommandTypeUI() {
  const commandType = commandTypeSelect.value;
  
  // Hide all action groups
  appActionGroup.classList.add('hidden');
  keyboardActionGroup.classList.add('hidden');
  systemActionGroup.classList.add('hidden');
  
  // Show appropriate action group
  switch (commandType) {
    case 'app':
      appActionGroup.classList.remove('hidden');
      break;
    case 'keyboard':
      keyboardActionGroup.classList.remove('hidden');
      break;
    case 'system':
      systemActionGroup.classList.remove('hidden');
      break;
  }
}

// Browse for application
async function browseForApplication() {
  // This would typically use an IPC call to open a file dialog
  // For now, we'll just show an alert
  alert('This functionality requires additional implementation');
}

// Save command
async function saveCommand() {
  const phrase = commandPhraseInput.value.trim();
  const type = commandTypeSelect.value;
  let action = '';
  let description = commandDescriptionInput.value.trim();
  
  // Validate phrase
  if (!phrase) {
    alert('Command phrase is required');
    return;
  }
  
  // Get action based on type
  switch (type) {
    case 'app':
      action = appPathInput.value.trim();
      if (!action) {
        alert('Application path is required');
        return;
      }
      break;
    case 'keyboard':
      action = keyboardActionSelect.value;
      break;
    case 'system':
      action = systemActionSelect.value;
      break;
  }
  
  try {
    // Create command object
    const command = {
      phrase,
      type,
      action,
      description
    };
    
    // Add command
    const newCommand = await window.api.addCommand(command);
    
    if (newCommand) {
      // Add to local commands
      commands.push(newCommand);
      
      // Update UI
      updateCommandsUI();
      
      // Hide modal
      hideAddCommandModal();
    }
  } catch (error) {
    console.error('Failed to add command:', error);
    alert('Failed to add command');
  }
}

// Edit command
function editCommand(command) {
  // Populate form
  commandPhraseInput.value = command.phrase;
  commandTypeSelect.value = command.type;
  commandDescriptionInput.value = command.description || '';
  
  // Set action based on type
  switch (command.type) {
    case 'app':
      appPathInput.value = command.action;
      break;
    case 'keyboard':
      keyboardActionSelect.value = command.action;
      break;
    case 'system':
      systemActionSelect.value = command.action;
      break;
  }
  
  // Update UI
  updateCommandTypeUI();
  
  // Show modal
  addCommandModal.classList.add('visible');
  
  // Update save button to handle edit
  saveCommandBtn.onclick = async () => {
    // Get updated values
    const updatedCommand = {
      id: command.id,
      phrase: commandPhraseInput.value.trim(),
      type: commandTypeSelect.value,
      description: commandDescriptionInput.value.trim()
    };
    
    // Get action based on type
    switch (updatedCommand.type) {
      case 'app':
        updatedCommand.action = appPathInput.value.trim();
        if (!updatedCommand.action) {
          alert('Application path is required');
          return;
        }
        break;
      case 'keyboard':
        updatedCommand.action = keyboardActionSelect.value;
        break;
      case 'system':
        updatedCommand.action = systemActionSelect.value;
        break;
    }
    
    try {
      // Update command
      const success = await window.api.updateCommand(updatedCommand);
      
      if (success) {
        // Update local commands
        const index = commands.findIndex(cmd => cmd.id === command.id);
        if (index !== -1) {
          commands[index] = updatedCommand;
        }
        
        // Update UI
        updateCommandsUI();
        
        // Hide modal
        hideAddCommandModal();
        
        // Reset save button
        saveCommandBtn.onclick = saveCommand;
      }
    } catch (error) {
      console.error('Failed to update command:', error);
      alert('Failed to update command');
    }
  };
}

// Delete command
async function deleteCommand(commandId) {
  if (!confirm('Are you sure you want to delete this command?')) {
    return;
  }
  
  try {
    const success = await window.api.removeCommand(commandId);
    
    if (success) {
      // Remove from local commands
      commands = commands.filter(cmd => cmd.id !== commandId);
      
      // Update UI
      updateCommandsUI();
    }
  } catch (error) {
    console.error('Failed to delete command:', error);
    alert('Failed to delete command');
  }
}

// Add default commands
async function addDefaultCommands() {
  try {
    // This would typically call a main process function to add default commands
    alert('Default commands will be added');
    
    // Reload commands
    commands = await window.api.getCommands();
    updateCommandsUI();
  } catch (error) {
    console.error('Failed to add default commands:', error);
    alert('Failed to add default commands');
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Clean up event listeners when the window is unloaded
window.addEventListener('beforeunload', () => {
  window.api.removeAllListeners();
});
