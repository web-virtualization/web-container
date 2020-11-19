import { ContainerBaseElement } from './ContainerBaseElement';
import { WebContainer } from '../container/WebContainer';

export class WebContainerElement extends ContainerBaseElement {
  constructor() {
    super();

    this.webContainer = new WebContainer(this);
  }

  onInit() {
    this.webContainer.init();
  }

  onMount() {
    this.webContainer.attach();
  }

  onUnMount() {
    this.webContainer.detach();
  }
}
