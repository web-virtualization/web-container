// import { findParentWebContainerElement } from '../utils/elementUtil';
import { ContainerBaseElement } from './ContainerBaseElement';

export class ContainerStyleElement extends ContainerBaseElement {
  async onInit() {
    this.style.display = 'none';
    let textContent = this.textContent;
    if (!textContent) {
      const scriptUrl = this.getAttribute('href');
      if (scriptUrl) {
        try {
          textContent = await this.webContainer.getPlugin('resourceLoader').load(scriptUrl);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      this.textContent = null;
    }

    if (!textContent) return;

    const styleElement = window.document.createElement('style');
    styleElement.textContent = `${textContent};`;
    this.appendChild(styleElement);
  }
}
