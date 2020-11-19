
sap.ui.define('sap/sf/surj/shell/util/CookiePolicyUtil', [
        'jquery.sap.global',
        'sap/sf/surj/shell/util/DeferredUtil',
        'sap/m/Button',
        'sap/m/Text',
        'sap/m/Dialog'
    ], function($, DeferredUtil, Button, Text, Dialog) {

    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');

    var CookiePolicyUtil = {
        /**
         * Initialize the ShowMe functionality.
         */
        init : function() {
            if (!pageHeaderJsonData.userInfo.cookiePolicyShowed) {
                var cookiePolicyPopup = new Dialog({
                    contentWidth: '480px',
                    title: rb.getText('COMMON_Information'),
                    type: "Message",
                    icon: "sap-icon://message-information",
                    content: new Text({
                        text: rb.getText('COMMON_COOKIE_POLICY_CONTENT')
                    }),
                    beginButton: new sap.m.Button({
                        text: rb.getText('COMMON_Ok'),
                        press: function() {
                            cookiePolicyPopup.close();
                        }
                    }),
                    afterClose: function() {
                        var AJAX_SERVICE = {
                            type : 'ajaxService',
                            serviceName : 'cookiePreferencesController',
                            serviceMethod : 'saveCookiePreferences',
                            module: 'v4'
                        };
                        DeferredUtil.createDeferred(AJAX_SERVICE);
                    }
                });
                sap.ui.getCore().attachInit(function() {
                    cookiePolicyPopup.open();
                });
            }
        }
    };

    $.sap.setObject('sap.sf.surj.shell.util.CookiePolicyUtil', CookiePolicyUtil);
    return CookiePolicyUtil;
});