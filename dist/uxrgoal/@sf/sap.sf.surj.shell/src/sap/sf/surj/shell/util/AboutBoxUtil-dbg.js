
sap.ui.define('sap/sf/surj/shell/util/AboutBoxUtil', [
        'jquery.sap.global',
        'sap/m/Dialog',
        'sap/m/Button',
        'sap/ui/core/HTML'
    ], function($, Dialog, Button, HTML) {

    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');

    var AboutBoxUtil = /** @lends sap.sf.surj.shell.util.AboutBoxUtil */ {
        /**
         * This implements the AboutBox with UI5, which will be nearly identical
         * to the fiori stylized AboutBox which uses JUIC.
         *
         * @param {String|Object} oConfig or contentId 
         * @param {HTMLElement=} refocusRef or nothing
         */
        open : function(oConfig) { // For backwards compatibility will also support 2 arguments: contentId, refocusRef, or 1 argument: oConfig
            var content, contentId, refocusRef;
            if (typeof oConfig == 'string') {
                contentId = oConfig;
                refocusRef = arguments[1];
            } else if (oConfig) {
                content = oConfig.content;
                contentId = oConfig.contentId;
                refocusRef = oConfig.refocusRef;
            }
            // Caller can pass the content, or an ID of an HTMLElement that contains the content
            if (!content && contentId) {
                content = $('#'+contentId).html();
            }
            function close() {
                oDialog.close();
                if (typeof refocusRef == 'string') {
                    refocusRef = $('#' + refocusRef);
                }
                if (typeof refocusRef.focus == 'function') {
                    refocusRef.focus();
                }
            }

            //We will check and see if Jam page has implement contentHandler function or systemInfoContentHandler function.
            //If so, we will call one of the function to replace the content.
            //contentHandler function will replace the entire content of the AboutBox Dialog
            //systemInfoContentHandler function will replace the system info area of the AboutBox Dialog
            if (window.AboutBox) {
                if(AboutBox.contentHandler) {
                    content = AboutBox.contentHandler();
                } else if (AboutBox.systemInfoContentHandler) {
                    var systemContent = AboutBox.systemInfoContentHandler();
                    content = content.replace(/<!-- BEGIN aboutBoxSystemInfo -->([<>\s\S\d\D]*)<!-- END aboutBoxSystemInfo -->/m,systemContent);
                }
            }

            var oDialog = new Dialog({
                contentWidth : '520px',
                contentHeight : '382px',
                title : rb.getText('COMMON_SF_ABOUT_BOX_TITLE'),
                content : new HTML({
                    content : content
                }),
                endButton : new Button({
                    text : rb.getText('COMMON_Close'),
                    press : close
                })
            });
            oDialog.open();
        }
    };

    $.sap.setObject('sap.sf.surj.shell.util.AboutBoxUtil', AboutBoxUtil);
    return AboutBoxUtil;
});