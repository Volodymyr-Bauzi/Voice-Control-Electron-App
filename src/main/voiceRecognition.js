const { PvRecorder } = require('@picovoice/pvrecorder-node');
const path = require('path');
const fs = require('fs');
const vosk = require('vosk');
const { spawn } = require('child_process');
const VAD = require('node-vad');

class VoiceRecognizer {
  constructor(options) {
    this.options = options;
    this.recorder = null;
    this.recognizer = null;
    this.vad = null;
    this.isRunning = false;
    this.engineType = options.engineType || 'vosk';
    this.customPhonetics = options.customPhonetics || {};
    this.lastTranscription = '';
  }

  async initialize() {
    try {
      // Initialize Voice Activity Detection
      this.vad = new VAD(VAD.Mode.VERY_AGGRESSIVE);
      
      // Initialize recorder
      this.recorder = new PvRecorder(
        512, // Frame length for VAD
        1    // Default microphone
      );
      
      // Initialize the appropriate speech recognition engine
      if (this.engineType === 'vosk') {
        await this._initializeVosk();
      } else if (this.engineType === 'whisper') {
        await this._initializeWhisper();
      } else {
        throw new Error(`Unsupported engine type: ${this.engineType}`);
      }
      
      console.log(`Voice recognition initialized with engine: ${this.engineType}`);
      console.log(`Using microphone: ${this.recorder.getSelectedDevice()}`);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize voice recognition:', error);
      throw error;
    }
  }
  
  async _initializeVosk() {
    // Set up Vosk model path
    const modelPath = path.join(
      process.resourcesPath,
      'models',
      'vosk',
      'vosk-model-small-en-us-0.15'
    );
    
    // Check if model exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Vosk model not found at: ${modelPath}`);
    }
    
    // Initialize Vosk
    vosk.setLogLevel(0); // Disable logs
    const model = new vosk.Model(modelPath);
    
