export class SettingsForm {
  constructor() {
    this.onSave = () => {};
  }

  setOnSave(callback) {
    this.onSave = callback;
  }

  getSettings() {
    return {
      wakeWord: document.getElementById('wake-word-input').value,
      sensitivity: parseFloat(document.getElementById('sensitivity-slider').value),
      engine: document.getElementById('engine-select').value,
      startMinimized: document.getElementById('start-minimized').checked,
      startAtLogin: document.getElementById('start-at-login').checked,
      showNotifications: document.getElementById('show-notifications').checked
    };
  }

  updateUI(settings) {
    if (!settings) return;
    
    if (settings.wakeWord) {
      document.getElementById('wake-word-input').value = settings.wakeWord;
    }
    
    if (settings.sensitivity !== undefined) {
      document.getElementById('sensitivity-slider').value = settings.sensitivity;
      document.getElementById('sensitivity-value').textContent = settings.sensitivity.toFixed(2);
    }
    
    if (settings.engine) {
      document.getElementById('engine-select').value = settings.engine;
    }
    
    if (settings.startMinimized !== undefined) {
      document.getElementById('start-minimized').checked = settings.startMinimized;
    }
    
    if (settings.startAtLogin !== undefined) {
      document.getElementById('start-at-login').checked = settings.startAtLogin;
    }
    
    if (settings.showNotifications !== undefined) {
      document.getElementById('show-notifications').checked = settings.showNotifications;
    }
  }

  render() {
    const form = document.createElement('form');
    form.id = 'settings-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="wake-word-input">Wake Word:</label>
        <input type="text" id="wake-word-input" required>
      </div>
      
      <div class="form-group">
        <label for="sensitivity-slider">Sensitivity: <span id="sensitivity-value">0.5</span></label>
        <input type="range" id="sensitivity-slider" min="0" max="1" step="0.01" value="0.5">
      </div>
      
      <div class="form-group">
        <label for="engine-select">Speech Engine:</label>
        <select id="engine-select">
          <option value="vosk">Vosk (Offline)</option>
          <option value="web-speech">Web Speech API</option>
        </select>
      </div>
      
      <div class="form-group checkbox">
        <input type="checkbox" id="start-minimized">
        <label for="start-minimized">Start minimized</label>
      </div>
      
      <div class="form-group checkbox">
        <input type="checkbox" id="start-at-login">
        <label for="start-at-login">Start at login</label>
      </div>
      
      <div class="form-group checkbox">
        <input type="checkbox" id="show-notifications" checked>
        <label for="show-notifications">Show notifications</label>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn-primary">Save Settings</button>
      </div>
    `;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.onSave(this.getSettings());
    });

    // Update sensitivity value display when slider changes
    document.getElementById('sensitivity-slider').addEventListener('input', (e) => {
      document.getElementById('sensitivity-value').textContent = parseFloat(e.target.value).toFixed(2);
    });

    return form;
  }
}
