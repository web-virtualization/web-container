import { VWindow } from '../virtualization/VWindow';

export class ScriptContext {

  static instances = {};

  onInit() {
    this._globalThis = new VWindow(this.webContainer);
  }

  execute(scriptContent, node) {
    node = node || this.webContainer.containerElement.shadowRoot;
    const scriptElement = window.document.createElement('script');
    scriptElement.type = 'text/javascript';
    scriptElement.textContent = `(function(${this.formalParameters}) {
      'use strict';
      ${scriptContent};
    }).apply(${this.globalThisExpress},${this.actualParametersExpress})`;

    try {
      node.appendChild(scriptElement);
      // node.removeChild(scriptElement);
    } catch (err) {
      console.error(error);
    }
  }

  get globalThis() {
    return this._globalThis;
  }

  get globalThisExpress() {
    return `window.WebContainer.instances['${this.webContainer.instanceId}'].scriptContext.globalThis`;
  }

  get formalParameters() {
    return Object.keys(this._globalThis);
  }

  get actualParameters() {
    return Object.values(this._globalThis);
  }

  get actualParametersExpress() {
    return `window.WebContainer.instances['${this.webContainer.instanceId}'].scriptContext.actualParameters`;
  }
}
