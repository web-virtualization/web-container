
sap.ui.define('sap/sf/surj/shell/util/AnimateUtil', [
        'jquery.sap.global'
    ], function($) {

    var AnimateUtil = /** @lends sap.sf.surj.shell.util.AnimateUtil */ {
        /**
         * do the body sliding.
         * 
         * @param {Object=} oOptions
         * @param {String=} oOptions.direction. either left or right. for now.
         * @param {String=} oOptions.size
         */
        doBodyTransition : function(oOptions) {
            this.htmlTransition = oOptions;
            var direction = (oOptions && oOptions.direction) || 'right';
            var size = (oOptions && oOptions.size) || 0;

            var html = jQuery('html');

            var animateOptions = {};
            animateOptions[direction == 'right' ? 'paddingRight' : 'paddingLeft'] = size;

            html.animate(animateOptions, 300, oOptions.callback);
            if (sap && sap.ui.getCore() && sap.ui.getCore().getModel('pageHeader') && sap.ui.getCore().getModel('pageHeader').getProperty('/options/ultraWideHeader')) {
                html.css('float', 'left');
                SFBodyEventDispatcher.handleBodyResize(false, true);
            }
        },
        /**
         * Create a right hand side empty space on HTML level
         * 
         * @param {Object=} width
         */
        createSideSpace : function (width, callback) {
            width = width || 0;
            var dir = $.sap.getObject('pageHeaderJsonData.langDir') || 'ltr';
            this.doBodyTransition({direction: dir == 'ltr'? 'right' : 'left', size: width, callback: callback});
        },
        /**
         * remove the right hand side empty space on HTML level
         * 
         * @param {Object=} width
         */
        resetSideSpace : function (callback) {
            var dir = $.sap.getObject('pageHeaderJsonData.langDir') || 'ltr';
            this.doBodyTransition({direction: dir == 'ltr'? 'right' : 'left', size: 0, callback: callback});
        },
        getHtmlOffset : function() {
            return (this.htmlTransition && this.htmlTransition.size) || 0;
        }
    };

    $.sap.setObject('sap.sf.surj.shell.util.AnimateUtil', AnimateUtil);
    return AnimateUtil;
});