import { api } from './api';

export class VoiceService {
  constructor() {
    this.isListening = false;
    this.statusCallbacks = [];
    this.recognitionCallbacks = [];
    this.wakeWordCallbacks = [];
    this.errorCallbacks = [];
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  onStatusUpdate(callback) {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onRecognition(callback) {
    this.recognitionCallbacks.push(callback);
    return () => {
      this.recognitionCallbacks = this.recognitionCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onWakeWord(callback) {
    this.wakeWordCallbacks.push(callback);
    return () => {
      this.wakeWordCallbacks = this.wakeWordCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onError(callback) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }
  
  async startListening() {
    try {
      await api.startListening();
      this.isListening = true;
      this.triggerStatusUpdate('listening', 'Listening...');
      return true;
    } catch (error) {
      this.triggerError('Failed to start listening', error);
      return false;
    }
  }
  
  async stopListening() {
    try {
      await api.stopListening();
      this.isListening = false;
      this.triggerStatusUpdate('idle', 'Ready');
      return true;
    } catch (error) {
      this.triggerError('Failed to stop listening', error);
      return false;
    }
  }
  
  setupEventListeners() {
    // Listen for wake word detection
    this.removeWakeWordListener = api.onWakeWordDetected((event, data) => {
      this.triggerWakeWord(data);
    });
    
    // Listen for recognized commands
    this.removeCommandListener = api.onCommandRecognized((event, data) => {
      this.triggerRecognition(data);
    });
    
    // Listen for status updates
    this.removeStatusListener = api.onStatusUpdate((event, status) => {
      this.triggerStatusUpdate(status.state, status.message);
    });
    
    // Listen for errors
    this.removeErrorListener = api.onError((event, error) => {
      this.triggerError(error.message || 'An error occurred', error);
    });
  }
  
  triggerStatusUpdate(state, message) {
    this.statusCallbacks.forEach(callback => callback(state, message));
  }
  
  triggerRecognition(recognition) {
    this.recognitionCallbacks.forEach(callback => callback(recognition));
  }
  
  triggerWakeWord(data) {
    this.wakeWordCallbacks.forEach(callback => callback(data));
  }
  
  triggerError(message, error) {
    console.error(message, error);
    this.statusCallbacks.forEach(callback => callback('error', message));
    this.errorCallbacks.forEach(callback => callback(message, error));
  }
  
  cleanup() {
    // Remove all event listeners
    if (this.removeWakeWordListener) this.removeWakeWordListener();
    if (this.removeCommandListener) this.removeCommandListener();
    if (this.removeStatusListener) this.removeStatusListener();
    if (this.removeErrorListener) this.removeErrorListener();
    
    // Stop listening if active
    if (this.isListening) {
      this.stopListening().catch(console.error);
    }
  }
}

export const voiceService = new VoiceService();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  voiceService.cleanup();
});
