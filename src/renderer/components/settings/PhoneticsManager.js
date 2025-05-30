export class PhoneticsManager {
  constructor() {
    this.onAdd = () => {};
    this.onDelete = () => {};
  }

  setOnAdd(callback) {
    this.onAdd = callback;
  }

  setOnDelete(callback) {
    this.onDelete = callback;
  }

  getInputValues() {
    return {
      word: document.getElementById('word-input').value.trim(),
      phonetic: document.getElementById('phonetic-input').value.trim()
    };
  }

  clearInputs() {
    document.getElementById('word-input').value = '';
    document.getElementById('phonetic-input').value = '';
  }

  updatePhoneticsList(phonetics) {
    const list = document.getElementById('phonetics-list');
    list.innerHTML = '';

    Object.entries(phonetics).forEach(([word, phonetic]) => {
      const item = document.createElement('div');
      item.className = 'phonetic-item';
      item.innerHTML = `
        <span class="word">${word}</span>
        <span class="phonetic">${phonetic}</span>
        <button class="btn-delete" data-word="${word}">Delete</button>
      `;

      item.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.onDelete(word);
      });

      list.appendChild(item);
    });
  }

  render() {
    const container = document.createElement('div');
    container.className = 'phonetics-container';
    container.innerHTML = `
      <h3>Custom Phonetics</h3>
      <div class="form-group">
        <label for="word-input">Word:</label>
        <input type="text" id="word-input" placeholder="e.g., gif">
      </div>
      <div class="form-group">
        <label for="phonetic-input">Phonetic Spelling:</label>
        <input type="text" id="phonetic-input" placeholder="e.g., jif">
      </div>
      <button type="button" id="add-phonetic-btn" class="btn-primary">Add Phonetic</button>
      <div id="phonetics-list" class="phonetics-list"></div>
    `;

    container.querySelector('#add-phonetic-btn').addEventListener('click', () => {
      const { word, phonetic } = this.getInputValues();
      if (word && phonetic) {
        this.onAdd(word, phonetic);
        this.clearInputs();
      }
    });

    return container;
  }
}
