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

export class ResourceLoader {
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
