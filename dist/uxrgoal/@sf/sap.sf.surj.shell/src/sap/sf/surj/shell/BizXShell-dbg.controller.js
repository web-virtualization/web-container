sap.ui.define([
    'jquery.sap.global',
    'sap/ui/model/json/JSONModel'
], function ($, JSONModel) {

    return sap.ui.controller('sap.sf.surj.shell.BizXShell', {
        onInit: function() {
            var oCore = sap.ui.getCore();
            var oModel = oCore.getModel('pageHeader');
            if (!oModel && window.pageHeaderJsonData) {
                oModel = new JSONModel(window.pageHeaderJsonData);
                oCore.setModel(oModel, 'pageHeader');
            }
            this.getView().setModel(oModel, 'pageHeader');
        },

        showVersionInfo: function(oEvent) {
            var BizXHeaderController = window.BizXHeaderController;
            BizXHeaderController && BizXHeaderController.showVersionInfo(oEvent.getParameter("refocusRef"));
        }
    });

});