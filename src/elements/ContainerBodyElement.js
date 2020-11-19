import { ContainerBaseElement } from './ContainerBaseElement';

export class ContainerBodyElement extends ContainerBaseElement {
  onInit() {
    const scriptContext = this.webContainer.getPlugin('scriptContext');
    scriptContext.globalThis.document.body = this;
  }
}
