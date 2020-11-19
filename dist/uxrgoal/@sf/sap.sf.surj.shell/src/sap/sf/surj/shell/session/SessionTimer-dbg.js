sap.ui.define([
    'jquery.sap.global',
    'sap/ui/Device',
    'sap/ui/base/EventProvider',
    'sap/ui/model/json/JSONModel',
    '../util/DeferredUtil',
    '../util/LinkUtil',
    '../util/Util',
    'jquery.sap.storage'
], function($, Device, EventProvider, JSONModel, DeferredUtil, LinkUtil, Util) {

    // ALIAS
    var Storage = $.sap.storage;

    // CONSTANTS
    var STORAGE_TYPE = 'local';
    var STORAGE_PREFIX = 'BizXSessionTimer';
    var USER_ACTIVITY_EVENTS = ['click', 'keypress'];
    var MINUTE = 60000, SECOND = 1000, UPCOMING_WARNING = 10000;
    var MIN_ESTIMATE_CHANGE = 100; // Minimum change in timeout estimate before events are sent
    var STORAGE_INTERVAL_TIME = SECOND; // Number of milliseconds between each local storage check
    var DEFAULT_TIME_TILL_WARNING = 10; // Default number of minutes before session expiration that a warning should appear
    var UPDATE_TITLE_FOR_WARNINGS = true; // TODO: If that code was a mistakenly orphaned, then make this flag true
    var BASE_SERVICE = {
        type : 'ajaxService',
        module : 'v4',
        serviceName : 'sessionTimeoutController',
        noASProxy : true
    };
    var SERVICES = { // All Ajax/OData services this timer uses
        CONFIG: {
            serviceMethod : 'getSessionTimeoutConfigs'
        },
        KEEP_ALIVE: {
            serviceMethod : 'keepAlive'
        },
        INVALIDATE: {
            serviceMethod : 'invalidateSession'
        }
    };

    // INNER STATE
    var _oEventHandlers = {};
    var _oObservable = new EventProvider();
    var _sWindowTitle;
    var _bUserInitiatedLogout;
    var _bAjaxListening;
    var _oDialogPromise;

    var _oTimerModel = new JSONModel({
        type: 'alive'
    });

    function _setInitialState() {
        _bUserInitiatedLogout = false;
        _bAjaxListening = false;
    }

    /**
     * Start the timer, but only initialize one time if this function is called more than once.
     * @inner
     */
    function start() {
        var oPromise = Timer._oInitPromise;
        if (!oPromise) {
            oPromise = Timer._oInitPromise = initialize().then(function() {
                Timer._bHasStarted = true;
                $.sap.log.debug('BizXSessionTimer initialized');
            }, function(reason) {
                if (typeof reason == 'object') {
                    console.error(reason);
                } else {
                    $.sap.log.error('BizXSessionTimer failure: ' + reason);
                }
                cleanup();
                return Promise.reject(reason);
            });
            // if whenStarted has been called and _fResolveStart has been set, resolve the start promise
            if (Timer._fResolveStart) {
                oPromise.then(Timer._fResolveStart, Timer._fRejectStart);
            }
        }
        return oPromise;
    }

    /**
     * Wait for the started promise, but don't actually start the session timer.
     * @return {Promise}
     */

    function whenStarted() {
        // if start method has been called before whenStarted method
        var result = Timer._oInitPromise;
        if (!result) {
            // if whenStarted has already been called before
            result = Timer._oPendingStartPromise;
            if (!result) {
                // if start method has not been called and whenStarted method is being called for the first time
                result = new Promise(function(fResolve, fReject) {
                    Timer._fResolveStart = fResolve;
                    Timer._fRejectStart = fReject;
                });
                Timer._oPendingStartPromise = result;
            }
        }
        return result;
    }

    /**
     * Initialize the SessionTimer.
     * @inner
     */
    function initialize() {
        _setInitialState();
        Timer._bDisableUI = !!Timer._bDisableUI || Util.isMessageServicePage();
        var bIsBaseDomain = Util.isRunningBaseDomain();
        var bEnabled = bIsBaseDomain || Util.isBaseDomainCORSEnabled();
        if (bEnabled) {
            var aPromises = [getTimeoutSettings().then(function(oSettings) {
                Timer._oSettings = oSettings;
            })];
            if (!bIsBaseDomain) {
                aPromises.push(Util.getMessageService().then(function(oMessageService) {
                    Timer._oMessageService = oMessageService;
                }));
            }
            return Promise.all(aPromises).then(function() {
                listenForAjax();
                if (bIsBaseDomain) {
                    startStoragePolling(Storage(STORAGE_TYPE, STORAGE_PREFIX));
                }
                var oMessageService = Timer._oMessageService;
                if (oMessageService) {
                    oMessageService.sendMessage('BizXSessionTimer');
                    oMessageService.attachEvent('updateTimeoutEstimate', function(oEvent) {
                        var aData = oEvent.getParameter('data');
                        var iTimeoutEstimate = aData && aData[1];
                        if (iTimeoutEstimate) {
                            updateTimeoutEstimate(iTimeoutEstimate);
                        }
                    });
                    oMessageService.attachEvent('logoutComplete', timeoutNow);
                } else {
                    reset();
                }
            });
        } else {
            return Promise.reject('disabled');
        }
    }

    /**
     * Stop the timer and cleanup.
     */
    function cleanup() {
        var iPollId = Timer._iPollId;
        if (iPollId != null) {
            Timer.clearInterval.call(null, iPollId);
            Timer._iPollId = null;
        }
        var iTickId = Timer._iTickId;
        if (iTickId != null) {
            Timer.clearTimeout.call(null, iTickId);
            Timer._iTickId = null;
        }
        var oMessageService = Timer._oMessageService;
        if (oMessageService) {
            oMessageService.disconnect();
            Timer._oMessageService = null;
        }
        closeUI();
        Timer._oInitPromise = Timer._bHasStarted = null;
    }

    /**
     * Start polling storage for any new time estimates that other windows may have stored using the same session.
     * This is important to coordinate the session timeout between different tabs.
     * @inner
     */
    function startStoragePolling(oStorage) {
        if (oStorage.isSupported()) {
            Timer._oStorage = oStorage;
            Timer._iPollId = Timer.setInterval.call(null, function() {
                var sStorageKey = getStorageKey();
                if (sStorageKey) {
                    var iStoredEstimate = oStorage.get(sStorageKey);
                    var iMyEstimate = Timer._iTimeoutEstimate;
                    // If we don't have an estimate, or the stored estimate is greater than the current estimate
                    // Then update the current estimate to be the stored estimate
                    if (iStoredEstimate == 'logout' || typeof iStoredEstimate == 'number' && (iMyEstimate == null || iStoredEstimate > iMyEstimate)) {
                        updateTimeoutEstimate(iStoredEstimate);
                    } else if (iMyEstimate != null) {
                        // Otherwise, the current estimate is "better" than the stored estimate, so update the stored estimate
                        oStorage.put(sStorageKey, iMyEstimate);
                    }
                }
            }, STORAGE_INTERVAL_TIME);
        }
    }

    /**
     * @inner
     * @return {String}
     */
    function getStorageKey() {
        return Util.getSessionRef();
    }

    /**
     * This is one clock tick of the SessionTimer. It is the heart of the timer. It will be called
     * often, any time some state of the Timer has changed, and it schedules itself to be executed again
     * for a time when it predicts that the state will change again.
     *
     * The session timer first is alive, then goes to a warning state with a countDown+interval, then finally
     * a timeout state. In the countDown phase, it starts out changing state every 1 minute, then goes to
     * every 1 second during the last 60 seconds.
     *
     * Any time the state changes, an event is fired on _oObservable.
     * @inner
     */
    function tick() {
        if (Timer._iTickId) {
            clearTimeout(Timer._iTickId);
            Timer._iTickId = null;
        }

        var oSettings = Timer._oSettings;
        var iCurrentTime = new Date().getTime();
        var bUserActive = false;
        if (Timer._bConsiderActivity && Timer._iLastUserActivity) {
            // The user is considered active if the number of milliseconds since the last recorded
            // activity is less than the number of milliseconds a session needs to expire.
            // Suppose the expire time is 30 minutes, then he is active if he clicked or typed within the last 30 minutes
            var iMsSinceActivity = iCurrentTime - Timer._iLastUserActivity;
            bUserActive = iMsSinceActivity < (oSettings.timeUntilExpires * SECOND);
        }

        var iTimeoutEstimate = Timer._iTimeoutEstimate;
        var bTimeout = iTimeoutEstimate == 'logout';
        var sType = bTimeout ? 'timeout' : 'alive';
        var sInterval, iCountDown;
        if (!bTimeout && iTimeoutEstimate > 0) {
            var iMsTillTimeout = iTimeoutEstimate - iCurrentTime;
            bTimeout = iMsTillTimeout <= 0;
            if (!bTimeout) {
                var iMinTillWarning = oSettings && oSettings.timeUntilWarning;
                if (iMinTillWarning > 0) {
                    var iMsTillWarning = iMsTillTimeout - (iMinTillWarning * MINUTE);
                    // A close call means the warning message needs to show in 10 seconds or less from now
                    // but it is not yet time to show the warning. A close call results in a "upcomingWarning" event
                    var bCloseCall = iMsTillWarning > 0 && iMsTillWarning <= UPCOMING_WARNING;
                    if (bCloseCall) {
                        _oObservable.fireEvent('upcomingWarning');
                    }
                    // If we should warn of a pending timeout
                    var iTimeTillTick;
                    if (iMsTillWarning <= 0) {
                        if (bUserActive) {
                            // If the user was active (see comment above) rather than warning of a pending timeout
                            // ping the server instead to keep the session alive
                            Timer._iLastUserActivity = null;
                            keepAlive();
                            return; // Do nothing on this tick since the session will extend
                        } else {
                            sType = 'warning';
                            iTimeTillTick = iMsTillTimeout > 2*MINUTE ? MINUTE : SECOND;
                            if (iMsTillTimeout < MINUTE) {
                                iCountDown = Math.round(iMsTillTimeout / SECOND);
                                sInterval = 's';
                            } else {
                                iCountDown = Math.round(iMsTillTimeout / MINUTE);
                                sInterval = 'm';
                            }
                        }
                    } else {
                        sType = 'alive';
                        iTimeTillTick = iMsTillTimeout - iMinTillWarning*MINUTE;
                        if (!bCloseCall) {
                            // If it wasn't a close call, the time till the next tick is reduced
                            // by 10 seconds, that way the next tick will result a close call
                            iTimeTillTick -= UPCOMING_WARNING;
                        }
                    }
                    Timer._iTickId = Timer.setTimeout.call(null, tick, iTimeTillTick);
                }
            }
        }

        if (_bUserInitiatedLogout) {
            sType = 'logout';
        } else if (bTimeout) {     
            sType = 'timeout';
        }
        
        var oParameters = {
            type: sType,
            countDown: iCountDown,
            interval: sInterval,
            disableUI: Timer._bDisableUI
        };

        // Stringify the state and compare to see if it changed
        var sState = JSON.stringify(oParameters);
        if (Timer._sState != sState) {
            Timer._sState = sState;
            _oObservable.fireEvent('stateChanged', oParameters);
        }
    }
    
    // Update the _oTimerModel any time the state changes
    // There are three separate event handlers for 'stateChanged' event. This is the first handler that is invoked when 'stateChanged' event is fired.
    _oObservable.attachEvent('stateChanged', function(oEvent) {
        var oParameters = oEvent.getParameters();
        var oPreviousParams = _oTimerModel.getProperty('/params');
        _oTimerModel.setProperty('/params', oParameters);

        // These are legacy events that outside integrations might use
        var sType = oParameters.type;
        if (sType == 'warning' && (!oPreviousParams || oPreviousParams.type != 'warning')) {
            _oObservable.fireEvent('sessionAboutToExpire');
        }
        if (sType == 'warning') {
            _oObservable.fireEvent('sessionWarning');
        }
        if (sType == 'timeout') {
            _oObservable.fireEvent('sessionTimedOut');
        }
    });

    /**
     * Reset the time estimate assuming the session has been extended right now.
     * @inner
     */
    function reset() {
        var oSettings = Timer._oSettings;
        if (oSettings) {
            var iTimeoutEstimate = new Date().getTime() + (oSettings.timeUntilExpires * SECOND);
            var iCurrentEstimate = Timer._iTimeoutEstimate;

            // Ignore reset calls that are too close together (within the minimum estimate change)
            if (typeof iCurrentEstimate != 'number' || Math.abs(iCurrentEstimate - iTimeoutEstimate) > MIN_ESTIMATE_CHANGE) {
                updateTimeoutEstimate(iTimeoutEstimate);
                if (Timer._oMessageService) {
                    Timer._oMessageService.sendMessage('updateTimeoutEstimate', iTimeoutEstimate);
                }
            }

            _oObservable.fireEvent('sessionExtended');
        }
    }

    /**
     * Update the tracker with an estimate for when the Session will expire.
     * @inner
     * @param {Long} iTimeoutEstimate
     *   The date&time for when the timeout should occur. Or the string "logout".
     */
    function updateTimeoutEstimate(iTimeoutEstimate, bSkipNotify) {
        if (iTimeoutEstimate != Timer._iTimeoutEstimate) {
            Timer._iTimeoutEstimate = iTimeoutEstimate;
            var oStorage = Timer._oStorage;
            if (oStorage) {
                oStorage.removeAll(); // Clear out any old estimates
                var sStorageKey = getStorageKey();
                sStorageKey && oStorage.put(sStorageKey, iTimeoutEstimate);
            }
            if (!bSkipNotify) {
                var oMessageService = Timer._oMessageService;
                if (oMessageService) {
                    oMessageService.sendMessage('updateTimeoutEstimate', iTimeoutEstimate);
                } else if (Util.isMessageServicePage()) {
                    PostMessageAPI.sendMessage('updateTimeoutEstimate', iTimeoutEstimate);
                }
            }
            _oObservable.fireEvent('timeoutEstimateChanged', {
                time: iTimeoutEstimate
            });
            tick();
        }
    }

    /**
     * Timeout the page right now, this is assuming the user has logged out.
     * @inner
     */
    function timeoutNow() {
        updateTimeoutEstimate('logout');
    }

    /**
     * Timeout the page right now, assuming that the user has logged out; but make sure that the timer is available first.
     * @inner
     */
    function timeoutNowPromise() {
        if (Timer._bHasStarted) {
            return Promise.resolve(timeoutNow());
        } else {
            return whenStarted().then(function() {
                return timeoutNow();
            });
        }
    }

    /**
     * Timeout the page right now, user has pressed logout.
     * @inner
     */
    function logoutNow() {
        _bUserInitiatedLogout = true;
        updateTimeoutEstimate('logout');
    }

    /**
     * Timeout the page right now, user has pressed logout; but make sure that the timer is available first.
     * @inner
     */
    function logoutNowPromise() {
        if (Timer._bHasStarted) {
            return Promise.resolve(logoutNow());
        } else {
            return whenStarted().then(function() {
                return logoutNow();
            });
        }
    }

    /**
     * Update the timer so that it will timeout after the given number of milliseconds.
     * This is a quick way to test the Timeout Dialog.
     *
     * @param {Integer} iMsTillTimeout
     *    The number of milliseconds until the timeout is estimated to happen.
     */
    function timeoutAfter(iMsTillTimeout) {
        updateTimeoutEstimate(new Date().getTime() + iMsTillTimeout);
    }

    /**
     * Update the timer so that it will timeout after the given number of milliseconds, but make sure first that the timer has started.
     *
     * @param {Boolean} bConsiderActivity
     */
    function timeoutAfterPromise(iMsTillTimeout) {
        if (Timer._bHasStarted) {
            return Promise.resolve(timeoutAfter(iMsTillTimeout));
        } else {
            return whenStarted().then(function() {
                return timeoutAfter(iMsTillTimeout);
            });
        }
    }

    /**
     * Start listening for ajax calls on BizXDomain, but don't start listening more than once.
     * @inner
     */
    function listenForAjax() {
        if (!_bAjaxListening) {
            _bAjaxListening = true;
            addSessionExtendCallback(reset);
        }
    }

    /**
     * Add a callback whenever some Ajax call is sent on the BizX domain which likely has extended the session.
     *
     * @inner
     * @param {Function} fCallback
     */
    function addSessionExtendCallback(fCallback) {
        if (window.AjaxService) {
            AjaxService.addPreHook(fCallback);
        }
        // If AjaxService is not available then use ajaxSend to be notified of an ajax request
        $(document).ajaxSend(function(oEvent, jqXHR, oOptions) {
            var sReqUrl = oOptions && oOptions.url;
            // If this url starts with the base domain.
            if (sReqUrl) {
                var sOrigin = sReqUrl;
                if ((sReqUrl.indexOf('/') == 0 && sReqUrl.indexOf('//') != 0) || sReqUrl.indexOf("./") == 0) {
                    sOrigin = Util.getLocationOrigin();
                }
                // Only certain paths are considered to extend session
                if (Util.isBizXDomain(sOrigin) && /^(?:https?:\/\/[^\/]*|\/\/[^\/]*|)\/(sf|xi|odata)\/.*/.test(sReqUrl)) {
                    fCallback();
                }
            }
        });
    }
    // There are three separate event handlers for 'stateChanged' event. This is the second handler that is invoked when 'stateChanged' event is fired.
    _oObservable.attachEvent('stateChanged', function(oEvent) {
        var oParameters = oEvent.getParameters();
        var sType = oParameters.type;
        if (!oParameters.disableUI) {
            if (sType == 'alive' || sType == 'logout') {
                closeUI();
            } else {
                getTimerDialog().then(function(oDialog) {
                    if (!Timer._bDisableUI) {
                        oDialog.open();
                    }
                });
            }
        } else {
            closeUI();
        }
    });

    /**
     * Create the Warning Dialog.
     * @inner
     * @return {Promise.<sap.m.Dialog>} A promise to create the Dialog.
     */
    function getTimerDialog() {
        return _oDialogPromise = _oDialogPromise || new Promise(function(res) {
            sap.ui.require(['sap/ui/model/resource/ResourceModel'], function(ResourceModel) {
                res(sap.ui.xmlfragment('sap.sf.surj.shell.session.SessionTimer', {
                    formatTimerHTML: function(oParameters, sAddonMessage) {
                        var sMessage = '';
                        var oRb = getResourceBundle();
                        var sType = oParameters.type;
                        if (sType == 'timeout') {
                            sMessage = oRb.getText('COMMON_SESSION_EXPIRED_MESSAGE_DETAILS');
                            if (sAddonMessage) {
                                sMessage += '<br />';
                                sMessage += sAddonMessage;
                            }
                        } else if (sType == 'warning') {
                            var iCountDown = oParameters.countDown;
                            sMessage = oRb.getText('COMMON_SESSION_WARNING', [
                                iCountDown,
                                oRb.getText({
                                    s: ['COMMON_SESSION_SECOND', 'COMMON_SESSION_SECONDS'],
                                    m: ['COMMON_SESSION_MINUTE', 'COMMON_SESSION_MINUTES']
                                }[oParameters.interval][iCountDown == 1 ? 0 : 1])
                            ]);
                        }
                        return '<div class="sessionWarningMessage">' + sMessage + '</div>';
                    },
                    close: closeUI,
                    keepAlive: keepAlive,
                    logout: logout,
                    login: login
                }).setEscapeHandler(function(oPromise) {
                    oPromise.reject(); // Prevents escape from closing the Dialog
                }).setModel(_oTimerModel).setModel(new ResourceModel({
                    bundle: getResourceBundle()
                }), 'i18n'));
            });
        });
    }

    /**
     * Close the dialog.
     * @inner
     */
    function closeUI() {
        _oDialogPromise && _oDialogPromise.then(function(oDialog) {
            oDialog.close();
        });
    }

    /**
     * Set the disable UI flag.
     *
     * @inner
     * @param {Boolean} bDisabled
     */
    function setDisableUI(bDisabled) {
        Timer._bDisableUI = bDisabled;
        if (bDisabled) {
            closeUI();
        }
    }

    /**
     * Invalidate the session prior to the user pressing the login button.
     * @inner
     */
    function invalidateSession() {
        /*
         * TODO:
         *
         * Check if this is really the best approach and fix the logic
         * For now, this is maintaining backwards compatibility with legacy implementation of SessionTimer
         *
         * There are 2 cases:
         * 1) The session has timed out - the DWR call will fail and probably redirect to login page (which is OK)
         * 2) The session has not truly timed out - the DWR call will work,
         */
        return new Promise(function(res) {
            // TODO, The settings for INVALIDATE can be made to OData so it always will be allowed
            // or add some additional code in the else block if required to handle when the page is not running base-domain
            var oInvalidateService = getAjaxServiceSettings('INVALIDATE');
            if (DeferredUtil.isServiceAllowed(oInvalidateService)) {
                DeferredUtil.invokeService(oInvalidateService).always(res);
            } else {
                res();
            }
        });

    }

    /**
     * Called when the user wants to login after the session has already timed out.
     * @inner
     */
    function login() {
        invalidateSession().then(function() {
            var sUrl = getLoginUrl();
            if (!sUrl) {
                sUrl = '/login';
                var oPageMetaData = window.pageHeaderJsonData;
                var sCompanyId = oPageMetaData && oPageMetaData.companyId;
                if (sCompanyId) {
                    sUrl += '?company=' + encodeURIComponent(sCompanyId);
                }
            }
            LinkUtil.gotoURL(Util.ensureBaseDomain(sUrl), true);
        });
    }

    /**
     * Called when the user wants to logout before the timeout has happened.
     * This is similar to pressing the logout button from the utility links.
     * @inner
     */
    function logout() {
        setDisableUI(true);
        updateTimeoutEstimate('logout');
        if (window.TopNavLogout) {
            TopNavLogout.startLogout();
        } else {
            sap.ui.require(['sap/sf/surj/shell/util/TopNavLogout'], function() {
                if (window.TopNavLogout) {
                    window.TopNavLogout.startLogout();
                } else {
                    $.sap.log.error('TopNavLogout could not be loaded.');
                }
            });
        }
    }

    /**
     * Called when the user wants to extend the session.
     * @inner
     */
    function keepAlive() {
        var oKeepAlive = getAjaxServiceSettings('KEEP_ALIVE');
        if (DeferredUtil.isServiceAllowed(oKeepAlive)) {
            DeferredUtil.invokeService(oKeepAlive)
        } else if (Util.isBaseDomainCORSEnabled()) {
            $.ajax({
                url: Util.ensureBaseDomain('/sf/protected/cors'),
                xhrFields: {
                    withCredentials: true,
                }
            });
        }
    }

    /**
     * Config properties include:

     * 1) timeUntilExpires: number of seconds after the last sessionExtension that the session will likely expire
     * 2) timeUntilWarning: number of minutes before the session expires that a warning should appear
     * 3) enableSessionTimeoutAutomaticRedirect: boolean, true if redirect automatically without user input
     * 4) sessionTimeoutAutomaticRedirectUrl: String, the URL to redirect to after time out occurs
     *
     * Example: {timeUntilExpires:1800,timeUntilWarning:10}
     *
     * @inner
     * @return {Promise.<Object>} A Promise for the sessionTimeoutConfigs JSON object.
     */
    function getTimeoutSettings() {
        return Timer._oConfigPromise || new Promise(function(res, rej) {
            var oPageMetaData = window.pageHeaderJsonData;
            var oSettings = oPageMetaData && oPageMetaData.settings;
            if (oSettings && oSettings.results) { // OData has results instead
                oSettings = oSettings.results.reduce(function(oMap, oEntry) {
                    oMap[oEntry.key] = oEntry.value;
                    return oMap;
                }, {});
            }
            var sSessionConfig = oSettings && oSettings.sessionTimeoutConfigs;
            if (!sSessionConfig) {
                var oSettingsTag = document.getElementById('sessionTimeoutConfigs');
                if (oSettingsTag) {
                    sSessionConfig = oSettingsTag.content || oSettingsTag['data-content'];
                }
            }
            /** @inner */
            function normalizeSettings(oSettings) {
                var bValid = oSettings.timeUntilExpires && oSettings.timeUntilExpires > 0;
                // timeUntilExpires must be a positive number, or it will be rejected
                if (bValid) {
                    // timeUntilWarning cannot be greater than the timeout itself, will default to 10 minutes, and cannot be negative
                    var iMinTillExpire = Math.round(oSettings.timeUntilExpires / 60);
                    var iMinTillWarning = oSettings.timeUntilWarning;
                    if (isNaN(iMinTillWarning) || iMinTillWarning >= iMinTillExpire || iMinTillWarning <= 0) {
                        oSettings.timeUntilWarning = DEFAULT_TIME_TILL_WARNING;
                    } else {
                        oSettings.timeUntilWarning = iMinTillWarning;
                    }
                }
                return bValid;
            }
            if (sSessionConfig) {
                var bValid = false;
                try {
                    // TODO: Make this use proper JSON formatting and use JSON.parse() instead of eval
                    // Example: sessionTimeoutConfigs="{timeUntilExpires:1800,timeUntilWarning:10}"
                    var oSettings = JSON.parse(sSessionConfig.replace(/([{,])(\w*):/g, '$1"$2":'));
                    if (normalizeSettings(oSettings)) {
                        res(oSettings);
                        bValid = true;
                    }
                } catch (e) {
                    $.sap.log.error('Error parsing settings: ', e);
                }
                if (!bValid) {
                    rej('invalidSettings: ' + sSessionConfig);
                }
            } else {
                var oSettingsService = getAjaxServiceSettings('CONFIG');
                if (DeferredUtil.isServiceAllowed(oSettingsService)) {
                    DeferredUtil.invokeService(oSettingsService).then(function(oSettings) {
                        if (normalizeSettings(oSettings)) {
                            res(oSettings);
                        } else {
                            rej('invalidSettings: ' + JSON.stringify(oResponse));
                        }
                    }, rej.bind(null, 'serverError'));
                } else {
                    rej('missingConfig');
                }
            }
        });
    }

    /**
     * Set an addon message to the SessionTimeout message.
     * @inner
     * @param {String} sAddonMessage
     */
    function setSessionTimedOutAddonMsg(sAddonMessage) {
        _oTimerModel.setProperty('/addonMessage', sAddonMessage);
    }

    /**
     * Check if the page has timed out.
     * @inner
     * @return {Boolean}
     */
    function isSessionExpired() {
        return _oTimerModel.getProperty('/params/type') == 'timeout';
    }

    /**
     * SFSessionTimer can be added as an event listener specifically for the sessionTimedOut
     * event which should just timeout the session.
     * @inner
     */
    function handleEvent(oEvent) {
        if (oEvent.type == 'sessionTimedOut') timeoutNow();
    }

    /**
     * Compose the settings for an ajax call.
     * @inner
     * @param {String} sType
     * @return {Object}
     */
    function getAjaxServiceSettings(sType) {
        return $.extend({}, BASE_SERVICE, SERVICES[sType]);
    }

    /**
     * Listen for an event from the Timer. This is only really used by legacy integrations.
     * @inner
     * @param {String} sEventType
     * @param {Object} oListener
     * @param {String=|Function=} vCallbackName Default is "handleEvent" if not specified
     */
    function addEventListener(sEventType, oListener, vCallbackName) {
        _oObservable.attachEvent(sEventType, fEventHandler);
        var aEventHandlers = _oEventHandlers[sEventType] = _oEventHandlers[sEventType] || [];
        aEventHandlers.push({
            oListener: oListener,
            fEventHandler: fEventHandler
        });
        function fEventHandler(oEvent) {
            var fCallback;
            // UI-21405 The legacy UI5 version supported passing the callback as a function rather than string
            // See https://github.wdf.sap.corp/bizx/idl-surj/blob/b1905/idl-surj-sap.sf.surj.shell-web/src/main/uilib/sap/sf/surj/shell/session/SessionTimer.js#L51
            if (typeof vCallbackName == 'function') {
                fCallback = vCallbackName;
            } else {
                fCallback = oListener[vCallbackName || 'handleEvent'];
            }
            fCallback.call(oListener, $.extend({
                type: oEvent.getId()
            }, oEvent.getParameters()));
        }
    }

    /**
     * Remove all listeners for the given type and listener object.
     * @param {*} sEventType
     * @param {*} oListener 
     */
    function removeEventListener(sEventType, oListener) {
        var aEventHandlers = _oEventHandlers[sEventType];
        if (aEventHandlers) {
            // looping backwards to more easily remove items inside the loop
            for (var i=aEventHandlers.length-1; i>=0; i--) {
                if (aEventHandlers[i].oListener === oListener) {
                    _oObservable.detachEvent(sEventType, aEventHandlers[i].fEventHandler);
                    aEventHandlers.splice(i, 1);
                }
            }
        }
    }

    /**
     * Attach an event that happens when the Dialog closes but only when it is a warning.
     * There is one old place that does this, but the new Timer has only a shared dialog for
     * warnings and timeouts.
     * @inner
     */
    function attachWarningAfterClose(fCallback, oListener) {
        getTimerDialog().then(function(oDialog) {
            oDialog.attachAfterClose(function(oEvent) {
                if (_oTimerModel.getProperty('/params/type') == 'warning') {
                    fCallback.call(oListener, oEvent);
                }
            });
        });
    }

    /**
     * Get the login URL to redirect to when the user presses Login.
     * @inner
     * @return {String}
     */
    function getLoginUrl() {
        if (window.AjaxServiceMeta && AjaxServiceMeta.timeoutUrl) {
            return AjaxServiceMeta.timeoutUrl;
        } else if (window.AjaxService && AjaxService.getRedirectUrl) {
            return AjaxService.getRedirectUrl();
        }
        return window.timeout_redirect_url;
    }

    /**
     * Get the i18n resources.
     */
    function getResourceBundle() {
        return sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
    }

    // --------------------------------------------------------------------------------
    // START: WINDOW TITLE CHANGE

    /**
     * Set the title of the window to some temporary string.
     * @inner
     * @param {String} sTitle
     */
    function setWindowTitle(sTitle) {
        if (!_sWindowTitle) {
            _sWindowTitle = document.title;
        }
        document.title = sTitle;
    }

    /**
     * Restore the window's title back to the value before calling setWindowTitle.
     * @inner
     */
    function restoreWindowTitle() {
        if (_sWindowTitle) {
            document.title = _sWindowTitle;
            _sWindowTitle = null;
        }
    }
    
    // There are three separate event handlers for 'stateChanged' event. This is the third handler that is invoked when 'stateChanged' event is fired.
    _oObservable.attachEvent('stateChanged', function(oEvent) {
        var sType = oEvent.getParameter('type');
        // Update the document title
        if (sType == 'alive') {
            restoreWindowTitle();
        } else {
            if (sType == 'warning') {
                if (UPDATE_TITLE_FOR_WARNINGS) {
                    setWindowTitle(getResourceBundle().getText('COMMON_SESSION_ABOUT_TO_TIME_OUT'));
                } else {
                    restoreWindowTitle();
                }
            } else if (_bUserInitiatedLogout) {
                setWindowTitle(getResourceBundle().getText('COMMON_SUCCESSFULLY_LOGGED_OUT'));
            } else {
                setWindowTitle(getResourceBundle().getText('COMMON_SESSION_EXPIRED_MESSAGE'));
            }
        }
    });

    // --------------------------------------------------------------------------------
    // START: USER ACTIVITY LISTENER

    /**
     * Set the consider user activity flag.
     *
     * @param {Boolean} bConsiderActivity
     */
    function setConsiderUserActivity(bConsiderActivity) {
        var bCurrentValue = !!Timer._bConsiderActivity;
        var bNewValue = !!bConsiderActivity;
        if (bCurrentValue != bNewValue) {
            Timer._bConsiderActivity = bNewValue;
            var oBody = (Device.browser.safari || window.document.compatMode == 'BackCompat') ? window.document.body : window.document.documentElement;
            $(oBody)[bConsiderActivity ? 'bind' : 'unbind'](USER_ACTIVITY_EVENTS.reduce(function(oEvents, sType) {
                oEvents[sType] = recordUserActivity;
                return oEvents;
            }, {}));
        }
    }

    /**
     * Record some user activity.
     */
    function recordUserActivity(oEvent) {
        Timer._iLastUserActivity = new Date().getTime();
    }

    // --------------------------------------------------------------------------------
    // START: PUBLIC API

    /**
     * The Timer namespace with public API. Includes all the function calls that Javascripts outside
     * of this file will interface with, including the ones from legacy integrations.
     * @namespace
     */
    var Timer = window.SFSessionTimeout = {
        start: start,
        whenStarted: whenStarted,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        setSessionTimedOutAddonMsg: setSessionTimedOutAddonMsg,
        getTimeoutSettings: getTimeoutSettings,
        isSessionExpired: isSessionExpired,
        reset: reset,
        invalidateSession: invalidateSession,
        cleanup: cleanup,
        timeoutAfter: timeoutAfterPromise,
        endSession: logoutNowPromise,
        timeout: timeoutNowPromise,
        keepAlive: keepAlive,
        extendSession: keepAlive,
        ignoreUserActivity: setConsiderUserActivity.bind(null, false),
        considerUserActivity: setConsiderUserActivity.bind(null, true),
        disableUIDisplay: setDisableUI.bind(null, true),
        enableUIDisplay: setDisableUI.bind(null, false),
        updateTimeoutEstimate: updateTimeoutEstimate,
        _showSessionTimedOutDialog: timeoutNowPromise,
        _keepAlive: keepAlive,
        handleEvent: handleEvent,
        sessionTimer: {
            cleanup: cleanup,
            timedOut: timeoutNow,
            addEventListener: addEventListener,
            removeEventListener: removeEventListener,
            sessionTimeoutController: {
                invalidateSession: invalidateSession
            }
        },
        warningDlg: {
            attachAfterClose: attachWarningAfterClose
        },

        // For unit test purposes
        getTimerDialog: getTimerDialog,
        setTimeout: window.setTimeout,
        clearTimeout: window.clearTimeout,
        setInterval: window.setInterval,
        clearInterval: window.clearInterval,
        resetTimerState: _setInitialState,
        getObservable: function() {
            return _oObservable;
        },
        model: _oTimerModel,
        getLoginUrl: getLoginUrl,
        recordUserActivity: recordUserActivity,
        login: login,
        logout: logout,

        /**
         * Get the current timeout estimate from the SessionTimer. In other words, what time does this SessionTimer believe the
         * Session will expire.
         * 
         * You may also use the following:
         * SFSessionTimeout.addEventListener('timeoutEstimateChanged', handler, methodName);
         * 
         * This will give a callback whenever the timeoutEstimate changes due to some request either on this or any other browser tab.
         * 
         * NOTE: This is only an estimate, because there is no way for the browser to know with absolute certainty that the session
         * has expired. In practice, this estimate is fairly accurate.
         *  
         * @return {Number} A timestamp, which is the SessionTimer's current estimate when the session should expire.
         */
        getCurrentTimeoutEstimate: function() {
            return Timer._iTimeoutEstimate;
        }
    };

    ['setInitialLastPageVisited', 'clearLastPageVisited', 'setCurrentPageAsLastVisited'].forEach(function(sMethodName) {
        SFSessionTimeout[sMethodName] = function() {
            var LastPageVisitedUtil = window.LastPageVisitedUtil;
            var fMethod = LastPageVisitedUtil && LastPageVisitedUtil[sMethodName];
            if (fMethod) {
                fMethod.apply(LastPageVisitedUtil, arguments);
            }
        };
    });

    return Timer;
});