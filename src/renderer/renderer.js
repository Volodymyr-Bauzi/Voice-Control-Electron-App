// Core Imports
import { voiceService } from './services/voiceService.js';
import { api } from './services/api.js';

// Component Imports
import { CommandList } from './components/commands/CommandList.js';
import { StatusIndicator } from './components/status/StatusIndicator.js';
import { SettingsForm } from './components/settings/SettingsForm.js';
import { PhoneticsManager } from './components/settings/PhoneticsManager.js';
import { CommandModal } from './components/modals/CommandModal.js';


/**
 * Main application controller
 */
class VoiceControlApp {
  constructor() {
    // Initialize components
    this.statusIndicator = new StatusIndicator('status-container');
    this.settingsForm = new SettingsForm();
    this.phoneticsManager = new PhoneticsManager();
    this.commandModal = new CommandModal();

    // Initialize command lists
    this.commandLists = {
      system: new CommandList('system-commands'),
      app: new CommandList('app-commands'),
      keyboard: new CommandList('keyboard-commands')
    };

    // App state
    this.state = {
      settings: {},
      commands: [],
      phonetics: {},
      isListening: false
    };

    // Bind methods
    this.updateStatus = this.updateStatus.bind(this);
    this.loadInitialData = this.loadInitialData.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
  }

  /**
   * Update application status
   * @param {string} state - Status state (e.g., 'loading', 'ready', 'error')
   * @param {string} message - Status message
   */
  updateStatus(state, message) {
    this.statusIndicator.updateStatus(state, message);
  }

  /**
   * Load initial application data
   */
  async loadInitialData() {
    try {
      this.updateStatus('loading', 'Loading settings...');
      this.state.settings = await api.getSettings();
      
      this.updateStatus('loading', 'Loading commands...');
      this.state.commands = await api.getCommands();
      
      this.updateStatus('loading', 'Loading phonetics...');
      this.state.phonetics = await api.getPhonetics();
      
      this.updateUI();
      this.updateStatus('ready', 'Ready');
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.updateStatus('error', `Failed to load: ${error.message}`);
    }
  }

  /**
   * Update UI based on current state
   */
  updateUI() {
    // Update command lists
    Object.values(this.commandLists).forEach(list => {
      const type = list.container.id.split('-')[0];
      const commands = this.state.commands.filter(cmd => cmd.type === type);
      list.update(commands);
    });

    // Update settings form
    this.settingsForm.updateUI(this.state.settings);

    // Update phonetics list
    this.phoneticsManager.updatePhoneticsList(this.state.phonetics);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        if (tabId) {
          // Update active tab
          document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
          
          // Show corresponding tab content
          document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = content.id === `${tabId}-tab` ? 'block' : 'none';
          });
        }
      });
    });

    // Command modal
    document.getElementById('add-command-btn')?.addEventListener('click', () => {
      this.commandModal.open();
    });

    // Settings form
    this.settingsForm.setOnSave(async (settings) => {
      try {
        await api.saveSettings(settings);
        this.state.settings = settings;
        this.updateStatus('success', 'Settings saved');
      } catch (error) {
        console.error('Failed to save settings:', error);
        this.updateStatus('error', 'Failed to save settings');
      }
    });

    // Phonetics manager
    this.phoneticsManager.setOnAdd(async (word, phonetic) => {
      try {
        await api.addPhonetic(word, phonetic);
        this.state.phonetics[word] = phonetic;
        this.phoneticsManager.updatePhoneticsList(this.state.phonetics);
        this.updateStatus('success', 'Phonetic added');
      } catch (error) {
        console.error('Failed to add phonetic:', error);
        this.updateStatus('error', 'Failed to add phonetic');
      }
    });

    this.phoneticsManager.setOnDelete(async (word) => {
      try {
        await api.deletePhonetic(word);
        delete this.state.phonetics[word];
        this.phoneticsManager.updatePhoneticsList(this.state.phonetics);
        this.updateStatus('success', 'Phonetic removed');
      } catch (error) {
        console.error('Failed to delete phonetic:', error);
        this.updateStatus('error', 'Failed to remove phonetic');
      }
    });

    // Command modal
    this.commandModal.setOnSave(async (command) => {
      try {
        await api.saveCommand(command);
        await this.loadInitialData();
        this.updateStatus('success', 'Command saved');
      } catch (error) {
        console.error('Failed to save command:', error);
        this.updateStatus('error', 'Failed to save command');
      }
    });

    // Set up command actions
    Object.values(this.commandLists).forEach(list => {
      list.setOnEdit((command) => this.commandModal.open(command));
      list.setOnDelete(async (commandId) => {
        try {
          await api.deleteCommand(commandId);
          await this.loadInitialData();
          this.updateStatus('success', 'Command deleted');
        } catch (error) {
          console.error('Failed to delete command:', error);
          this.updateStatus('error', 'Failed to delete command');
        }
      });
    });

    // Voice service events
    voiceService.onStatusUpdate((state, message) => {
      this.updateStatus(state, message);
      this.state.isListening = state === 'listening';
    });
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      this.updateStatus('initializing', 'Starting application...');
      
      // Load initial data
      await this.loadInitialData();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize voice service
      await voiceService.initialize();
      
      this.updateStatus('ready', 'Ready');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.updateStatus('error', `Initialization failed: ${error.message}`);
    }
  }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new VoiceControlApp();
  app.initialize();
});
