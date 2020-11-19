sap.ui.define('sap/sf/surj/shell/util/SearchUtil', [
    'jquery.sap.global', 
    'sap/sf/surj/shell/util/DeferredUtil',
    'sap/sf/surj/shell/util/LinkUtil',
    'sap/sf/surj/shell/util/Logger',
    'sap/sf/surj/shell/util/Config',
    'sap/sf/surj/shell/util/Util',
    'sap/ui/base/EventProvider'
    ], function ($, DeferredUtil, LinkUtil, Logger, Config, Util, EventProvider) {

    /**
     * The built in search types are defined here.
     */
    var REGISTRY = {
        jsup : {
            search : function(oCriteria) {
                oCriteria = $.extend({
                    m : 'autocomplete',
                    findtype : 'fullname',
                    maxresults : 30,
                    hideusername : false,
                    includeInactive : false,
                    includeExternalUsers : false,
                    includeExternalUsersNonMtr : false,
                    adminPage : false,
                    groupId : 0
                }, oCriteria);
                var oXHR = $.ajax({
                    dataType : 'json',
                    url : '/jsup?' + $.param(oCriteria)
                });
                return $.extend(oXHR.then(function(oResponse) {
                    // UI-15941 Changing the /jsup response to unescape everything in the SearchUtil layer 
                    var aItems = SearchUtil.maybeUnescapePlainText(oResponse && oResponse.ResultSet && oResponse.ResultSet.Result, true);
                    var iTotalCount = (aItems && aItems[0] && aItems[0].Count) || 0;
                    // Loading more is not supported
                    return {
                        totalCount : iTotalCount,
                        hasMore : aItems.length < iTotalCount,
                        items : aItems,
                        more : null
                    };
                }), {
                    abort : $.proxy(oXHR.abort, oXHR)
                });
            }
        }
    };

    /**
     * The SearchUtil provides a generic way to search for anything, give the
     * type of search and some basic criteria, and you will get a deferred back
     * which will give you the first page of results. The result will have a
     * function called "more" which allows you to get the next page of data.
     * 
     * You can also use this to convert a data item into a SelectItem to display
     * in search results.
     * 
     * @namespace
     * @name sap.sf.surj.util.SearchUtil
     */
    var SearchUtil = {
        /**
         * This can be used to clean up legacy back-end data which returns escaped
         * plain-text, and for backwards compatibility the back-end cannot be changed
         * to instead return the plain-text directly.
         *
         * IMPORTANT: This function does not support Rich-Text/HTML tags or any "unsafe" characters.
         * If provided the text will NOT be escaped.
         *
         * @param {Object|Array|String} val
         *  If given Object, maybeUnescape all attributes
         *  If given Array, maybeUnescape all array elements
         *  If given String, maybeUnescape this string.
         * @param {boolean=} bClone false by default
         *  Specify true to return a non-modified clone of the original input
         * @return {Object|Array|String}
         *  Return the updated Object/Array/String.
         */
        maybeUnescapePlainText : function (val, bClone) {
            return Util.maybeUnescapePlainText(val, bClone);
        },
        /*
        * return true if the currently session is in Chinese, Korean or Japanese environment, which allows one char query
        */
        isAllowOneCharQuery : function() {
            var isAllowOneCharQueryLocales = [
                'ja',
                'ko',
                'zh'
            ];
            return isAllowOneCharQueryLocales.indexOf(sap.ui.getCore().getConfiguration().getLocale().getLanguage()) >= 0;
        },

        /**
         * A utility to throttle user queries, so only one search will happen at
         * a time, and if the user quickly changes the search criteria we only
         * let the last search win. The user must settle upon a search criteria
         * for at least the given throttle time.
         * 
         * @param {Object} oConfig
         * @param {Integer=} oConfig.throttleTime default is 300
         * @return {sap.ui.base.EventProvider}
         */
        createThrottle : function(oConfig) {
            oConfig = new Config(oConfig, {
                throttleTime : 300,
                searcher : $.proxy(SearchUtil.search, SearchUtil)
            });
            var fSearcher = oConfig.searcher;
            if ($.isArray(fSearcher) && typeof fSearcher[0] == 'function') {
                fSearcher = $.proxy(fSearcher[0], fSearcher[1]);
            }
            var iThrottleTime = oConfig.throttleTime;
            var oObservable = new sap.ui.base.EventProvider();
            var abort, next, iLastRequestId = 0;
            $.extend(oObservable, {
                /**
                 * Called any time the search criteria changes, usually as the
                 * user liveChanges an Input.
                 * 
                 * @param {String} sType
                 * @param {Object} oCriteria
                 */
                change : function(sType, oCriteria) {
                    abort && abort();
                    abort = next = null;

                    var fRequestHandler = fSearcher;
                    var aSearcherArguments = Array.prototype.slice.call(arguments);
                    var bAborted = false;
                    var iRequestId = ++iLastRequestId;
                    var oLastPromise = null;
                    var iTimeoutId = null;
                    var iItemOffset = 0;


                    if (typeof sType == 'function') {
                        fRequestHandler = sType;
                        aSearcherArguments = [];
                    } else if (aSearcherArguments.length == 1 || typeof sType == 'object') {
                        oCriteria = sType;
                        sType = null;
                    }

                    /**
                     * Wrap a function, so it only executes if it "should".
                     * 
                     * @inner
                     * @param {Function} fnCallback
                     * @return {Function}
                     */
                    function should(fnCallback) {
                        return function() {
                            if (!bAborted && iRequestId == iLastRequestId) {
                                return fnCallback.apply(this, arguments);
                            }
                        }
                    }

                    /**
                     * @inner
                     * @param {Promise=} oPromise
                     */
                    function startNextPage(oPromise) {
                        var bFirst = !oLastPromise;
                        oObservable.fireEvent('pending', {
                            pending : true
                        });
                        oPromise = oPromise || fRequestHandler.apply(null, aSearcherArguments);
                        oLastPromise = oPromise.always(function() {
                            if (bFirst) {
                                oObservable.fireEvent('reset');
                            }
                            oObservable.fireEvent('pending', {
                                pending : false
                            });
                        }).done(should(function(oResponse) {
                            var bMoreAvailable = oResponse.hasMore && typeof oResponse.more == 'function';
                            if (bMoreAvailable) {
                                next = should(function() {
                                    next = null;
                                    oObservable.fireEvent('pending', {
                                        pending : true
                                    });
                                    startNextPage(oResponse.more());
                                });
                            }

                            var aItems = oResponse.items;
                            var iCurrentOffset = iItemOffset;
                            if ($.isArray(aItems)) {
                                iItemOffset += aItems.length;
                            }

                            try {
                                oObservable.fireEvent('pageReady', {
                                    first : bFirst,
                                    itemOffset : iCurrentOffset,
                                    type : oResponse.type,
                                    criteria : oCriteria,
                                    totalCount : oResponse.totalCount,
                                    hasMore : oResponse.hasMore,
                                    items : aItems,
                                    moreAvailable : bMoreAvailable,
                                    response : oResponse
                                });
                            } catch(e) {
                                Logger.error(e);
                            }
                        })).fail(should(function() {
                            oObservable.fireEvent('error', {
                                response : arguments
                            });
                        }));
                    }

                    abort = should(function() {
                        bAborted = true;
                        iTimeoutId != null && clearTimeout(iTimeoutId);
                        if (oLastPromise && oLastPromise.state() == 'pending') {
                            if (typeof oLastPromise.abort == 'function') {
                                oLastPromise.abort();
                            }
                            oObservable.fireEvent('pending', {
                                pending : false
                            });
                        }
                        iTimeoutId = oLastPromise = null;
                    });
                    
                    iTimeoutId != null && clearTimeout(iTimeoutId);
                    iTimeoutId = setTimeout(should(function() {
                        iTimeoutId = null;
                        startNextPage();
                    }), iThrottleTime);
                },

                /**
                 * @return {Boolean}
                 */
                hasMore : function() {
                    return !!next;
                },

                more : function() {
                    next && next();
                },

                abort : function() {
                    abort && abort();
                }
            });

            $.each([ 'pageReady', 'pending', 'error', 'reset' ], function(i, sEventName) {
                var oContext = null;
                var fHandler = oConfig[sEventName];
                if ($.isArray(fHandler) && typeof fHandler[0] == 'function') {
                    fHandler = $.proxy(fHandler[0], fHandler[1]);
                }
                if (typeof fHandler == 'function') {
                    oObservable.attachEvent(sEventName, fHandler);
                }
            });

            return oObservable;
        },

        /**
         * A generic search.
         * 
         * @param {String} sType
         * @param {Object} oCriteria An object containing the search criteria
         * @return {Promise.<{items:Array, hasMore:boolean, more:function}>} A
         *         Promise for the search results
         */
        search : function(sType, oCriteria) {
            var oSearch = REGISTRY[sType];
            if (oSearch && typeof oSearch.search == 'function') {
                return oSearch.search(oCriteria);
            } else {
                return $.Deferred().reject('Invalid search type: ' + sType).promise();
            }
        },

        /**
         * Show the search by navigating the page.
         * 
         * @param {String} sType
         * @param {Object} oCriteria
         */
        externalSearch : function(sType, oCriteria) {
            var oSearch = REGISTRY[sType];
            if (oSearch && typeof oSearch.getExternalSearchUrl == 'function') {
                LinkUtil.handle({
                    url : oSearch.getExternalSearchUrl(oCriteria)
                });
            } else {
                throw new Error('Missing getExternalSearchUrl for search adapter for type ' + sType);
            }
        },

        /**
         * Called when an item is selected.
         * 
         * @param {String} sType
         * @param {Object} oItemConfig
         * @param {Object} oItemConfig.item The item being selected
         * @param {Object} oItemConfig.subject The subject (i.e. user) to a
         *            transitive action
         * @param {Object} oItemConfig.criteria The criteria used to produce
         *            this item
         * @param {Object} oItemConfig.response The response object that
         *            produced this item
         */
        selectItem : function(sType, oItemConfig) {
            var oSearch = REGISTRY[sType];
            if (oSearch && typeof oSearch.selectItem == 'function') {
                return oSearch.selectItem(oItemConfig);
            } else {
                throw new Error('[SearchUtil] Invalid search type');
            }
        },

        /**
         * @param {String} sType The type of search this is
         * @param {Object} oSearch The search constants
         * @param {Object} oSearch.model
         * @param {Object} oSearch.criteriaDefaults
         * @param {Object=} oSearch.criteriaValidation
         */
        register : function(sType, oSearch) {
            REGISTRY[sType] = oSearch;
        },

        /**
         * Utility to highlight the search value in some display text.
         * 
         * @param {String} sText The text to display
         * @param {String} sSearchValue The search value to highlight
         * @param {String} sMarkupStart The html start tag
         * @param {String} sMarkupEnd The html end tag
         * @inner
         */

        getHighlightedMarkup : function(sText, sSearchValue, sMarkupStart, sMarkupEnd, isEscapedText) {
            function escapeTextIfNeeded(sText) {
                return isEscapedText ? sText : $.sap.encodeHTML(sText);
            }
            if (sSearchValue) {
                var oRegex = new RegExp(sSearchValue, "i");
                var regResult = sText.match(oRegex);
                if (regResult) {
                    var part1 = sText.substring(0, regResult.index);
                    var part2 = sText.substr(regResult.index, sSearchValue.length);
                    var part3 = sText.substr(regResult.index + sSearchValue.length);
                    return escapeTextIfNeeded(part1) + sMarkupStart + escapeTextIfNeeded(part2) + sMarkupEnd + escapeTextIfNeeded(part3);
                } else {
                    return escapeTextIfNeeded(sText, isEscapedText);
                }
            } else {
                return escapeTextIfNeeded(sText, isEscapedText);
            }
        }
    };
    $.sap.setObject('sap.sf.surj.shell.util.SearchUtil', SearchUtil);
    return SearchUtil;
});