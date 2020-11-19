import { DocumentInitiator } from './DocumentInitiator';
import { ResourceCache } from './ResourceCache';
import { PermissionControl } from './PermissionControl';
import { ResourceLoader } from './ResourceLoader';
import { ScriptContext } from './ScriptContext';

export class WebContainer {
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
    })
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
    })
    this._isAttached = true;
  }

  detach() {
    if (this._isDisposed) return;
    if (!this._isAttached) return;
    this._plugins.forEach((plugin)=>{
      if (typeof plugin.onDetach === 'function') {
        plugin.onDetach();
      }
    })
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


