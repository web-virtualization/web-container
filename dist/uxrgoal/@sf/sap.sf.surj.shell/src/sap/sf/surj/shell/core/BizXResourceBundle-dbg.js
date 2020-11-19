/**
 * A "fake" resource bundle that just routes everything through the MSGS
 * global variable on a BizX page written by SMRF.
 * 
 * @class
 * @implements jQuery.sap.util.ResourceBundle
 * @name sap.sf.surj.shell.core.BizXResourceBundle
 * @extends sap.ui.base.Object
 */

sap.ui.define('sap/sf/surj/shell/core/BizXResourceBundle', [
           'sap/ui/base/Object'
          ], function(Object) {
  "use strict";
    return Object.extend('sap.sf.surj.shell.core.BizXResourceBundle', /** @lends sap.sf.surj.shell.core.BizXResourceBundle.prototype */ {
        /**
         * Fetch a value from the MSGS global variable.
         * 
         * @param {string} key The key of the message
         * @param {Array.<string>} aArgs Variable list of values to format
         */
        getText : function(sKey, aArgs) {
            // Alias to prevent SMRF parsing errors, and to aid in minification
            var msgs = window.MSGS;
            return msgs && msgs[sKey] && msgs.get.apply(msgs, [ sKey ].concat(aArgs || [])) || '???' + sKey + '???';
        },

        /**
         * @return {Boolean}
         */
        hasText : function(sKey) {
            var msgs = window.MSGS;
            return msgs && msgs[sKey];
        },

        metadata : {
            interfaces : [ 'jQuery.sap.util.ResourceBundle' ],
            'final' : true
        }
    });
});