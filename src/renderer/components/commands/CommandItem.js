export class CommandItem {
  constructor(command) {
    this.command = command;
  }

  onEdit = () => {};
  onDelete = () => {};

  setOnEdit(callback) {
    this.onEdit = callback;
  }

  setOnDelete(callback) {
    this.onDelete = callback;
  }

  render() {
    const item = document.createElement('div');
    item.className = 'command-item';
    item.innerHTML = `
      <div class="command-phrase">${this.command.phrase}</div>
      <div class="command-type">${this.command.type}</div>
      <div class="command-actions">
        <button class="btn-edit" data-id="${this.command.id}">Edit</button>
        <button class="btn-delete" data-id="${this.command.id}">Delete</button>
      </div>
    `;

    item.querySelector('.btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      this.onEdit(this.command);
    });

    item.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this command?')) {
        this.onDelete(this.command.id);
      }
    });

    return item;
  }
}
