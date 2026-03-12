export function isWebComponentRegistered(tagName: string): boolean {
  if (!tagName || typeof customElements === 'undefined') {
    return false;
  }

  return customElements.get(tagName) !== undefined;
}
