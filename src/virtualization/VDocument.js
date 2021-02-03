export class VDocument {
  constructor(webContainer) {
    const document = window.document;

    this.URL = document.URL;
    this.activeElement = document.activeElement;
    this.title = document.title;
    this.domain = document.domain;

    this.__proto__ = window.document.createElement('div');

    this.getElementById = (id) => {
      return webContainer.containerElement.shadowRoot.getElementById(id);
    }
    this.querySelector = (...args)=> {
      return webContainer.containerElement.shadowRoot.querySelector(...args);
    }

    this.createElement = (...args) => {
      return document.createElement(...args);
    }

    this.createTextNode = (...args) => {
      return document.createTextNode(...args);
    }

    this.createEvent = (...args) => {
      return document.createEvent(...args);
    }

    this.createDocumentFragment = (...args) => {
      return document.createDocumentFragment(...args);
    }

    this.createTreeWalker = (...args) => {
      return document.createTreeWalker(this.body, ...args.slice(1));
    }

    this.implementation = document.implementation;
    this.documentElement = this.body;
  }
}
