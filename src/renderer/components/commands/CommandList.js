import { CommandItem } from './CommandItem';

export class CommandList {
  constructor(containerId, commands = []) {
    this.container = document.getElementById(containerId);
    this.commands = commands;
  }

  update(commands) {
    this.commands = commands;
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.commands.forEach(command => {
      const commandItem = new CommandItem(command);
      this.container.appendChild(commandItem.render());
    });
  }

  addCommand(command) {
    this.commands.push(command);
    this.render();
  }

  removeCommand(commandId) {
    this.commands = this.commands.filter(cmd => cmd.id !== commandId);
    this.render();
  }
}
