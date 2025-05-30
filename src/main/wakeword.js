const { Porcupine } = require('@picovoice/porcupine-node');
const { PvRecorder } = require('@picovoice/pvrecorder-node');
const path = require('path');

// Default wake words provided by Porcupine
const BUILT_IN_KEYWORDS = [
  'alexa', 'computer', 'hey google', 'hey siri', 'jarvis', 
  'ok google', 'picovoice', 'porcupine', 'bumblebee'
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
      // Get the appropriate keyword based on user's choice
      let keywordPath = null;
      let keywordIndex = BUILT_IN_KEYWORDS.indexOf(this.options.wakeWord.toLowerCase());
      
      if (keywordIndex === -1) {
        // If not a built-in keyword, try to load a custom keyword file
        // This would require the user to create a custom keyword using Picovoice Console
        const customKeywordPath = path.join(
          process.resourcesPath, 
          'models', 
          'keywords', 
          `${this.options.wakeWord.toLowerCase().replace(/\s+/g, '_')}_windows.ppn`
        );
        
        if (fs.existsSync(customKeywordPath)) {
          keywordPath = customKeywordPath;
        } else {
          // Fall back to a default keyword if custom one is not found
          console.warn(`Custom wake word '${this.options.wakeWord}' not found, falling back to 'hey google'`);
          keywordIndex = BUILT_IN_KEYWORDS.indexOf('hey google');
        }
      }
      
      // Create Porcupine instance
      this.porcupine = keywordPath 
        ? new Porcupine(
            this._getAccessKey(), 
            [keywordPath], 
            [this.options.sensitivity]
          )
        : new Porcupine(
            this._getAccessKey(), 
            [keywordIndex], 
            [this.options.sensitivity]
          );
      
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
    // For Picovoice, you can get a free access key for personal use
    return process.env.PICOVOICE_ACCESS_KEY || 'your-access-key-here';
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
