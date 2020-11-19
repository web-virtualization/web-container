
sap.ui.define('sap/sf/surj/shell/util/JamUtil', [
        'jquery.sap.global',
        'sap/sf/surj/shell/util/Logger',
        'sap/sf/surj/shell/util/SearchUtil',
        'sap/sf/surj/shell/util/LinkUtil',
        'sap/sf/surj/shell/util/DeferredUtil',
        'sap/sf/surj/shell/util/Util'
    ], function($, Logger, SearchUtil, LinkUtil, DeferredUtil, Util) { 

    // CONSTANTS
    var POLL_TIME = 60000;
    var SIMULATION_URL = 'jamSimulation.jsp';
    var INBOX_PATH = '/inbox/view';
    var BIZX_PATH = '/externalapi/layout/rest/v0/jam/fetch_updates/unread_notifications';
    var JAM_PATH = '/fetch_updates/unread_notifications';
    var SEARCH_PATH = '/search/universal_search2';
    var SEARCH_PATH_AUTOCOMP = '/search/universal_search_autocomplete';
    var URL_SUFFIX = 'items=inbox&jsonp=?';
    var COUNT_PROMISE = null;
    var LOG = Logger.getLogger('JamUtil');

    /**
     * @inner
     * @param {Object} oCriteria
     * @param {String=} oCriteria.groupId
     * @param {String} oCriteria.searchValue
     */
    function createJamAutoCompleteUrl(oCriteria) {
        return constructUrl(JamUtil.getBaseUrl(), SEARCH_PATH_AUTOCOMP, $.param({
            output : 'json',
            results : 10,
            group_id : oCriteria.groupId || '0',
            query : oCriteria.searchValue
        }));
    }

    /**
     * @param {Object} oCriteria
     * @param {String} oCriteria.searchValue
     * @param {String=} oCriteria.groupId
     * @return {String}
     */
    function createJamActionUrl(oCriteria) {
        return constructUrl(JamUtil.getBaseUrl(), SEARCH_PATH, $.param({
            group_id : oCriteria.groupId || '0',
            query : oCriteria.searchValue
        }));
    }

    /**
     * This will be added as a registered search provider for Jam.
     * 
     * @inner
     */
    var JamSearch = {
        /**
         * @param {Object} oCriteria
         * @param {String=} oCriteria.groupId
         * @param {String} oCriteria.searchValue
         */
        search : function(oCriteria) {
            /*
             * If Jam auto complete is enabled, make an ajax call to the url to
             * fetch the results.
             */
            return $.ajax({
                url : createJamAutoCompleteUrl(oCriteria)
            }).then(function(oResult) {
                var aResults = oResult && oResult.ResultSet && oResult.ResultSet.Results;
                return {
                    type : 'Jam',
                    items : aResults || [],
                    hasMore : false,
                    totalCount : aResults && aResults.length
                };
            }, function() {
                return MSGS.COMMON_AJAX_DEFAULT_ERROR
            });
        },

        /**
         * @param {Object} oCriteria
         * @return {String}
         */
        getExternalSearchUrl : function(oCriteria) {
            return createJamActionUrl(oCriteria);
        },

        /**
         * @param {Object} oItemConfig
         */
        selectItem : function(oItemConfig) {
            var oItem = oItemConfig.item;
            LinkUtil.gotoURL(oItem.Href);
        }
    };

    /*
     * The same search is used for group, the group id of 0 will be sent in case
     * it is a non-group search.
     */
    SearchUtil.register('Jam', JamSearch);
    SearchUtil.register('JamGroup', JamSearch);

    var JamUtil = {
        /**
         * @return {String} The Jam base url
         */
        getBaseUrl : function() {
            return getPageHeaderProperty('/jamBaseUrl');
        },

        /**
         * @return {String} The successfactors/bizx base url
         */
        getSFBaseUrl : function() {
            return getPageHeaderProperty('/baseUrl');
        },

        /**
         * @return {String}
         */
        getGotoURL : function() {
            return constructUrl(JamUtil.getBaseUrl(), INBOX_PATH);
        },

        /**
         * Is Jam currently enabled.
         * 
         * @return {boolean}
         */
        isEnabled : function() {
            var sJamBaseUrl = JamUtil.getBaseUrl();
            return !!(sJamBaseUrl && typeof sJamBaseUrl == 'string');
        },

        /**
         * Is a repeat call to BizX allowed?
         * 
         * @return {Boolean}
         */
        isBizXUpdateDisabled : function() {
            /*
             * UI-5044 Updating the bizx value after the first call is always
             * disabled for security reasons to ensure that the session doesn't
             * live forever, but we may want to enable it in the future based on
             * user activity
             */
            return true;
        },

        /**
         * Is the backup bizx call for notification supported
         * 
         * @return {Boolean}
         */
        isBizXBackupSupported : function() {
            /*
             * The backup call to BizX is only supported when the current
             * window's location originates from BizX
             */
            return JamUtil.isBizXLocation();
        },

        /**
         * Determine if the current window is BizX or not.
         * 
         * @return {Boolean} Is this page running on SF Domain?
         */
        isBizXLocation : function() {
            return Util.isRunningBaseDomain();
        },

        /**
         * @return {Object}
         */
        getCurrentGroup : function() {
            var oJamApp = window.jamApp;
            // UI-11618 Must return null instead of false in case inHomePage is true
            return (oJamApp && !oJamApp.inHomePage && oJamApp.currentGroup) || null;
        },

        /**
         * @return {String}
         */
        getDefaultGroupId : function() {
            var oGroup = this.getCurrentGroup();
            return oGroup && typeof oGroup.toParam == 'function' && oGroup.toParam();
        },

        /**
         * @return {String}
         */
        getDefaultGroupLabel : function() {
            var oJamGroup = this.getCurrentGroup();
            return oJamGroup && typeof oJamGroup.get == 'function' && oJamGroup.get('name');
        },

        _delayPromise: delayPromise,
        _createJamAutoCompleteUrl: createJamAutoCompleteUrl,
        _createJamActionUrl: createJamActionUrl,
        _search: JamSearch.search,
        _getExternalSearchUrl: JamSearch.getExternalSearchUrl,
        _selectItem: JamSearch.selectItem,
        _pageHeaderAvailable: pageHeaderAvailable,
        /**
         * Get the notification count. This monitors the count by polling the
         * count every minute, so you must call progress() rather than done() to
         * get the count.
         * 
         * @return {Promise} A promise for the notification count as a progress
         */
        getNotificationCount : function() {
            if (COUNT_PROMISE) {
                return COUNT_PROMISE;
            }

            /*
             * We must wait for the page header to be available, and the
             * document to be visible before starting the calls to Jam to fetch
             * count.
             * 
             * Also for backwards compatibility we will slightly delay the call,
             * in case the pageHeader is available and document is visible right
             * away.
             */
            return COUNT_PROMISE = JamUtil._delayPromise(pageHeaderAvailable()).then(function() {
                if (JamUtil.isEnabled()) {
                    return startJamNotificationCountRequests();
                } else {
                    return $.Deferred().reject('Jam is not enabled in your company');
                }
            });
        },
    };

    /**
     * Start the requests to Jam/BizX, and make repeated requests every minute
     * on failure. This function assumes all preconditions are met, and is the
     * main loop for requesting the jam notification count repeatedly.
     * 
     * @inner
     * @return {Promise} This promise is never resolved, only notified or
     *         rejected
     */
    function startJamNotificationCountRequests() {
        var oDfd = $.Deferred();
        var bBizXSupport = JamUtil.isBizXBackupSupported();
        var iLastCount = null;
        var iLastRequestTime = null;
        var iFailureCount = 0;
        var iBizXCount = 0;

        /**
         * Make the next request, either after some delay, or right away,
         * depending on the first argument.
         * 
         * @inner
         * @param {Boolean=} bDelay
         */
        function nextRequest(bDelay) {
            /*
             * This will be bizx if there was at least one error before, and
             * bizx is actually supported.
             */
            var bIsBizX = iFailureCount > 0 && bBizXSupport;
            var oModel = sap.ui.getCore().getModel('pageHeader');

            // If document is inactive we will wait another minute
            if (isDocumentInactive()) {
                bDelay = true;
            }

            if (bIsBizX) {
                iBizXCount++;
                var bUpdateDisabled = JamUtil.isBizXUpdateDisabled();
                oModel.setProperty('/bizxUpdateDisabled', bUpdateDisabled);
                if (iBizXCount > 1) {
                    if (bUpdateDisabled) {
                        bDelay = true;
                    }
                }
            }

            if (bDelay) {
                // Delay the next request by a minute
                var iRequestDuration = new Date().getTime() - iLastRequestTime;
                setTimeout($.proxy(nextRequest, null, false), Math.max(0, POLL_TIME - iRequestDuration));
            } else {
                iLastRequestTime = new Date().getTime();

                // Make the request for jam notification
                requestJamNotification(bIsBizX).done(function(iCount) {
                    /*
                     * Clear failure flag on success, which may cause the
                     * session failed message on the panel to appear and then
                     * disappear.
                     */
                    oModel.setProperty('/failedJamSessionCheck', false);

                    // Don't bother notifying if the count has not changed
                    // You may assume the following statement is always true:
                    // typeof iCount === 'number' && iCount >= 0
                    if (iLastCount !== iCount) {
                        iLastCount = iCount;
                        oDfd.notify(iCount);
                    }

                    /*
                     * If the count was successful, we will notify the count and
                     * make another call in a minute. So this will continually
                     * notify the caller on a regular interval.
                     */
                    nextRequest(true);
                }).fail(function(statusCode) {
                    iFailureCount++;
                    var sSystem = bIsBizX ? 'bizx' : 'jam';
                    LOG.error('Possible ' + sSystem + ' failure, statusCode returned as ' + statusCode + (bIsBizX || !bBizXSupport ? '' : ' will attempt a BizX call as backup.'));

                    // 401 Unauthorized
                    // 403 Forbidden
                    var bFailedJamSessionCheck = (statusCode == 401 || statusCode == 403);
                    oModel.setProperty('/failedJamSessionCheck', bFailedJamSessionCheck);

                    if (bIsBizX) {
                        // We do not support retry in case of bizx
                        oDfd.reject(statusCode);
                    } else {
                        /*
                         * If this was jam and bizx is supported then do not
                         * delay the next request; otherwise, make the next
                         * request after 1 minute delay.
                         */
                        nextRequest(!bBizXSupport);
                    }
                });
            }
        }

        nextRequest(false);

        return oDfd.promise();
    }

    /**
     * Make a single jam notification count request, resolving or rejecting the
     * count ASAP.
     * 
     * @inner
     * @param {Boolean=} bUseBizx Defaults to false
     * @return {Promise}
     */
    function requestJamNotification(bUseBizx) {
        var sBaseUrl, sPath;

        if (bUseBizx) {
            sBaseUrl = JamUtil.getSFBaseUrl();
            sPath = BIZX_PATH;
        } else {
            sBaseUrl = JamUtil.getBaseUrl();
            sPath = JAM_PATH;
        }
        
        // Moved the jsonp call to DeferredUtil, due to reuse for ShowMe
        var oDataPromise = DeferredUtil.invokeJsonpService(constructUrl(sBaseUrl, sPath, URL_SUFFIX));

        /**
         * This is the jsonp callback function.
         * 
         * In case of success, Jam will send the number as the first argument.
         * In these examples I will use "responseCallback" but at runtime this
         * will be some unreadible jQuery generated unique string.
         * 
         * <code>
         * responseCallback(5);
         * </code>
         * 
         * In case of error, Jam will send something like this:
         * 
         * <code>
         * responseCallback(null, {"statusCode":403,"headers":{"Cache-Control":"no-cache, no-store, private, max-age=0, must-revalidate","Expires":"-1","Content-Type":"application/json; charset=utf-8"},"body":"{}"})
         * </code>
         * 
         * @inner
         * @param {Integer|Object} oData Will be null or Integer
         * @param {Object=} oError Optional error object
         */
        return oDataPromise.then(function(oData, oError) {
            // Reset the session timeout if this request was to BizX
            if (bUseBizx && window.SFSessionTimeout && typeof SFSessionTimeout.reset == 'function') {
                SFSessionTimeout.reset();
            }

            /*
             * In case of error, oData will be null and second argument should
             * be an object. Other cases will be treated as a successful
             * response.
             */
            if (oData == null && oError && typeof oError == 'object') {
                /*
                 * We only reject with a status code when the jsonp callback was
                 * successfully invoked, but the second argument was passed as
                 * an object with a status code.
                 * 
                 * Other error conditions such as timeout, server side issues,
                 * or incorrect jam URL, will not have a status code available.
                 */
                return $.Deferred().reject(oError.statusCode);
            } else if(oData == null) {
                return $.Deferred().reject('unknown_error');
            } else {
                var iCount = null;

                /*
                 * For backwards compatibility oData will support 3 forms:
                 * Integer|{notifications_count:Integer}|{total:Integer}
                 */
                if (oData != null) {
                    iCount = parseInt(oData, 10);
                    if (isNaN(iCount)) {
                        var nDataCount = oData.notifications_count;
                        if (!isNaN(nDataCount)) {
                            iCount = nDataCount;
                        } else {
                            iCount = oData.total;
                        }
                    }
                }

                /*
                 * We want to ensure the Promise is always resolved with a
                 * non-negative integer. Negative or things which are not
                 * numbers (like object or boolean) will be ignored and treated
                 * like it was 0.
                 */
                return (parseInt(iCount, 10) > 0) ? iCount : 0;
            }
        });
    }

    /**
     * @inner
     * @return {Promise} A promise the pageHeader model will be available.
     */
    function pageHeaderAvailable() {
        return waitForCondition(function() {
            return sap.ui.getCore().getModel('pageHeader');
        }, 10);
    }

    /**
     * @inner
     * @param {String} sPropertyName
     * @return {*} The property value, or null if pageHeader model doesn't exist
     */
    function getPageHeaderProperty(sPropertyName) {
        var oModel = sap.ui.getCore().getModel('pageHeader');
        return oModel && oModel.getProperty(sPropertyName);
    }

    /**
     * Wait for the condition to be true, do nothing in the meantime.
     * 
     * @inner
     * @param {Function} fCondition The tester function
     * @param {Integer} iPollTime Milliseconds between polls
     * @return {Promise} A promise resolved when the condition becomes true
     */
    function waitForCondition(fCondition, iPollTime) {
        var oDfd = $.Deferred();
        if (fCondition()) {
            oDfd.resolve();
        } else {
            function poll() {
                setTimeout(function() {
                    if (fCondition()) {
                        oDfd.resolve();
                    } else {
                        poll();
                    }
                }, iPollTime);
            }
            poll();
        }
        return oDfd.promise();
    }

    /**
     * Wrap a promise with a delay.
     * 
     * @inner
     * @param {Function} oPromise A promise to wrap
     * @param {Promise} A promise that will mimik the behavior of the promise
     *            being wrapped
     */
    function delayPromise(oPromise) {
        /*
         * If the promise is resolved before the short timeout is complete, then
         * the wrapped promise is not resolved until the timeout.
         * 
         * If the promise is resolved after the short timeout then the wrapped
         * promise is resolved without any delay, since already the short delay
         * has happened while waiting for the incoming promise to be resolved.
         */
        var oDfd = $.Deferred();
        var oReady = $.Deferred();
        oPromise.done(function() {
            var args = arguments;
            oReady.done(function() {
                oDfd.resolve.apply(oDfd, args);
            });
        }).fail(function() {
            var args = arguments;
            oReady.done(function() {
                oDfd.reject.apply(oDfd, args);
            });
        }).progress(function() {
            var args = arguments;
            oReady.done(function() {
                oDfd.progress.apply(oDfd, args);
            });
        });
        setTimeout(function() {
            oReady.resolve();
        }, 1);
        return oDfd.promise();
    }

    /**
     * @inner
     * @return {Boolean}
     */
    function isDocumentInactive() {
        var doc = document;
        // TODO: Should we also detect if there was some user activity?
        return doc.hidden || doc.webkitHidden || doc.mozHidden || doc.msHidden;
    }

    /**
     * @inner
     * @param {String} sBaseUrl
     * @param {String} sQueryString
     * @return {String}
     */
    function constructUrl(sBaseUrl, sPath, sQueryString) {
        var sResult = sBaseUrl, mainIdx, tempIdx;
        if (!sResult) {
            sResult = sPath;
        } else if (sPath) {
            // Insert the path before the query string and any path parameters
            mainIdx = sResult.indexOf('?'); // start of query string
            if (mainIdx < 0) {
                mainIdx = sResult.length;
            }
            tempIdx = sResult.lastIndexOf(';', mainIdx); // start of path
            // parameters
            if (tempIdx >= 0) {
                mainIdx = tempIdx;
            }
            var sBaseQuery = sResult.substring(mainIdx);
            if (sBaseUrl.indexOf(SIMULATION_URL) >= 0) {
                sResult = sResult.substring(0, mainIdx) + '?path=' + encodeURIComponent(sPath);
                if (sBaseQuery) {
                    sResult += sBaseQuery.substring(1);
                }
            } else {
                sResult = sResult.substring(0, mainIdx) + sPath + sBaseQuery;
            }
        }
        if (sQueryString) {
            if (sResult) {
                sResult += (sResult.indexOf('?') >= 0) ? '&' : '?';
            } else {
                sResult = '?';
            }
            sResult += sQueryString;
        }
        return sResult;
    }

    $.sap.setObject('sap.sf.surj.shell.util.JamUtil', JamUtil);
    return JamUtil;

});