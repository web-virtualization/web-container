
sap.ui.define('sap/sf/surj/shell/BizXShell.view', [
    'jquery.sap.global',
    'sap/ui/core/Component',
    'sap/ui/core/ComponentContainer',
    'sap/ui/core/HTML',
    './controls/BizXApp',
    './controls/BizXPage',
    './controls/BizXShell',
    'sap/m/Text',
    'sap/m/library'
], function ($, Component, ComponentContainer, HTML, BizXApp, BizXPage, BizXShell, Text, mlibrary) {
    "use strict";

    var FIORI_3_HEADER = 3;

    /**
     * The BizXShell Main JSView which will be placed directly to the body.
     * 
     * @type {sap.ui.core.mvc.JSView}
     * @name sap/sf/surj/shell/BizXShell.view.js
     */
    sap.ui.jsview('sap.sf.surj.shell.BizXShell', /** @lends sap/sf/surj/shell/BizXShell.view.js */ {
        /**
         * @return {sap.sf.surj.shell.BizXShell}
         */
        createContent : function(oController) {
            this.addStyleClass('surjShellview');
            return new BizXShell('bizXShell', {
                appWidthLimited : '{pageHeader>/appWidthLimited}',
                app : new BizXApp({
                    backgroundColor : 'transparent',
                    pages : new BizXPage('bizXPage', {
                        enableScrolling: {
                            path: 'pageHeader>/headerVersion',
                            formatter: function(headerVersion) {
                               return headerVersion < FIORI_3_HEADER;
                            }
                        },
                        fullHeight : '{pageHeader>/fullHeight}',
                        containerCSS : '{pageHeader>/containerCSS}',
                        placematCSS : '{pageHeader>/placematCSS}',
                        customHeader : new ComponentContainer({
                            propagateModel: true,
                            name : 'sap.sf.surj.shell.component.header',
                            async : true,
                            manifest : true
                        }),
                        content : this.createModuleContent(oController),
                        footer : this.createFooter(oController)
                    })
                })
            });
        },

        /**
         * Create the content of the page, which is module specific.
         * 
         * @param {Object} oController
         * @return {Array.<sap.ui.core.Control>|sap.ui.core.Control}
         */
        createModuleContent : function(oController) {
            var oComp = Component.getOwnerComponentFor(this);
            var oCompData = oComp && oComp.getComponentData() || {};
            if (oCompData.content) {
                return oCompData.content;
            } else if (oCompData.name) {
                return new ComponentContainer(oCompData);
            } else if (typeof window.createModuleContent == 'function') {
                return createModuleContent(oController);
            } else {
                return new Text({
                    text : 'Override window.createModuleContent to customize this content'
                });
            }
        },

        /**
         * Create the footer.
         * 
         * @return {sap.ui.core.Control}
         */
        createFooter : function(oController) {
            var pageHeaderJsonData = window.pageHeaderJsonData;
            var sFooterMarkup = pageHeaderJsonData && pageHeaderJsonData.footer;
            if (sFooterMarkup) {
                return new HTML({content: sFooterMarkup});
            }
        },

        /**
         * @return {String}
         */
        getControllerName : function() {
            return 'sap.sf.surj.shell.BizXShell';
        }
    });
});