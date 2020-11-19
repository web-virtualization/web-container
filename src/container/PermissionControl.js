export class PermissionControl {
  hasPermission(permission) {
    const containerElement = this.webContainer.containerElement;
    const permissionKey = `permission-${permission}`;
    return (containerElement.hasAttribute(permissionKey) && containerElement.getAttribute(permissionKey) !== 'false');
  }
}
