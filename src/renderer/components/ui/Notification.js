export class Notification {
  constructor(containerId = 'notifications') {
    this.container = document.getElementById(containerId) || this.createContainer();
    this.timeout = 5000; // Default timeout in milliseconds
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'notifications';
    container.className = 'notifications';
    document.body.appendChild(container);
    return container;
  }

  show(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'notification-message';
    messageEl.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.remove(notification));
    
    notification.appendChild(messageEl);
    notification.appendChild(closeBtn);
    
    this.container.appendChild(notification);
    
    // Auto-remove after timeout
    const timeoutId = setTimeout(() => this.remove(notification), this.timeout);
    
    // Store timeout ID on the element for cleanup
    notification._timeoutId = timeoutId;
    
    // Pause auto-remove on hover
    notification.addEventListener('mouseenter', () => {
      clearTimeout(notification._timeoutId);
    });
    
    // Resume auto-remove when mouse leaves
    notification.addEventListener('mouseleave', () => {
      notification._timeoutId = setTimeout(() => this.remove(notification), this.timeout);
    });
    
    // Add show class after a small delay to trigger CSS animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
  }

  remove(notification) {
    if (!notification) return;
    
    // Clear any pending timeout
    if (notification._timeoutId) {
      clearTimeout(notification._timeoutId);
    }
    
    // Trigger fade out animation
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    // Remove from DOM after animation completes
    notification.addEventListener('transitionend', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, { once: true });
  }
  
  // Convenience methods for different notification types
  info(message) {
    this.show(message, 'info');
  }
  
  success(message) {
    this.show(message, 'success');
  }
  
  warning(message) {
    this.show(message, 'warning');
  }
  
  error(message) {
    this.show(message, 'error');
  }
}

// Create a global instance
export const notification = new Notification();
