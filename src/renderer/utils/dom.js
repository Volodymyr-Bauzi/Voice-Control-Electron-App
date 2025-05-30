// Helper functions for DOM manipulation
export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

export const createElement = (tag, className, content = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content) el.textContent = content;
  return el;
};

export const showElement = (element, show = true) => {
  if (element) {
    element.style.display = show ? '' : 'none';
  }
};

export const toggleElement = (element, force) => {
  if (element) {
    const show = force !== undefined ? force : element.style.display === 'none';
    showElement(element, show);
    return show;
  }
  return false;
};

export const addClass = (element, className) => {
  if (element) {
    element.classList.add(className);
  }
};

export const removeClass = (element, className) => {
  if (element) {
    element.classList.remove(className);
  }
};

export const toggleClass = (element, className, force) => {
  if (element) {
    element.classList.toggle(className, force);
  }
};

export const on = (element, event, handler, options) => {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
};

export const delegate = (parent, selector, event, handler) => {
  return on(parent, event, (e) => {
    if (e.target.matches(selector)) {
      handler(e);
    } else {
      const closest = e.target.closest(selector);
      if (closest && parent.contains(closest)) {
        handler(e);
      }
    }
  });
};
