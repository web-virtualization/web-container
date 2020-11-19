
import { WebContainerElement } from './elements/WebContainerElement';

import { ContainerStyleElement } from './elements/ContainerStyleElement';
import { ContainerBodyElement } from './elements/ContainerBodyElement';
import { ContainerScriptElement } from './elements/ContainerScriptElement';

window.customElements.define('web-container', WebContainerElement);
window.customElements.define('wc-body', ContainerBodyElement);
window.customElements.define('wc-script', ContainerScriptElement);
window.customElements.define('wc-style', ContainerStyleElement);
