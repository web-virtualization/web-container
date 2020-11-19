// const styleLinkReg = //g;

export class DocumentInitiator {
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
