export class CommandModal {
  constructor() {
    this.onSave = () => {};
    this.onClose = () => {};
    this.isOpen = false;
  }

  setOnSave(callback) {
    this.onSave = callback;
  }

  setOnClose(callback) {
    this.onClose = callback;
  }

  open(command = null) {
    this.isOpen = true;
    this.currentCommand = command;
    this.modal = document.createElement('div');
    this.modal.className = 'modal';
    
    const form = new CommandForm();
    
    if (command) {
      // Populate form with command data for editing
      document.getElementById('command-phrase').value = command.phrase || '';
      document.getElementById('command-type').value = command.type || 'app';
      
      // Set the appropriate action value based on type
      if (command.type === 'app') {
        document.getElementById('app-path').value = command.action || '';
      } else if (command.type === 'keyboard') {
        document.getElementById('keyboard-action').value = command.action || 'copy';
      } else if (command.type === 'system') {
        document.getElementById('system-action').value = command.action || 'shutdown';
      }
      
      form.updateTypeUI();
    }
    
    form.setOnSubmit((data) => {
      this.onSave({
        ...data,
        id: command ? command.id : Date.now().toString()
      });
      this.close();
    });
    
    form.setOnCancel(() => this.close());
    
    this.modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${command ? 'Edit' : 'Add New'} Command</h2>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          ${form.render().outerHTML}
        </div>
      </div>
    `;
    
    document.body.appendChild(this.modal);
    
    // Add close button handler
    this.modal.querySelector('.close-modal').addEventListener('click', () => this.close());
    
    // Close when clicking outside the modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
    
    // Add keyboard event listener for Escape key
    this.keydownHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    
    document.addEventListener('keydown', this.keydownHandler);
  }
  
  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    document.removeEventListener('keydown', this.keydownHandler);
    
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    
    this.onClose();
  }
}
