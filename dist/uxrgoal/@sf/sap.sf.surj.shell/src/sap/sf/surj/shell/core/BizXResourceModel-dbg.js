/**
 * @class
 * @extends sap.ui.core.Control
 * @name sap.sf.surj.shell.core.BizXResourceModel
 */
sap.ui.define('sap/sf/surj/shell/core/BizXResourceModel', [
           'jquery.sap.global',
           'sap/ui/model/resource/ResourceModel',
           'sap/sf/surj/shell/core/BizXResourceBundle'
          ], function($, ResourceModel, BizXResourceBundle) {
    "use strict";
    return ResourceModel.extend('sap.sf.surj.shell.core.BizXResourceModel', /** @lends sap.sf.surj.shell.core.BizXResourceModel.prototype */ {
        constructor : function() {
            this._bizxbundle = new BizXResourceBundle();
            ResourceModel.call(this, {
                bundleName : 'bizx',
                bundle : this._bizxbundle
            });
        },
        loadResourceBundle : function() {
            return this._bizxbundle;
        }
    });
});