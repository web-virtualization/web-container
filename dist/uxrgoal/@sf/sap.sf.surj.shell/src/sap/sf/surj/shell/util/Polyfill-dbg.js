sap.ui.define('sap/sf/surj/shell/util/Polyfill', [], function () {

    "use strict";

    /**
     * Polyfill for sap.base.Log. It is only available since 1.58
     */
    if (!sap.ui.require('sap/base/Log')) {
         sap.ui.requireSync('jquery.sap.global');
         sap.ui.define('sap/base/Log', function() {
            return jQuery.sap.log;
         });
    }
});
