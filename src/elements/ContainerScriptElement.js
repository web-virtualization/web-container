// import { findWebContainerElement } from '../utils/elementUtil';
import { ContainerBaseElement } from './ContainerBaseElement';

export class ContainerScriptElement extends ContainerBaseElement {
  constructor() {
    super();
  }

  async onInit() {
    this.style.display = 'none';
    let textContent = this.textContent;
    if (!textContent) {
      const scriptUrl = this.getAttribute('src');
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

    const scriptContext = this.webContainer.getPlugin('scriptContext');
    scriptContext.execute(textContent, this);
  }
}
