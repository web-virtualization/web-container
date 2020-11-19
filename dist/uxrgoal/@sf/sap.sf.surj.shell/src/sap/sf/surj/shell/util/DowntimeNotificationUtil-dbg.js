sap.ui.define([
    'sap/sf/surj/shell/util/DeferredUtil',
    'sap/m/Dialog',
    'sap/m/Button',
    'sap/ui/core/HTML'
], function(DeferredUtil, Dialog, Button, HTML) {
    return {
        show: function(oSettings) {
            if (oSettings) {
                var sFromDate = oSettings.fromDate;
                var sToDate = oSettings.toDate;
                DeferredUtil.whenUI5LibraryCSSReady().done(function() {
                    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
                    var aHtml = [
                        '<div>',
                            '<div class="time bottompad15">', rb.getText('COMMON_DOWNTIME_TIME_WINDOW', [sFromDate, sToDate]), '</div>',
                            '<div class="bottompad15">', oSettings.text || rb.getText('COMMON_DOWNTIME_NOTIFY_TEXT1'), '</div>',
                            '<div class="bottompad15">', oSettings.text2 || rb.getText('COMMON_DOWNTIME_NOTIFY_TEXT2'), '</div>',
                        '</div>'
                    ];
                    var oDialog = new Dialog({
                        title: oSettings.title || rb.getText('COMMON_DOWNTIME_NOTIFY_TITLE'),
                        state: 'Warning',
                        contentWidth: '550px',
                        content: [
                            new HTML({
                                content: aHtml.join('')
                            })
                        ],
                        buttons: [
                            new Button({
                                text: rb.getText("COMMON_BTN_Continue"),
                                press: function() {
                                    oDialog.close();
                                }
                            })
                        ]
                    }).addStyleClass('surjDowntimeNotification').open();
                });
            }
        }
    };
});