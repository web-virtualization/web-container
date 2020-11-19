/**
 * @namespace
 * @name sap.sf.surj.shell.util.AjaxServiceError
 */
sap.ui.define('sap/sf/surj/shell/util/AjaxServiceError', [
    'sap/m/BusyIndicator',
    'sap/m/Dialog',
    'sap/m/List',
    'sap/m/StandardListItem',
    'sap/m/TextArea',
    'sap/m/Button',
    'sap/ui/core/HTML',
    'sap/ui/core/InvisibleText',
    'sap/sf/surj/shell/controls/Container',
    'sap/sf/surj/shell/util/DeferredUtil',
    'jquery.sap.global'], function(BusyIndicator, Dialog, List, StandardListItem, TextArea, Button, HTML, InvisibleText, Container, DeferredUtil, $) {

    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
    var oCore = sap.ui.getCore();

    var AjaxServiceError = {

        /**
         * for unit test overwrite purpose
         */
        forceAjaxSearchResultKey: null,

        generalError: function (errorInfo, exception) {

            if (errorInfo && exception) {

                if (this.forceAjaxSearchResultKey) {
                    exception.fingerprint = this.forceAjaxSearchResultKey;
                }

                var uriEncodedErrorId = encodeURIComponent(exception.errorId);
                var uriEncodedFingerprint = encodeURIComponent(exception.fingerprint);
                var uriEncodedTimestamp = encodeURIComponent(exception.timestamp);

                var gotoUrlAction = 'sap.sf.surj.shell.util.AjaxServiceError.gotoSupportDocSearchUrl(\'' + uriEncodedErrorId + '\',\'' + uriEncodedFingerprint + '\',\'' + uriEncodedTimestamp + '\')';
                var linkHTML = rb.getText('COMMON_ERROR_FIND_ARTICLE', gotoUrlAction);

                var title = rb.getText('COMMON_Error');
                var strTrySearch = (exception.customizedBody ? ("<span>" + exception.customizedBody + ' </span><br />') : '');

                strTrySearch += rb.getText('COMMON_AjaxService_Error_Try_Search', uriEncodedFingerprint);
                var strShowMore = rb.getText('COMMON_AjaxService_Show_More');

                var ajaxServiceErrorShowMore = new HTML('ajaxServiceErrorShowMore', {
                    content: strShowMore,
                    preferDOM: false
                });
                var descForAjaxServiceErrorDetailCode = new InvisibleText({
                    text: rb.getText('COMMON_AjaxService_Error_Details_Description')
                }).toStatic();

                var ajaxServiceErrorDetailCode = new TextArea('ajaxServiceErrorDetailCode', {
                    value: errorInfo,
                    rows: 1,
                    width: '500px',
                    height: '100px',
                    editable: false,
                    visible: false,
                    ariaLabelledBy: descForAjaxServiceErrorDetailCode
                });

                var oContent = [
                    new Container('docSearchContainer', {
                        content: [
                            new HTML('promptUserText', {
                                content: strTrySearch,
                                preferDOM: false
                            }),
                            new Container('docSearch', {
                                content: [
                                    new BusyIndicator('ajaxServiceErrorSearchBusyIndicator', {
                                        visible: false
                                    }).addStyleClass('ajaxServiceErrorSearchBusyIndicator')
                                ]
                            })
                        ]
                    }),
                    ajaxServiceErrorShowMore,
                    ajaxServiceErrorDetailCode
                ];
                var title = rb.getText('COMMON_Error');
                this.useUI5Dialog(oContent, title);

            } else {
                if (errorInfo) {
                    //give a generic error Msg. External site like RCM won't hive default errorMsg here.
                    var defaultMsg = rb.getText('COMMON_AJAX_EXCEPTION_CONVERTER_ERROR');

                    prompt(defaultMsg, errorInfo);
                } else {
                    alert(rb.getText('COMMON_AJAX_DEFAULT_ERROR'));
                }
            }
        },
        /**
         * bring out UI5 dialog
         * @param oContent
         */
        useUI5Dialog: function (oContent, title) {
            var oDialog = oCore.byId('ajaxErrorDialog');
            if (!oDialog) { // Helps not to open multiple dialogs - for autocomplete usage
                oDialog = new Dialog('ajaxErrorDialog', {
                    title: title,
                    contentWidth: '600px',
                    resizable: false,
                    content: oContent,
                    endButton: new Button({
                        text: rb.getText('COMMON_Ok') || 'OK',
                        type: 'Emphasized',
                        press: function (oEvent) {
                            oEvent.getSource().getParent().close();
                        }.bind(this)
                    }),
                    afterClose: function () {
                        this.destroy();
                    }
                }).addStyleClass('globalAjaxErrDialog');
            }
            if (!oDialog.isOpen()) {
                oDialog.open();
            }
        },

        showErrorInfo: function () {
            oCore.byId('ajaxServiceErrorDetailCode').setVisible(true);
            oCore.byId('ajaxServiceErrorShowMore').setVisible(false);
        },
        invokeKBSearch: function (kbSearchKeyword) {

            var busyIndicator = oCore.byId('ajaxServiceErrorSearchBusyIndicator');
            busyIndicator.setVisible(true);

            DeferredUtil.invokeAjaxService({
                type: 'ajaxService',
                module: 'inproductsupport',
                serviceName: 'inProductSupportController',
                serviceMethod: 'getKnowledgeBaseSearchResult',
                arguments: [kbSearchKeyword]
            }).then(function (response) {

                busyIndicator.setVisible(false);

                failed = true;
                if (response && response.data) {
                    var obj = JSON.parse(response.data);
                    //API provider could give fail message 
                    if (obj.status == 'success') {
                        var items = obj.result.results['results'];
                        if (items.length > 0) {
                            var strFoundKBA = rb.getText('COMMON_AjaxService_Found_KBA');
                            oCore.byId('promptUserText').setContent(strFoundKBA);

                            var oList = new List('docLinks').addStyleClass('sapUiSizeCompact');


                            //we only care top 2 results. This is a PM & UX decision
                            for (var i = 0; i < items.length && i < 2; i++) {
                                var item = items[i];
                                oList.addItem(
                                    new sap.m.StandardListItem({
                                        title: item['TITLE'],
                                        description: item['DESCRIPTION'],
                                        info: item['USERURL'],
                                        type: "Navigation",
                                        press: function (oEvent) {
                                            var url = oEvent.getSource().getInfo();
                                            if (url) {
                                                window.open(url, '_blank', 'location=1,menubar=1,personalbar=1,resizable=1,scrollbars=1,status=1,toolbar=1');
                                            }
                                        }
                                    })
                                );
                            }
                            oList.placeAt('docSearch');

                            failed = false;
                        } else {
                            failed = true;
                        }
                    }
                }
            }).done(function (response) {
                busyIndicator.setVisible(false);

                if (failed) {
                    oCore.byId('docSearch').setVisible(false);
                    //Use this as a backup for whatever reason no documentation was found
                    var strNoSolution = rb.getText('COMMON_AjaxService_NO_RESULT');
                    oCore.byId('promptUserText').setContent(strNoSolution);
                    this.showErrorInfo();
                }
            }).fail(function (sErrorMessage) {
                failed = true;

            });
        }
    };

    /**
     * open support Doc in new window, and also post logs
     * @param errorId
     * @param fingerprint
     * @param timestamp
     */
    AjaxServiceError.gotoSupportDocSearchUrl = function (errorId, fingerprint, timestamp) {
        var docUrl = this.getSupportDocSearchUrl(fingerprint);
        window.open(docUrl, '_blank', 'location=1,menubar=1,personalbar=1,resizable=1,scrollbars=1,status=1,toolbar=1');
        AjaxServiceError.postLogForError(errorId, fingerprint, timestamp);
    };

    /**
     * return support doc urls
     * @param fingerprint
     * @returns {string}
     */
    AjaxServiceError.getSupportDocSearchUrl = function (fingerprint) {
        var searchTerm = fingerprint || '';
        //Use below URL and search terms for b1711. LOD-SF is a filter for all bizX support doc
        return 'https://search.sap.com/search.html?t=' + encodeURIComponent(searchTerm.trim()) + '%20LOD-SF';
    };

    AjaxServiceError.postLogForError = function (uriEncodedErrorId, uriEncodedFingerprint, uriEncodedTimestamp) {
        var pageHeaderJsonData = window.pageHeaderJsonData;
        var companyId = (pageHeaderJsonData && pageHeaderJsonData.companyId);
        if (!companyId) {
            return;
        }
        //log a request here to track clicks
        var req = new XMLHttpRequest();
        var logUrl = '/public/theme-api/info/' + encodeURIComponent(companyId) + '?action=KBAFingerprint';
        if (uriEncodedErrorId) {
            logUrl += '&errorId=' + uriEncodedErrorId;
        }
        if (uriEncodedFingerprint) {
            logUrl += '&fingerprint=' + uriEncodedFingerprint;
        }
        if (uriEncodedTimestamp) {
            logUrl += '&timestamp=' + uriEncodedTimestamp;
        }

        req.open('GET', logUrl, true);
        req.send(null);
    };

    $.sap.setObject('sap.sf.surj.shell.util.AjaxServiceError', AjaxServiceError);
    return AjaxServiceError;

});