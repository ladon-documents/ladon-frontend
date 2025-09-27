
import * as monaco from 'monaco-editor';

class MonacoEditorWC extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.editor = null;
    this.isInitialized = false;
    
    // Default options
    this.defaultOptions = {
      value: '',
      language: 'javascript',
      theme: 'vs-dark',
      readOnly: false,
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      selectOnLineNumbers: true,
      roundedSelection: false,
      cursorStyle: 'line',
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
    };
  }

  static get observedAttributes() {
    return ['value', 'language', 'theme', 'readonly', 'options'];
  }

  connectedCallback() {
    this.render();
    this.initializeEditor();
  }

  disconnectedCallback() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isInitialized) return;

    switch (name) {
      case 'value':
        this.setValue(newValue || '');
        break;
      case 'language':
        this.setLanguage(newValue || 'javascript');
        break;
      case 'theme':
        this.setTheme(newValue || 'vs-dark');
        break;
      case 'readonly':
        this.setReadOnly(newValue === 'true');
        break;
      case 'options':
        try {
          const options = JSON.parse(newValue || '{}');
          this.updateOptions(options);
        } catch (e) {
          console.warn('Invalid options JSON:', e);
        }
        break;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 400px;
        }
        
        .monaco-editor-container {
          width: 100%;
          height: 100%;
          min-height: 400px;
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
        }
      </style>
      <div class="monaco-editor-container" id="editor-container"></div>
    `;
  }

  async initializeEditor() {
    const container = this.shadowRoot.getElementById('editor-container');
    
    // Warte kurz, damit das DOM fertig ist
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const options = {
      ...this.defaultOptions,
      value: this.getAttribute('value') || this.defaultOptions.value,
      language: this.getAttribute('language') || this.defaultOptions.language,
      theme: this.getAttribute('theme') || this.defaultOptions.theme,
      readOnly: this.getAttribute('readonly') === 'true',
      ...this.getOptionsFromAttribute()
    };

    this.editor = monaco.editor.create(container, options);
    this.isInitialized = true;

    // Event Listener für Änderungen
    this.editor.onDidChangeModelContent(() => {
      const currentValue = this.editor.getValue();
      this.dispatchEvent(new CustomEvent('valueChange', {
        detail: { value: currentValue }
      }));
    });

    // Resize Observer für automatisches Layout
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        if (this.editor) {
          this.editor.layout();
        }
      });
      resizeObserver.observe(this);
    }

    // Editor Ready Event
    this.dispatchEvent(new CustomEvent('editorReady', {
      detail: { editor: this.editor }
    }));
  }

  getOptionsFromAttribute() {
    try {
      const optionsAttr = this.getAttribute('options');
      return optionsAttr ? JSON.parse(optionsAttr) : {};
    } catch (e) {
      console.warn('Invalid options JSON:', e);
      return {};
    }
  }

  // Public API Methods
  setValue(value) {
    if (this.editor) {
      this.editor.setValue(value);
    } else {
      this.setAttribute('value', value);
    }
  }

  getValue() {
    return this.editor ? this.editor.getValue() : (this.getAttribute('value') || '');
  }

  setLanguage(language) {
    if (this.editor && this.editor.getModel()) {
      monaco.editor.setModelLanguage(this.editor.getModel(), language);
    }
    this.setAttribute('language', language);
  }

  getLanguage() {
    return this.getAttribute('language') || 'javascript';
  }

  setTheme(theme) {
    if (this.editor) {
      monaco.editor.setTheme(theme);
    }
    this.setAttribute('theme', theme);
  }

  getTheme() {
    return this.getAttribute('theme') || 'vs-dark';
  }

  setReadOnly(readOnly) {
    if (this.editor) {
      this.editor.updateOptions({ readOnly });
    }
    this.setAttribute('readonly', readOnly.toString());
  }

  isReadOnly() {
    return this.getAttribute('readonly') === 'true';
  }

  updateOptions(options) {
    if (this.editor) {
      this.editor.updateOptions(options);
    }
    this.setAttribute('options', JSON.stringify(options));
  }

  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  layout() {
    if (this.editor) {
      this.editor.layout();
    }
  }

  // Erweiterte API
  insertText(text, position) {
    if (this.editor) {
      const selection = this.editor.getSelection();
      const id = { major: 1, minor: 1 };
      const op = {
        identifier: id,
        range: position || selection,
        text: text,
        forceMoveMarkers: true
      };
      this.editor.executeEdits('insert-text', [op]);
    }
  }

  getSelectedText() {
    if (this.editor) {
      const selection = this.editor.getSelection();
      return this.editor.getModel().getValueInRange(selection);
    }
    return '';
  }

  replaceSelectedText(text) {
    if (this.editor) {
      const selection = this.editor.getSelection();
      const id = { major: 1, minor: 1 };
      const op = {
        identifier: id,
        range: selection,
        text: text,
        forceMoveMarkers: true
      };
      this.editor.executeEdits('replace-text', [op]);
    }
  }
}

// Web Component registrieren
customElements.define('ladon-editor', MonacoEditorWC);

export default MonacoEditorWC;
