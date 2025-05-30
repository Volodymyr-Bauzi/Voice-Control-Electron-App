export class StatusIndicator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.statusDot = this.container.querySelector('.status-dot');
    this.statusText = this.container.querySelector('.status-text');
    this.recognitionText = this.container.querySelector('.recognition-text');
    this.wakeWordText = this.container.querySelector('.wake-word-text');
  }

  updateStatus(state, message) {
    // Remove all status classes
    this.statusDot.classList.remove('listening', 'processing', 'error', 'inactive');
    
    // Add the appropriate status class
    if (state === 'listening') {
      this.statusDot.classList.add('listening');
      this.statusText.textContent = 'Listening...';
    } else if (state === 'processing') {
      this.statusDot.classList.add('processing');
      this.statusText.textContent = 'Processing...';
    } else if (state === 'error') {
      this.statusDot.classList.add('error');
      this.statusText.textContent = message || 'Error';
    } else {
      this.statusDot.classList.add('inactive');
      this.statusText.textContent = message || 'Ready';
    }
  }

  updateRecognitionText(text) {
    this.recognitionText.textContent = text;
  }

  updateWakeWordText(text) {
    this.wakeWordText.textContent = `Wake word: ${text}`;
  }
}
