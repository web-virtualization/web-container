import { VDocument } from './VDocument'

export class VWindow extends EventTarget {
  constructor(webContainer) {
    super();
    this.initStdAPIs(webContainer);
    this.initStdClasses(webContainer);
    this.initStdInstances(webContainer);
  }

  // addEventListener(type, listener, options) {
  //   if (type === 'message') {
  //     window.addEventListener(type, listener, options);
  //     return;
  //   }

  //   super.addEventListener(type, listener, options);
  // }

  postContainerMessage(message, tag) {
    if (!message) return;
    if (!tag) return;

    Object.values(window.WebContainer.instances).forEach(webContainer => {
      const targetTags = webContainer.containerElement.getAttribute('message-topics');
      if (!targetTags) return;

      let isValidTarget = false;
      if (tag === '*' && targetTags === '*') {
        isValidTarget = true;
      } else {
        isValidTarget = targetTags.includes(tag);
      }
      if (!isValidTarget) return;

      if (typeof message === 'object') {
        message = JSON.stringify(message);
      }

      window.requestAnimationFrame(()=>{
        const evt = new Event("container-message");
        evt.data = message;
        webContainer.scriptContext.globalThis.dispatchEvent(evt);
      })
    });
  }

  // removeEventListener(type, listener, options) {
  //   if (type === 'message') {
  //     window.removeEventListener(type, listener, options);
  //     return;
  //   }
  //   super.removeEventListener(type, listener, options);
  // }

  initStdAPIs(webContainer) {
    // std api
    this.alert = (...args)=> {
      if (!webContainer.permissionControl.hasPermission('alert')) {
        throw new Error('Permission Error Of alert!');
      }
      window.alert(...args);
    }
    this.assert = window.assert;
    this.atob = window.atob;
    this.btoa = window.btoa;

    this.cancelAnimationFrame = window.cancelAnimationFrame;
    this.cancelIdleCallback = window.cancelIdleCallback;
    this.clearInterval = window.clearInterval;
    this.clearTimeout = window.clearTimeout
    this.confirm = window.confirm;
    this.customElements = window.customElements;

    this.fetch = window.fetch;

    this.getComputedStyle = window.getComputedStyle;
    this.getSelection = window.getSelection;
    // ++
    this.history = window.history;
    // this.indexedDB = window.indexedDB;
    // todo
    this.localStorage = window.localStorage;
    // todo
    this.matchMedia = window.matchMedia;
    this.moveBy = window.moveBy.bind(window);
    this.moveTo = window.moveTo.bind(window);
    // ++
    this.postMessage = window.postMessage.bind(window);
    this.prompt = window.prompt;
    this.requestAnimationFrame = window.requestAnimationFrame;
    this.requestIdleCallback = window.requestIdleCallback;

    this.scrollBy = window.scrollBy;
    this.scrollTo = window.scrollTo;
    this.setInterval = window.setInterval;
    this.setTimeout = window.setTimeout;
    this.console = window.console;
    this.decodeURI = window.decodeURI;
    this.encodeURI = window.encodeURI;
    this.decodeURIComponent = window.decodeURIComponent;
    this.encodeURIComponent = window.encodeURIComponent;
    this.escape = window.escape;
    this.isFinite = window.isFinite;
    this.isNaN = window.isNaN;
    this.parseFloat = window.parseFloat;
    this.parseInt = window.parseInt;
    this.undefined = window.undefined;
    this.unescape = window.unescape;
  }

  initStdClasses() {
    // keep upCase key from window to vWindow
    // Object.keys(window).forEach(key => {
    //   console.log(key);
    //   const firstCharCode = key.charCodeAt(0);
    //   if (firstCharCode < 65) return;
    //   if (firstCharCode > 90) return;
    //   this[key] = window[key];
    // })
    this.Symbol = window.Symbol;
    this.Node = window.Node;
    this.HTMLElement = window.HTMLElement;
    this.HTMLIFrameElement = window.HTMLIFrameElement;
    this.MouseEvent = window.MouseEvent;
    this.Text = window.Text;
    this.Comment = window.Comment;
    this.CDATASection = window.CDATASection;
    this.ProcessingInstruction = window.ProcessingInstruction;
    this.Object = window.Object;
    this.Document = window.Document;
    this.DocumentFragment = window.DocumentFragment;
    this.Element = window.Element;
  }

  initStdInstances(webContainer) {
    // std object
    // ++
    this.document = new VDocument(webContainer);
    this.location = window.location;
    // ++
    this.navigator = window.navigator;
    this.sessionStorage = window.sessionStorage;

    this.self = this;
    this.globalThis = this;
    this.window = this;
  }
}
