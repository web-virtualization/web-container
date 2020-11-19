(function () {
  'use strict';

  class ContainerBaseElement extends HTMLElement {
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

  // const styleLinkReg = //g;

  class DocumentInitiator {
    async onInit() {

      const containerElement = this.webContainer.containerElement;
      const documentUrl = containerElement.getAttribute('src');
      if (!documentUrl) return;

      const resourceLoader = this.webContainer.getPlugin('resourceLoader');

      let contentText = null;

      try {
        contentText = await resourceLoader.load(documentUrl);
      } catch (err) {
        console.error(err);
      }

      if (!contentText) return;

      contentText = contentText
          .replaceAll('<script', '<wc-script')
          .replaceAll('</script>', '</wc-script>')
          .replaceAll('<body', '<wc-body')
          .replaceAll('</body>', '</wc-body>');


      const fragmentElement = window.document.createElement('template');
      fragmentElement.innerHTML = contentText;

      for (const element of fragmentElement.content.querySelectorAll('link[rel="stylesheet"]')) {
        // style
        const styleElement = window.document.createElement('wc-style');
        styleElement.setAttribute("href", element.getAttribute("href"));
        element.parentNode.replaceChild(styleElement, element);
      }

      requestAnimationFrame(async ()=> {
        // this line will call all children to init
        containerElement.shadowRoot.appendChild(fragmentElement.content, true);
        await resourceLoader.load();
        console.log('--- document load complete');
      });
    }
  }

  class ResourceCache {
  }

  class PermissionControl {
    hasPermission(permission) {
      const containerElement = this.webContainer.containerElement;
      const permissionKey = `permission-${permission}`;
      return (containerElement.hasAttribute(permissionKey) && containerElement.getAttribute(permissionKey) !== 'false');
    }
  }

  class ResourceLoadItem {
    constructor(props) {
      this.url = props.url;
      this.baseUrl = props.baseUrl;
      this.loader = props.loader;

      this.loadCompleted = false;
      this.loadError = null;
      this.contentResult = null;

      this.loadResolveFn = null;
      this.loadRejectFn = null;
    }

    load() {
      return new Promise(async (resolve, reject)=>{
        this.loadResolveFn = resolve;
        this.loadRejectFn = reject;

        if (typeof this.url === 'string') {
          try {
            let baseUrl = this.baseUrl;
            if (baseUrl.endsWith('/')) {
              baseUrl = baseUrl.substring(0, -2);
            }

            let url = this.url;
            if (url.startsWith('./')) {
              url = url.substr(2);
            } else if (url.startsWith('/')) {
              url = url.substr(1);
            }

            const response = await window.fetch(`${baseUrl}/${url}`);
            this.contentResult = await response.text();
            this.loadError = null;
            this.loadCompleted = true;
          } catch (err) {
            this.contentResult = null;
            this.loadError = err;
            this.loadCompleted = true;
          }
        } else {
          // it just a empty resource.
          this.contentResult = null;
          this.loadError = null;
          this.loadCompleted = true;
        }
        // check completed
        const loaderQueue = this.loader.queue;
        while(loaderQueue.length > 0) {
          const currentLoadItem = loaderQueue[0];
          if (!currentLoadItem.loadCompleted) break;

          loaderQueue.shift();
          if (currentLoadItem.loadError) {
            currentLoadItem.loadRejectFn(currentLoadItem.loadError);
          } else {
            currentLoadItem.loadResolveFn(currentLoadItem.contentResult);
          }
        }
      });
    }
  }

  class ResourceLoader {
    constructor() {
      this.queue = [];
    }

    load(url) {
      const baseUrl = this.webContainer.containerElement.getAttribute('baseURL') || '';
      const resourceLoadItem = new ResourceLoadItem({
        url,
        baseUrl,
        loader: this,
      });
      this.queue.push(resourceLoadItem);
      return resourceLoadItem.load();
    }
  }

  class VDocument {
    constructor(webContainer) {
      const document = window.document;

      this.URL = document.URL;
      this.activeElement = document.activeElement;
      this.title = document.title;
      this.domain = document.domain;

      this.__proto__ = window.document.createElement('div');

      this.getElementById = (id) => {
        return webContainer.containerElement.shadowRoot.getElementById(id);
      };
      this.querySelector = (...args)=> {
        return webContainer.containerElement.shadowRoot.querySelector(...args);
      };

      this.createElement = (...args) => {
        console.log(args);
        return document.createElement(...args);
      };

      this.createTextNode = (...args) => {
        return document.createTextNode(...args);
      };

      this.createEvent = (...args) => {
        return document.createEvent(...args);
      };

      this.createDocumentFragment = (...args) => {
        return document.createDocumentFragment(...args);
      };

      this.createTreeWalker = (...args) => {
        return document.createTreeWalker(this.body, ...args.slice(1));
      };

      this.implementation = document.implementation;
      this.documentElement = this.body;
    }
  }

  class VWindow extends EventTarget {
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
        const targetTags = webContainer.containerElement.getAttribute('tags');
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
        });
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
      };
      this.assert = window.assert;
      this.atob = window.atob;
      this.btoa = window.btoa;

      this.cancelAnimationFrame = window.cancelAnimationFrame;
      this.cancelIdleCallback = window.cancelIdleCallback;
      this.clearInterval = window.clearInterval;
      this.clearTimeout = window.clearTimeout;
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

  class ScriptContext {

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
        node.removeChild(scriptElement);
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

  class WebContainer {
    static instances = {};

    constructor(containerElement) {
      this._isAttached = false;
      this._isDisposed = false;
      this._hasInit = false;
      this._domContentLoaded = false;

      this._containerElement = containerElement;

      this._instanceId = Math.random().toString(36).substr(2, 5);
      this._plugins = new Map();
    }

    get instanceId() {
      return this._instanceId;
    }

    init() {
      if (this._hasInit) return;
      this.onInit();
      this._plugins.forEach((plugin)=>{
        if (typeof plugin.onInit === 'function') {
          plugin.onInit();
        }
      });
      this._hasInit = true;
    }

    onInit() {
      this.containerElement.attachShadow({mode: 'open'});
      // this is support for webContainer in doom tree.
      this.containerElement.shadowRoot.webContainer = this;

      this.addPlugin('documentInitiator', new DocumentInitiator());
      this.addPlugin('permissionControl', new PermissionControl());
      this.addPlugin('resourceCache', new ResourceCache());
      this.addPlugin('resourceLoader', new ResourceLoader());
      this.addPlugin('scriptContext', new ScriptContext());
    }

    get containerElement() {
      return this._containerElement;
    }

    get attached() {
      return this._isActivated;
    }

    get domContentLoaded() {
      return this._domContentLoaded;
    }

    attach() {
      if (this._isDisposed) return;
      if (this._isAttached) return;
      WebContainer.instances[this._instanceId] = this;
      this._plugins.forEach((plugin)=>{
        if (typeof plugin.onAttach === 'function') {
          plugin.onAttach();
        }
      });
      this._isAttached = true;
    }

    detach() {
      if (this._isDisposed) return;
      if (!this._isAttached) return;
      this._plugins.forEach((plugin)=>{
        if (typeof plugin.onDetach === 'function') {
          plugin.onDetach();
        }
      });
      this._isAttached = false;
      delete WebContainer.instances[this._instanceId];
    }

    addPlugin(name, plugin) {
      if (this._isDisposed) return;
      if (this._plugins.has(name)) return;
      if (!plugin) return;
      plugin.webContainer = this;

      if (this._hasInit) {
        if (typeof plugin.onInit === 'function') {
          plugin.onInit();
        }
      }

      if (this._isAttached) {
        if (typeof plugin.onAttach === 'function') {
          plugin.onAttach();
        }
      }

      this._plugins.set(name, plugin);
      this[name] = plugin;

      return plugin;
    }

    getPlugin(name) {
      return this._plugins.get(name);
    }

    dispose() {
      if (!this._isDisposed) return;

      this._plugins.forEach((plugin)=>{
        if (typeof plugin.onDispose === 'function') {
          plugin.onDispose();
        }
      });

      this._plugins.clear();
      this._isDisposed = true;
    }
  }

  window.WebContainer = WebContainer;

  class WebContainerElement extends ContainerBaseElement {
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

  // import { findParentWebContainerElement } from '../utils/elementUtil';

  class ContainerStyleElement extends ContainerBaseElement {
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

  class ContainerBodyElement extends ContainerBaseElement {
    onInit() {
      const scriptContext = this.webContainer.getPlugin('scriptContext');
      scriptContext.globalThis.document.body = this;
    }
  }

  // import { findWebContainerElement } from '../utils/elementUtil';

  class ContainerScriptElement extends ContainerBaseElement {
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

  window.customElements.define('web-container', WebContainerElement);
  window.customElements.define('wc-body', ContainerBodyElement);
  window.customElements.define('wc-script', ContainerScriptElement);
  window.customElements.define('wc-style', ContainerStyleElement);

}());
