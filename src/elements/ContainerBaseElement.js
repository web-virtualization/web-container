export class ContainerBaseElement extends HTMLElement {
  constructor() {
    super();

    this._hasInit = false;
    this._hasMounted = false;
    this.webContainer = null;
  }

  connectedCallback() {
    if (!this._hasInit) {

      // find the nearby webContainer
      if (!this.webContainer) {
        let targetNode = this.parentNode;
        while(targetNode) {
          if (targetNode.webContainer) {
            this.webContainer = targetNode.webContainer;
          }
          targetNode = targetNode.parentNode;
        }
      }

      if (!this.webContainer) return;

      if (typeof this.onInit === 'function') {
        this.onInit();
      }
      this._hasInit = true;

      if (!this._hasMounted) {
        if (typeof this.onMount === 'function') {
          this.onMount();
        }
        this._hasMounted = true;
      }
    }
  }

  disconnectedCallback() {
    if (this._hasMounted) {
      if (typeof this.onUnMount === 'function') {
        this.onUnMount();
      }
      this._hasMounted = false;
    }
  }
}
