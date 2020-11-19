sap.ui.define('sap/sf/surj/shell/util/ProxyUtil', [
    'jquery.sap.global',
    'sap/m/Dialog',
    'sap/m/Label',
    'sap/m/Button',
    'sap/sf/surj/shell/controls/SearchInput',
    'sap/sf/surj/shell/util/DeferredUtil'
    ], function ($, Dialog, Label, Button, SearchInput, DeferredUtil) {
    /**
     * @inner
     * @param {String} sUserId
     */
    function proxyTo(sUserId) {
        if (window.TopNavLogout) {
            var sBaseUrl = $.sap.getObject('pageHeaderJsonData.defaultBaseUrl');
            if (sBaseUrl && (window.location.href.indexOf(sBaseUrl) != 0)) {
                sBaseUrl = null;
            }
            if (!sBaseUrl) {
                sBaseUrl = $.sap.getObject('pageHeaderJsonData.baseUrl') || '';
            }
            var oParams = {
                fbacme_o : 'options',
                opt_os : 'proxy',
                fbproxy_delegator : sUserId,
                fbproxy_sel_delegator_btn : 'Go'
            };
            var sUrl = sBaseUrl + '/acme?' + $.param(oParams);
            var sCrb = window.ajaxSecKey;
            if (sCrb) {
                sUrl += '&_s.crb=' + sCrb;
            }
            window.TopNavLogout.navigateAfterLoggingOutFromSPs(sUrl);
        } else {
            sap.ui.require(['sap/sf/surj/shell/util/TopNavLogout'], function() {
                if (window.TopNavLogout) {
                    proxyTo(sUserId);
                } else {
                    $.sap.log.error('Could not load TopNavLogout, proxy now impossible');
                }
            });
        }
    }

    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
    var oDialog, oSearchInput, oSelectedItem;
    var ProxyUtil = {
        showDialog : function() {
            if (!oDialog) {
                oSearchInput = new SearchInput({
                    alwaysBottom : true,
                    searchType : 'jsup',
                    settings : {
                        findtype : 'proxy'
                    },
                    liveChange : function() {
                        oSelectedItem = null;
                        oSearchInput.setValueState('None');
                    },
                    itemSelected : function(oEvt) {
                        oSelectedItem = oEvt.getParameter('selectedItem');
                        oSearchInput.setValueState('None');
                    }
                });
                oDialog = new sap.m.Dialog('bizXProxyDialog', {
                    title : rb.getText('PROXY_MODULE_AUTOCOMPLETE_TITLE'),
                    content : [ new sap.m.Label({
                        text : rb.getText('PROXY_MODULE_AUTOCOMPLETE_LABEL'),
                        labelFor : oSearchInput
                    }), oSearchInput ],
                    beginButton : new sap.m.Button({
                        text : rb.getText('COMMON_Cancel'),
                        press : function() {
                            oDialog.close();
                        }
                    }),
                    endButton : new sap.m.Button({
                        type: 'Emphasized',
                        text : rb.getText('COMMON_Ok'),
                        press : function() {
                            if (oSelectedItem) {
                              DeferredUtil.invokeAjaxService({
                                serviceName: 'guidedTourController',
                                serviceMethod: 'getProxyTimesforUser',
                                arguments: [oSelectedItem.UserId]
                              }).then(
                                function (cleanedUpText) {
                                    console.log('Callback of check proxy time', cleanedUpText);
                                    if (cleanedUpText) {
                                        oSearchInput.setValueStateText(cleanedUpText);
                                        oSearchInput.setValueState('Error');
                                        oSearchInput.focus();
                                    } else  {
                                        proxyTo(oSelectedItem.UserId);
                                        oDialog.close();
                                    }
                                },
                                function (message, error) {
                                  $.sap.log.error(error);
                                }
                              );
                            } else {
                                oSearchInput.setValueStateText(rb.getText('PROXY_MODULE_AUTOCOMPLETE_ERROR_MSG'));
                                oSearchInput.setValueState('Error');
                                oSearchInput.focus();
                            }
                        }
                    })
                });
                oDialog.open();
            } else {
                oSelectedItem = null;
                oSearchInput.setValueState('None');
                oSearchInput.setValue('');
                oDialog.open();
            }
        },
        proxyTo: proxyTo
    };
    window.proxySearchController = {
        show : ProxyUtil.showDialog
    };
    $.sap.setObject('sap.sf.surj.shell.util.ProxyUtil', ProxyUtil);
    return ProxyUtil;
});