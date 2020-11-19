// The A11yPreferences is copied from /ui/surj/js/Util.js
// Make sure to change both places if any changes are required

sap.ui.define('sap/sf/surj/shell/util/A11yPreferences', ['jquery.sap.global'], function($) {

    var A11yPreferences = /** @lends sap.sf.surj.shell.util.A11yPreferences */ {
        COLORVISION_UNKNOWN : 'unknown',
        COLORVISION_NORMAL : 'type0',
        LOWVISION_NORMAL : 'normal',
        LOWVISION_DARK : 'dark',
        LOWVISION_LIGHT : 'light',
        isSupported : function() {
            return !!(window.pageHeaderJsonData && window.pageHeaderJsonData.accessibilityPreferences);
        },
        /**
         * @return {Boolean} whether this instance is a standard version or not
         */
        isBlindnessSupportEnabled : function() {
            if (this.isSupported()) {
                return pageHeaderJsonData.accessibilityPreferences.blindnessSupport;
            } else {
                return false;
            }
        },
        /**
         * @return {Boolean}
         */
        isColorVisionEnabled : function() {
            if (this.isSupported() && window.pageHeaderJsonData.accessibilityPreferences.colorVisionType != null) {
                return (this.getColorVisionType() != this.COLORVISION_NORMAL);
            } else {
                return false;
            }
        },
        /**
         * @return {String}
         */
        getColorVisionType : function() {
            if (this.isSupported()) {
                var cv = pageHeaderJsonData.accessibilityPreferences.colorVisionType;
                if (this.COLORVISION_UNKNOWN == cv) {
                    // if it is unknown, then we should return the normal view.
                    return this.COLORVISION_NORMAL;
                } else {
                    return cv;
                }
            } else {
                return this.COLORVISION_NORMAL;
            }
        },
        isLowVisionEnabled : function() {
            if (this.isSupported() && window.pageHeaderJsonData.accessibilityPreferences.lowVisionType != null) {
                return pageHeaderJsonData.accessibilityPreferences.lowVisionType != this.LOWVISION_NORMAL;
            } else {
                return false;
            }
        },
        getLowVisionType : function() {
            if (this.isSupported()) {
                return pageHeaderJsonData.accessibilityPreferences.lowVisionType;
            } else {
                return this.LOWVISION_NORMAL;
            }
        },
        isKeyboardOnlyNavigationEnabled : function() {
            if (this.isSupported()) {
                return pageHeaderJsonData.accessibilityPreferences.keyboardOnlyNavigation;
            } else {
                return false;
            }
        }
    };
    $.sap.setObject('sap.sf.surj.shell.util.A11yPreferences', A11yPreferences);
    return A11yPreferences;
});