    // Create recognizer with custom words if available
    if (Object.keys(this.customPhonetics).length > 0) {
      // Create a JSON grammar with custom words and phonetics
      const grammar = {
        "name": "custom_grammar",
        "phrases": Object.keys(this.customPhonetics).map(word => ({
          "word": word,
          "phoneme": this.customPhonetics[word]
        }))
      };
      
      // Convert grammar to string
      const grammarStr = JSON.stringify(grammar);
      
      // Create recognizer with grammar
      this.recognizer = new vosk.Recognizer({
        model: model,
        sampleRate: 16000,
        grammar: grammarStr
      });
    } else {
      // Create standard recognizer
      this.recognizer = new vosk.Recognizer({
        model: model,
        sampleRate: 16000
      });
    }
  }
  
  async _initializeWhisper() {
    // Whisper initialization would be implemented here
    // For now, we'll throw an error as we're focusing on Vosk for offline recognition
    throw new Error('Whisper engine not yet implemented');
  }
  
  async start() {
    if (this.isRunning) return;
    
    try {
      await this.recorder.start();
      this.isRunning = true;
      
      console.log('Voice recognition started');
      
      // Start recognition loop
      this._recognitionLoop();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      throw error;
    }
  }
  
  async stop() {
    if (!this.isRunning) return;
    
    try {
      this.isRunning = false;
      await this.recorder.stop();
      
      // Reset recognizer for next session
      if (this.engineType === 'vosk' && this.recognizer) {
        this.recognizer.reset();
      }
      
      console.log('Voice recognition stopped');
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }
  
  updateSettings(settings) {
    let needsReinitialization = false;
    
    // Check if engine type changed
    if (settings.engineType && settings.engineType !== this.engineType) {
      this.engineType = settings.engineType;
      needsReinitialization = true;
    }
    
    // Check if custom phonetics changed
    if (settings.customPhonetics) {
      const oldKeys = Object.keys(this.customPhonetics);
      const newKeys = Object.keys(settings.customPhonetics);
      
      if (oldKeys.length !== newKeys.length || 
          !oldKeys.every(key => 
            newKeys.includes(key) && 
            this.customPhonetics[key] === settings.customPhonetics[key]
          )) {
        this.customPhonetics = settings.customPhonetics;
        needsReinitialization = true;
      }
    }
    
    // Reinitialize if needed
    if (needsReinitialization) {
      const wasRunning = this.isRunning;
      
      if (wasRunning) {
        this.stop()
          .then(() => this.release())
          .then(() => this.initialize())
          .then(() => {
            if (wasRunning) {
              this.start();
            }
          })
          .catch(error => {
            console.error('Failed to reinitialize voice recognition:', error);
            if (this.options.onError) {
              this.options.onError(error);
            }
          });
      } else {
        this.release()
          .then(() => this.initialize())
          .catch(error => {
            console.error('Failed to reinitialize voice recognition:', error);
            if (this.options.onError) {
              this.options.onError(error);
            }
          });
      }
    }
  }
  
  async release() {
    try {
      if (this.isRunning) {
        await this.stop();
      }
      
      if (this.recognizer) {
        this.recognizer.free();
        this.recognizer = null;
      }
      
      if (this.recorder) {
        this.recorder.release();
        this.recorder = null;
      }
      
      console.log('Voice recognition resources released');
    } catch (error) {
      console.error('Failed to release voice recognition resources:', error);
    }
  }
  
  async _recognitionLoop() {
    let silenceFrames = 0;
    const SILENCE_THRESHOLD = 30; // ~1.5 seconds of silence
    
    while (this.isRunning) {
      try {
        // Get audio frame
        const frame = await this.recorder.read();
        
        // Process with VAD to detect speech
        const vadResult = await this.vad.processAudio(Buffer.from(frame), 16000);
        
        if (vadResult === VAD.Event.SILENCE) {
          silenceFrames++;
          
          // If we've detected enough silence after speech, process the final result
          if (silenceFrames >= SILENCE_THRESHOLD && this.lastTranscription) {
            if (this.options.onTranscriptionResult) {
              this.options.onTranscriptionResult(this.lastTranscription);
            }
            this.lastTranscription = '';
            silenceFrames = 0;
          }
        } else {
          silenceFrames = 0;
        }
        
        // Process with speech recognition engine
        if (this.engineType === 'vosk') {
          const result = this.recognizer.acceptWaveform(Buffer.from(frame));
          
          if (result) {
            // Final result
            const transcription = JSON.parse(this.recognizer.result()).text;
            if (transcription) {
              this.lastTranscription = transcription;
            }
          } else {
            // Partial result
            const partialTranscription = JSON.parse(this.recognizer.partialResult()).partial;
            if (partialTranscription) {
              // Update UI with partial result
              if (this.options.onPartialResult) {
                this.options.onPartialResult(partialTranscription);
              }
            }
          }
        }
        // Add other engines here
        
      } catch (error) {
        if (this.isRunning) {
          console.error('Error in voice recognition loop:', error);
          if (this.options.onError) {
            this.options.onError(error);
          }
        }
        // Brief pause to prevent tight loop in case of repeated errors
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  // Apply custom phonetic mappings to improve recognition
  _applyPhoneticMappings(text) {
    if (!text) return text;
    
    let processedText = text.toLowerCase();
    
    // Apply each phonetic mapping
    Object.entries(this.customPhonetics).forEach(([word, phonetic]) => {
      // Create a regex that matches the word with word boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      
      // Replace all occurrences
      processedText = processedText.replace(regex, word);
    });
    
    return processedText;
  }
}

// Factory function to set up voice recognition
async function setupVoiceRecognition(options) {
  const recognizer = new VoiceRecognizer(options);
  await recognizer.initialize();
  return recognizer;
}

module.exports = {
  VoiceRecognizer,
  setupVoiceRecognition
};
