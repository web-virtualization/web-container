
sap.ui.define('sap/sf/surj/shell/util/ShowMeUtil', [
    'jquery.sap.global', 
    'sap/sf/surj/shell/util/DeferredUtil',
    'sap/sf/surj/shell/util/Util',
    'sap/sf/surj/shell/controls/ShowMeCallout'
    ], function ($, DeferredUtil, Util, ShowMeCallout) {

    "use strict";


    var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');

    // VARIABLES
    var popup, howToPopup, callout, modality, statusData, draft, showMeInfo, useDefaultContent, videoTitle, videoDesc, thumbId, thumbUrl, notAgainPref, hoverTimeoutId;
    // Note: These used to be like "this._popup" in sfShowMe
    // SFShowMe is a singleton, so we get rid of "this._" not required

    var showMeButtonReady = $.Deferred();

    // CONSTANTS
    var PLAY_POPUP_NAME = 'sfShowmePlay';
    var PLAY_WINDOW_SIZE = 'width=550,height=434';
    var RECORD_WINDOW_SIZE = 'width=550,height=380';
    var MANAGE_WINDOW_SIZE = 'width=550,height=590';

    var ShowMeUtil = {
        /**
         * Initialize the ShowMe functionality.
         */
        init : function() {
            var pageMetaData = window.pageHeaderJsonData;
            showMeInfo = pageMetaData && pageMetaData.showMeInfo;
            
            // UI-7977 Detect when ShowMe is not enabled on this page
            // The feature can be turned off
            // The uploadId is null when showMe is not appropriate
            if (!showMeInfo || !showMeInfo.featureEnabled || !showMeInfo.uploadId) {
                return;
            }
            
            notAgainPref = showMeInfo.notAgainPref;
            getStatus().done(function(oStatusData) {
                statusData = oStatusData;
                draft = isDraft(oStatusData);
                switch (oStatusData.state) {
                case 'NotExists':
                    if (showMeInfo.authorPerm) {
                        modality = 'author';
                        displayShowMeButton();
                        callout = new sap.sf.surj.shell.controls.ShowMeCallout({
                            modality: modality,
                            isMobile: isMobile()
                        });
                        if (shouldCalloutDisplay()) {
                            showCallout();
                        }
                    }
                    break;
                case 'Complete':
                    if (!draft || showMeInfo.authorPerm) {
                        modality = showMeInfo.authorPerm ? 'manage' : 'play';
                        thumbId = getVideoThumbId(oStatusData);
                        useDefaultContent = !oStatusData.application || oStatusData.application != showMeInfo.appId;
                        videoTitle = getVideoTitle(oStatusData);
                        videoDesc = getVideoDesc(oStatusData);
                        displayShowMeButton();
                        if (thumbId) {
                            signAPIUrl('redirect/' + thumbId + '/file.jpg').done(function(sThumbUrl) {
                                thumbUrl = sThumbUrl;
                                callout = new sap.sf.surj.shell.controls.ShowMeCallout({
                                    modality: modality,
                                    videoTitle: videoTitle,
                                    videoDesc: videoDesc,
                                    thumbUrl: thumbUrl,
                                    useDefaultContent: useDefaultContent,
                                    isMobile: isMobile()
                                });
                                if (shouldCalloutDisplay()) {
                                    showCallout();
                                }
                            });
                        }
                    }
                    break;
                case 'Uploading':
                case 'Processing':
                case 'Error':
                    // Only show processing/error states to authors
                    if (showMeInfo.authorPerm) {
                        modality = 'manage';
                        displayShowMeButton();
                    }
                    break;
                }
            });
        },

        handleNotAgain : function(flag) {
            handleNotAgain(flag);
        },

        // Added for unit testing
        showPopup : showPopup,
        _handleCOEvent: handleCOEvent,
        _resetPopup: function() {
            popup = null;
        }
    };

    function handleCOEvent(event) {
        switch (event.action) {
            case 'notAgain':
                handleNotAgain(event.flag);
                break;
            case 'manageShowMe':
                handleManageShowMe();
                break;
            case 'playShowMe':
                handlePlayShowMe();
                break;
            case 'recordShowMe':
                handleRecordShowMe();
                break;
            case 'playShowMeAuthorHelp':
                handlePlayShowMeAuthorHelp();
                break;
        }
        if (callout) {
            callout.close();
        }
    }

    function showCallout() {
        var showMeButton = sap.ui.getCore().byId('showMeButton');
        callout.setEventHandler(handleCOEvent);
        if (showMeButtonReady.state() == 'resolved') {
            callout.openBy(showMeButton);
        } else {
            showMeButtonReady.done(function() {
                callout.openBy(showMeButton);
            });
        }
    }

    /**
     * Determine if a Callout should display right away.
     * 
     * @inner
     * @return {Boolean}
     */
    function shouldCalloutDisplay() {
        return !notAgainPref && !hasBusyCookie();
    }
    
    var SHOW_ME_DIV_IDS = ['alt_subNavShowMe', 'subNavShowMe'];
    
    /**
     * @inner
     * @return {String}
     */
    function getShowMeDivId() {
        for (var i=0; i<SHOW_ME_DIV_IDS.length; i++) {
            var sDivId = SHOW_ME_DIV_IDS[i];
            if ($('#' + sDivId).length > 0) {
                return sDivId;
            }
        }
        return null;
    }

    /**
     * @inner
     */
    function displayShowMeButton() {
        var oCore = sap.ui.getCore();
        
        if (oCore.byId('showMeButton')) {
            return;
        }
        
        var oShowMeBtn = new sap.m.Button('showMeButton', {
            icon : 'sap-icon://play',
            tooltip : rb.getText('COMMON_SHOW_ME'),
            press : handleShowMe,
            customData: new sap.ui.core.CustomData({
                key: "help-id",
                value: 'bizxHeaderShowMeBtn',
                writeToDom: true
            })
        }).addStyleClass('showMeBtn');
        oShowMeBtn.onAfterRendering = function() {
            showMeButtonReady.resolve();
        };
        oShowMeBtn.attachBrowserEvent('mouseover', function () {
            if (callout && !callout.isOpen()) {
                hoverTimeoutId = setTimeout(function () {
                    showCallout();
                }, 2000);
            }
        });
        oShowMeBtn.attachBrowserEvent('mouseout', function () {
            if (hoverTimeoutId) {
                clearTimeout(hoverTimeoutId);
                hoverTimeoutId = null;
            }
        });
        var placed = false;
        if (showMeInfo.pageId == 'HOME_TAB') {
            // The Homepage has ShowMe in the Header
            var oHeader = oCore.byId('bizXShellCustomHeader');
            if (oHeader) {
                placed = true;
                if ($('.surjTopNavHeaderBar .sapMBarRight .company-logo').length > 0) {
                    /*
                     * If the company logo was found on the right side, then the
                     * show me button should be the second to last, not the
                     * last.
                     */
                    var iContentRightLength = oHeader.getContentRight().length;
                    oHeader.insertContentRight(oShowMeBtn, iContentRightLength - 1);
                } else {
                    oHeader.addContentRight(oShowMeBtn);
                }
            }
        } else {
            // Everyone else displays it in the Placemat Buttons
            var oPage = oCore.byId('bizXPage');
            if (oPage) {
                placed = true;
                oPage.addPlacematButton(oShowMeBtn);
            }
        }
        /*
         * If a standard UI5 place to put the button wasn't found, try to
         * manually render the button.
         */
        if (!placed) {
            var sDivId = getShowMeDivId();
            if (sDivId) {
                oShowMeBtn.addStyleClass('globalToolbarIcon');
                oShowMeBtn.placeAt(sDivId);
            }
        }
    }

    /**
     * @inner
     */
    function handleShowMe() {
        switch (modality) {
        case 'play':
            handlePlayShowMe();
            break;
        case 'manage':
            handleManageShowMe();
            break;
        case 'author':
            handleRecordShowMe();
            break;
        }
    }

    /**
     * @inner
     */
    function handleNotAgain(flag) {
        notAgainPref = flag;
        invokeService('setNotAgainFlag', {
            flag: JSON.stringify(flag)
        });
    }

    /**
     * @inner
     */
    function handlePlayShowMe() {
        if (popup && !popup.closed) {
            popup.focus();
            return;
        }
        createPopup(PLAY_POPUP_NAME, PLAY_WINDOW_SIZE, true);
        signWidgetUrl('widgets/playback').done(function(sUrl) {
            showPopup(PLAY_POPUP_NAME, PLAY_WINDOW_SIZE, true, false, sUrl);
            if (callout) {
                callout.close();
            }
        });
    }
    /**
     *  @inner
     */
    function handlePlayShowMeAuthorHelp() {
        if (howToPopup && !howToPopup.closed) {
            howToPopup.focus();
            return;
        }
        createPopup(PLAY_POPUP_NAME, PLAY_WINDOW_SIZE, true, true);
        signHowToVideoUrl().done(function(sUrl) {
            showPopup(PLAY_POPUP_NAME, PLAY_WINDOW_SIZE, true, true, sUrl);
            if (callout) {
                callout.close();
            }
        });
    }

    /**
     * @inner
     */
    function handleRecordShowMe() {
        showAuthorPopup('widgets/record', RECORD_WINDOW_SIZE);
    }

    /**
     * @inner
     */
    function handleManageShowMe() {
        showAuthorPopup('widgets/playback', MANAGE_WINDOW_SIZE);
    }

    /**
     * @inner
     */
    function showAuthorPopup(widget, size) {
        if (popup && !popup.closed) {
            popup.focus();
            return;
        }
        createPopup(showMeInfo.uploadId, size, true);
        signWidgetUrl(widget).done(function(sUrl) {
            var sWindowDimensions = windowDimensions();
            if (sWindowDimensions) {
                sUrl += '&d=' + sWindowDimensions;
            }
            sUrl += '&check_exists=1';
            showPopup(showMeInfo.uploadId, size, true, false, sUrl);
            if (callout) {
                callout.close();
            }
        });
    }

    /**
     * @inner
     */
    function createPopup(windowname, specs, replace, isHowToPopup) {
        /* Creates a blank popup immediately when user clicks on a button in Safari. It's not a good idea to open a popup asynchronously in
        _signWidgetUrl callback, because Safari considers asynchronosly opened popups as malicious and do not allow to open them.
        Returns null for non-Safari browsers. */
        if (Util.isSafari()) {
            var url = showMeInfo.baseUrl ? showMeInfo.baseUrl + '/widgets/loading' : 'about:blank';
            popup = showPopup(windowname, specs, replace, isHowToPopup, url);
        } else {
            popup = null;
        }
    }

    /**
     * @inner
     */
    function showPopup(windowname, specs, replace, isHowToPopup, url) {
        if (popup) {
            // it may be already opened (see comment on _createPopup method)
            popup.location = url;
            if (popup) {
                popup.focus();
            }
        } else {
            specs = 'status=0,toolbar=0,menubar=0,resizable=1,' + specs;
            if (isHowToPopup) {
                howToPopup = window.open(url, windowname, specs, replace);
                if (howToPopup) {
                    howToPopup.focus();
                }
            } else {
                popup = window.open(url, windowname, specs, replace);
                if (popup) {
                    popup.focus();
                }
            }
            if (showMeInfo && showMeInfo.authorPerm) {
                createBusyCookie();
            }
        }
    }

    /**
     * @inner
     * @return {String}
     */
    function windowDimensions() {
        if (typeof (window.screenX) != 'undefined') {
            return window.screenX + ',' + window.screenY + ',' + window.outerWidth + ',' + window.outerHeight;
        }
        // Removing support for old IE/Quirks mode, its not supported anymore
        return "";
    }

    /**
     * @inner
     * @param {String} sService
     * @return {Promise}
     */
    function signAPIUrl(sService) {
        return invokeService('signAPIUrl', {
            path : '/media/' + showMeInfo.appId + '/' + showMeInfo.uploadId + '/' + sService,
            uploadId : showMeInfo.uploadId,
            uploadIdHash : showMeInfo.uploadIdHash
        });
    }

    /**
     * @param {String} sServiceName
     * @return {Promise}
     */
    function signWidgetUrl(sServiceName) {
        var sPath = sServiceName + '/' + showMeInfo.appId + '/' + showMeInfo.uploadId;
        return showLoading(invokeService('signWidgetUrl', {
            path : sPath,
            uploadId : showMeInfo.uploadId,
            uploadIdHash : showMeInfo.uploadIdHash
        }).then(function(sUrl) {
            if (showMeInfo.userLocale) {
                sUrl += '&l=' + showMeInfo.userLocale;
            }
            if (isMobile()) {
                sUrl += '&layout=m';
            }
            return sUrl;
        }));
    }

    function signHowToVideoUrl() {
        return showLoading(invokeService('getHowToVideoUrl')
            .then(function(sUrl) {
               if (showMeInfo.userLocale) {
                sUrl += '&l=' + showMeInfo.userLocale;
               }
               return sUrl;
            }));
    }

    /**
     * @inner
     * @return {Promise}
     */
    function getStatus() {
        return signAPIUrl('status').then(function(sUrl) {
            if (sUrl === '') {
                return $.Deferred().reject();
            }
            sUrl += (sUrl.indexOf('?') >= 0 ? '&' : '?') + 'callback=?';
            return DeferredUtil.invokeJsonpService(sUrl);
        });
    }

    /**
     * A utility to invoke a show me service.
     * 
     * @inner
     * @param {String} sMethodName
     * @param {Object} oParams
     * @return {Promise}
     */
    function invokeService(sMethodName, oParams) {
        /*
         * Doing it this way to make it easier if we change the ShowMeController
         * to OData Service, or move this service information to the PageHeader
         * model instead.
         */
        var SHOWME_SERVICE = {
            type : 'ajaxService',
            module : 'showme',
            serviceName : 'showMeController'
        };
        var SHOWME_METHODS = {
            setNotAgainFlag : {
                serviceMethod : 'setNotAgainFlag',
                parameters : [ 'flag' ]
            },
            signAPIUrl : {
                serviceMethod : 'signAPIUrl',
                parameters : [ 'path', 'uploadId', 'uploadIdHash' ]
            },
            signWidgetUrl : {
                serviceMethod : 'signWidgetUrl',
                parameters : [ 'path', 'uploadId', 'uploadIdHash' ]
            },
            getHowToVideoUrl : {
                serviceMethod : 'getHowToVideoUrl'
            }
        };
        var oMethod = SHOWME_METHODS[sMethodName];
        var aArguments = [];
        $.each(oMethod.parameters || [], function(i, sAttr) {
            aArguments.push(oParams[sAttr]);
        });
        return DeferredUtil.invokeService($.extend({
            arguments : aArguments
        }, SHOWME_SERVICE, {
            serviceMethod : sMethodName
        }));
    }

    /**
     * @inner
     * @param {Object} oStatusData
     * @return {Boolean}
     */
    function isDraft(oStatusData) {
        return oStatusData.meta && oStatusData.meta.draft && oStatusData.meta.draft == 'true';
    }

    /**
     * @inner
     * @param {Object} oStatusData
     * @return {String}
     */
    function getVideoTitle(oStatusData) {
        // title only used in link that already does escaping
        return oStatusData.meta && oStatusData.meta.title || rb.getText('COMMON_SHOW_ME_DEFAULT_VIDEO_TITLE');
    }

    /**
     * @inner
     * @param {Object} oStatusData
     * @return {String}
     */
    function getVideoDesc(oStatusData) {
        // escape user entered markup
        return (oStatusData.meta && oStatusData.meta.description) ? oStatusData.meta.description : rb.getText('COMMON_SHOW_ME_WATCH_VIDEO');
    }

    /**
     * @inner
     * @param {Object} oStatusData
     * @param {String}
     */
    function getVideoThumbId(oStatusData) {
        var aFiles = oStatusData.files;
        if ($.isArray(aFiles)) {
            for (var i = 0; i < aFiles.length; i++) {
                var oNextFile = aFiles[i];
                if (oNextFile.type == 'image/jpeg' && parseInt(oNextFile.width) <= 300) {
                    return oNextFile.id;
                }
            }
        }
        return null;
    }

    /**
     * @return {Boolean}
     */
    function isMobile() {
        /*
         * TODO: How to know if this is "mobile"? Old code would use "iOS" or
         * "android" that's probably not correct. Using the Tablet/Phone CSS
         * classes for now, but that only checks the width of the device not if
         * it is really a tablet/phone.
         */
        var oHtml = $('html');
        return oHtml.hasClass('sapUiMedia-Std-Tablet') || oHtml.hasClass('sapUiMedia-Std-Phone');

    }

    var LOADING = 0;
    var BUSY_DIALOG;

    /**
     * @param {Promise}
     */
    function showLoading(oPromise) {
        sap.ui.require(['sap/m/BusyDialog'], function(BusyDialog) {
            if (oPromise.state() === 'pending') {
                LOADING++;
                if (!BUSY_DIALOG) {
                    BUSY_DIALOG = new BusyDialog();
                }
                BUSY_DIALOG.open();
                oPromise.always(function() {
                    if (--LOADING === 0) {
                        BUSY_DIALOG.close();
                    }
                });
            }
        });
        return oPromise;
    }

    /**
     * When some popup is opened, they are considered "busy" for 120 seconds,
     * and if the page refreshes the Callouts will not display within that
     * timeframe.
     * 
     * @inner
     */
    function createBusyCookie() {
        var dt = new Date();
        dt.setTime(dt.getTime() + 120000);
        document.cookie = 'showme-busy=true; expires=' + dt.toGMTString() + '; path=/';
    }

    /**
     * When some popup is opened, they are considered "busy" for 120 seconds,
     * and if the page refreshes the Callouts will not display within that
     * timeframe.
     * 
     * @return {Boolean}
     */
    function hasBusyCookie() {
        return !!readCookie('showme-busy');
    }

    /**
     * @param {String} name
     * @return {String}
     */
    function readCookie(name) {
        var nameEQ = name += '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ')
                c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    }

    $.sap.setObject('sap.sf.surj.shell.util.ShowMeUtil', ShowMeUtil);
    return ShowMeUtil;
});