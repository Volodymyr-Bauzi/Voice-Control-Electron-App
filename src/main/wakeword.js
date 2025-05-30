const { Porcupine } = require('@picovoice/porcupine-node');
const { PvRecorder } = require('@picovoice/pvrecorder-node');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const isPackaged = app ? app.isPackaged : false;
// Default wake words provided by Porcupine
// Built-in keywords - we'll prioritize using custom wake word files
const BUILT_IN_KEYWORDS = [
  { name: 'bumblebee', file: 'bumblebee_windows.ppn' },
  { name: 'hey flexi', file: 'Hey_Flexi_windows.ppn' },
  { name: 'alexa', file: 'alexa_windows.ppn' },
  { name: 'computer', file: 'computer_windows.ppn' },
  { name: 'hey google', file: 'hey google_windows.ppn' },
  { name: 'hey siri', file: 'hey siri_windows.ppn' },
  { name: 'jarvis', file: 'jarvis_windows.ppn' },
  { name: 'ok google', file: 'ok google_windows.ppn' },
  { name: 'picovoice', file: 'picovoice_windows.ppn' },
];

class WakeWordDetector {
  constructor(options) {
    this.options = options;
    this.porcupine = null;
    this.recorder = null;
    this.isRunning = false;
    this.isPaused = false;
  }

  async initialize() {
    try {
      if (this.porcupine) {
        return; // Already initialized
      }
      
      console.log('Initializing wake word detector with options:', this.options);
      
      // Use the built-in 'porcupine' keyword
      console.log('Using built-in "porcupine" wake word');
      
      // Hardcode the index for 'porcupine' (should be 0 based on our BUILT_IN_KEYWORDS array)
      const keywordName = this.options.wakeWord || 'porcupine';
      const keywordFile = BUILT_IN_KEYWORDS.find(k => k.name.toLowerCase() === keywordName.toLowerCase())?.file;

      if (!keywordFile) {
        throw new Error(`Wake word '${keywordName}' not found in BUILT_IN_KEYWORDS list.`);
      }

      const baseDir = isPackaged
        ? path.join(process.resourcesPath, 'models', 'keywords')
        : path.join(__dirname, 'resources/models/keywords');

      const keywordPath = path.join(baseDir, keywordFile);

      if (!fs.existsSync(keywordPath)) {
        console.error(`Wake word model not found at: ${keywordPath}`);
        const dirContents = fs.readdirSync(path.dirname(keywordPath));
        console.error('Available files:', dirContents);
        throw new Error(`Missing keyword file: ${keywordFile}`);
      }

      try {
        // Initialize Porcupine with the built-in keyword index
        this.porcupine = new Porcupine(
          this._getAccessKey(),
          [keywordPath],
          [this.options.sensitivity]
        );        
        console.log('Successfully initialized Porcupine with built-in keyword');
      } catch (error) {
        console.error('Failed to initialize Porcupine:', error);
        throw new Error(`Failed to initialize wake word detection: ${error.message}`);
      }
      
      // Initialize recorder
      this.recorder = new PvRecorder(
        this.porcupine.frameLength,
        1 // Use the default microphone
      );
      
      console.log(`Wake word detector initialized with keyword: ${this.options.wakeWord}`);
      console.log(`Using microphone: ${this.recorder.getSelectedDevice()}`);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize wake word detector:', error);
      throw error;
    }
  }
  
  _getAccessKey() {
    // In a production app, you would store this securely
    // Sign up at https://console.picovoice.ai/ to get a free access key
    const accessKey = process.env.PICOVOICE_ACCESS_KEY || 'your-access-key-here';
    
    if (!accessKey || accessKey === 'your-access-key-here') {
      console.error('ERROR: Please set your Picovoice access key in the PICOVOICE_ACCESS_KEY environment variable');
      console.error('Get a free access key at: https://console.picovoice.ai/');
      throw new Error('Picovoice access key not found. Please set the PICOVOICE_ACCESS_KEY environment variable.');
    }
    
    return accessKey;
  }
  
  async start() {
    if (this.isRunning) return;
    
    try {
      await this.recorder.start();
      this.isRunning = true;
      this.isPaused = false;
      
      console.log('Wake word detection started');
      
      // Start detection loop
      this._detectionLoop();
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      throw error;
    }
  }
  
  async stop() {
    if (!this.isRunning) return;
    
    try {
      this.isRunning = false;
      this.isPaused = false;
      await this.recorder.stop();
      
      console.log('Wake word detection stopped');
    } catch (error) {
      console.error('Failed to stop wake word detection:', error);
    }
  }
  
  pause() {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    console.log('Wake word detection paused');
  }
  
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    
    this.isPaused = false;
    console.log('Wake word detection resumed');
  }
  
  updateSettings(settings) {
    // If wake word changed, we need to reinitialize
    if (settings.wakeWord && settings.wakeWord !== this.options.wakeWord) {
      this.options.wakeWord = settings.wakeWord;
      
      // If currently running, stop, reinitialize, and restart
      const wasRunning = this.isRunning;
      const wasPaused = this.isPaused;
      
      if (wasRunning) {
        this.stop()
          .then(() => this.release())
          .then(() => this.initialize())
          .then(() => {
            if (wasRunning) {
              this.start().then(() => {
                if (wasPaused) {
                  this.pause();
                }
              });
            }
          })
          .catch(error => {
            console.error('Failed to reinitialize wake word detector:', error);
          });
      } else {
        this.release()
          .then(() => this.initialize())
          .catch(error => {
            console.error('Failed to reinitialize wake word detector:', error);
          });
      }
    }
    
    // Update sensitivity if changed
    if (settings.sensitivity !== undefined && settings.sensitivity !== this.options.sensitivity) {
      this.options.sensitivity = settings.sensitivity;
      // Note: To apply sensitivity changes, we would need to reinitialize Porcupine
      // This is handled above if we're already reinitializing due to wake word change
    }
  }
  
  async release() {
    try {
      if (this.isRunning) {
        await this.stop();
      }
      
      if (this.porcupine) {
        this.porcupine.release();
        this.porcupine = null;
      }
      
      if (this.recorder) {
        this.recorder.release();
        this.recorder = null;
      }
      
      console.log('Wake word detector resources released');
    } catch (error) {
      console.error('Failed to release wake word detector resources:', error);
    }
  }
  
  async _detectionLoop() {
    while (this.isRunning) {
      try {
        // Skip processing if paused
        if (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        // Get audio frame
        const frame = await this.recorder.read();
        
        // Process frame with Porcupine
        const keywordIndex = this.porcupine.process(frame);
        
        // If wake word detected
        if (keywordIndex !== -1) {
          console.log('Wake word detected!');
          
          // Call the callback function
          if (this.options.onWakeWordDetected) {
            this.options.onWakeWordDetected();
          }
        }
      } catch (error) {
        if (this.isRunning) {
          console.error('Error in wake word detection loop:', error);
        }
        // Brief pause to prevent tight loop in case of repeated errors
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}

// Factory function to set up wake word detection
async function setupWakeWordDetection(options) {
  const detector = new WakeWordDetector(options);
  await detector.initialize();
  return detector;
}

module.exports = {
  WakeWordDetector,
  setupWakeWordDetection
};
