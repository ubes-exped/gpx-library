export class VirtualNode {
  private constructor(
    private readonly element: () => Element,
    private readonly weakElement: () => Element | undefined = element,
  ) {}

  static fromNode(node: Element) {
    return new VirtualNode(() => node);
  }

  private weakChildElement(tag: string) {
    return this.weakElement()?.querySelector(`:scope > ${tag}`) ?? undefined;
  }

  private childElement(tag: string) {
    const parent = this.element();
    let element = parent.querySelector(`:scope > ${tag}`);
    if (!element) {
      element = document.createElementNS(parent.namespaceURI, tag);
      parent.prepend(element);
    }
    return element;
  }

  child(tag: string) {
    return new VirtualNode(
      () => this.childElement(tag),
      () => this.weakChildElement(tag),
    );
  }

  getValue() {
    const element = this.weakElement();
    if (!element?.hasChildNodes()) return null;
    else return element.textContent;
  }

  setValue(value: string | null) {
    if (value || this.weakElement()) {
      this.element().textContent = value;
    }
  }
}
