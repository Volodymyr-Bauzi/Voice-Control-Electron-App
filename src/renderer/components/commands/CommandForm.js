export class CommandForm {
  constructor() {
    this.onSubmit = () => {};
    this.onCancel = () => {};
  }

  setOnSubmit(callback) {
    this.onSubmit = callback;
  }

  setOnCancel(callback) {
    this.onCancel = callback;
  }

  getFormData() {
    return {
      phrase: document.getElementById('command-phrase').value,
      type: document.getElementById('command-type').value,
      action: this._getActionValue(),
      path: document.getElementById('app-path')?.value || ''
    };
  }

  _getActionValue() {
    const type = document.getElementById('command-type').value;
    switch (type) {
      case 'app':
        return document.getElementById('app-path').value;
      case 'keyboard':
        return document.getElementById('keyboard-action').value;
      case 'system':
        return document.getElementById('system-action').value;
      default:
        return '';
    }
  }

  updateTypeUI() {
    const type = document.getElementById('command-type').value;
    document.getElementById('app-action-group').style.display = type === 'app' ? 'block' : 'none';
    document.getElementById('keyboard-action-group').style.display = type === 'keyboard' ? 'block' : 'none';
    document.getElementById('system-action-group').style.display = type === 'system' ? 'block' : 'none';
  }

  render() {
    const form = document.createElement('form');
    form.id = 'command-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="command-phrase">Voice Command:</label>
        <input type="text" id="command-phrase" required>
      </div>
      <div class="form-group">
        <label for="command-type">Command Type:</label>
        <select id="command-type" required>
          <option value="app">Application</option>
          <option value="keyboard">Keyboard Shortcut</option>
          <option value="system">System Action</option>
        </select>
      </div>
      <div id="app-action-group" class="action-group">
        <div class="form-group">
          <label for="app-path">Application Path:</label>
          <div class="input-group">
            <input type="text" id="app-path" readonly>
            <button type="button" id="browse-app-btn">Browse</button>
          </div>
        </div>
      </div>
      <div id="keyboard-action-group" class="action-group" style="display: none;">
        <div class="form-group">
          <label for="keyboard-action">Keyboard Action:</label>
          <select id="keyboard-action">
            <option value="copy">Copy</option>
            <option value="paste">Paste</option>
            <option value="cut">Cut</option>
            <option value="undo">Undo</option>
            <option value="redo">Redo</option>
          </select>
        </div>
      </div>
      <div id="system-action-group" class="action-group" style="display: none;">
        <div class="form-group">
          <label for="system-action">System Action:</label>
          <select id="system-action">
            <option value="shutdown">Shutdown</option>
            <option value="restart">Restart</option>
            <option value="sleep">Sleep</option>
            <option value="logout">Logout</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit">Save</button>
        <button type="button" id="cancel-command">Cancel</button>
      </div>
    `;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.onSubmit(this.getFormData());
    });

    document.getElementById('command-type').addEventListener('change', () => this.updateTypeUI());
    document.getElementById('cancel-command').addEventListener('click', () => this.onCancel());

    // Initialize the form UI
    this.updateTypeUI();

    return form;
  }
}
