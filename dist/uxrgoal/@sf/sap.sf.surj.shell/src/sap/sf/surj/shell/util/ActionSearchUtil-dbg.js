/**
 * TODO: Need to make sure sapui5 is not a dependency from this file, or any
 * dependant files
 * 
 * TODO: We can remove the jQuery dependency by refactoring all usages of jQuery
 * to safe alternatives However, we may want to start allowing jQuery hard
 * dependencies sooner or later
 * 
 * @fileDescription The ActionSearchUtil, initially created for use in the
 *                  Responsive Header, or the one which only displays on smaller
 *                  screens but should also be used by the JUIC-based one as
 *                  well.
 */

sap.ui.define('sap/sf/surj/shell/util/ActionSearchUtil', [
        'jquery.sap.global',
        'sap/sf/surj/shell/util/SearchUtil',
        'sap/sf/surj/shell/util/DeferredUtil',
        'sap/sf/surj/shell/util/LinkUtil',
        'sap/sf/surj/shell/util/Util',
        'sap/sf/surj/shell/util/SMRF',
        'jquery.sap.storage'
    ], function($, SearchUtil, DeferredUtil, LinkUtil, Util, SMRF) {

    var DEFAULT_PAGE_SIZE = 10;

    var ActionSearchUtil = {
        /**
         * Check if the current page context is acceptable for the requested pageContext.
         *
         * @param {String} sPageContextUrl
         * @return {Boolean}
         */
        isRunningInContext: isRunningInContext,

        /**
         * Show a confirmation message to redirect to a different page before executing the action.
         * Or show an error message if redirecting is not supported because your on a 3rd party page
         * and session storage is not supported.
         *
         * @param {String} sFailureReason
         * @param {Function} fnCallback
         */
        showRedirectConfirmationMessage: showRedirectConfirmationMessage,

        /**
         * @param {String} sType
         * @param {Object} oCriteria
         * @param {Object} oResponse
         * @param {Integer} iPageIndex
         * @param {Object=} oCrumbs Crumbs to accumulate processing each page
         */
        createResponse: createResponse,

        /**
         * In this context, a "quickcard" is one type of Action Item. A handler
         * will be invoked when this actionItem is processed. In some cases a
         * subject is expected (i.e. transitive action) and other cases you just
         * want actionParameters as first argument.
         * 
         * Set the "subjectExpected" option to true if you'd prefer the subject
         * directly as first argument, instead of a parameters object with
         * subject as an attribute.
         * 
         * @param {Object} oOptions
         */
        registerQuickcardHandler : function(oOptions) {
            var oConfig = $.extend({
                actionContext : window,
                subjectExpected : false
            }, oOptions);
            var fnHandler;
            if (oConfig.subjectExpected) {
                /*
                 * If subject is expected, the standard function arguments
                 * (subject, referenceId, actionParams) are passed to the
                 * actionHandler.
                 */
                fnHandler = $.proxy(oOptions.actionHandler, oOptions.actionContext);
            } else {
                /*
                 * If subject is not expected, then a parameters object is
                 * passed to the actionHandler, which contains the
                 * actionParameters plus subject and referenceId as attributes
                 * in one config object.
                 */
                fnHandler = function(oSubject, sReferenceId, oActionParams, oTarget) {
                    return oConfig.actionHandler.call(oConfig.actionContext, $.extend({}, {
                        subject : oSubject,
                        target : oTarget,
                        referenceId : sReferenceId
                    }, oActionParams));
                };
            }
            $.sap.setObject(oOptions.actionName + '.openActionQuickCard', fnHandler);
        },

        /**
         * Perform the given action, as returned by the back-end.
         * 
         * @example <code>
         * ActionSearchUtil.performAction({
         *   item : { 
         *     itemType : "adminlink", 
         *     actionTarget: "/ui/juic/js/components/sfMessageBox.js|SFMessageBox.alert('Hello World')" 
         *   }
         * });
         * </code>
         * 
         * @param {Object} oItemConfig
         * @param {Object} oItemConfig.allowAdminLink Admin links are less
         *            secure
         * @param {Object} oItemConfig.item An action item
         * @param {Object} oItemConfig.subject A selected subject for that
         *            action item is being performed on, i.e. a user or some
         *            other object.
         */
        performAction : function(oItemConfig, bForceContext) {
            // We should only hit the actionsearch item after a redirect happens, if that was required
            var oActionItem = oItemConfig.item;
            if (oActionItem.transitive && !oItemConfig.subject) {
                throw new Error('[ActionSearchUtil] Make sure to select a subject first.');
            }
            if (!bForceContext && !isActionableInCurrentContext(oActionItem)) {
                redirectAction(oItemConfig);
            } else {
                if (!oItemConfig.skipHit) {
                    ActionSearchUtil.hitActionSearchItem(oItemConfig);
                }
                if (isAdminLink(oActionItem)) {
                    handleAdminLink(oItemConfig);
                } else {
                    switch (oActionItem.actionType) {
                    case 'dynamicLink':
                    case 'quickcard':
                        return handleQuickcardAction(oItemConfig);
                    case 'link':
                        handleLinkAction(oItemConfig);
                        break;
                    }
                }
            }
        },

        /**
         * Notify the server of the given action being beformed. Some other
         * information is required, including the response and criteria used to
         * generate the action that is being performed.
         * 
         * @param {Object} oItemConfig
         * @param {Object} oItemConfig.item The selected action item
         * @param {Object} oItemConfig.totalCount The total number of items
         *            that match criteria
         * @param {Object} oItemConfig.criteria The criteria request that
         *            generated this item
         * @param {String} oItem.criteria.searchValue The user entered search
         *            value that was used to generate this item
         */
        hitActionSearchItem : function(oItemConfig) {
            var oActionItem = oItemConfig.item;
            var oParams = {
                totalCount : oItemConfig.totalCount || 0,
                activateIndex : oItemConfig.activateIndex || 0,
                showAllClicked : !!oItemConfig.showAllClicked,
                actionId : oActionItem.actionId,
                actionLabel : oActionItem.actionLabel,
                keywords : (oItemConfig.criteria && oItemConfig.criteria.searchValue) || null,
                score : oActionItem.score || 0,
                actionHits : oActionItem.actionHits || 0
            };
            /*
             * Notify service of action usage. Currently the response is
             * ignored.
             */
            return DeferredUtil.createDeferred($.extend(({
                ODataService : {
                    data : oParams
                },
                ajaxService : {
                    arguments : [oParams]
                }
            })[SERVICE_TYPE], HIT_ACTION_SEARCH_ITEM_SERVICE[SERVICE_TYPE]));
        },

        /**
         * Generates a redirect link by storing the oItemConfig in sessionStorage and then creating
         * a link that can be redirected that will execute the action with the correct context.
         *
         * @param oItemConfig
         * @param {String} a url string or null if the redirect link can't be created
         */
        generateRedirectLink: function(oItemConfig, bFromMessageService) {
            var sUrl = getRedirectLinkUrl(oItemConfig);
            if (Util.isRunningBaseDomain()) {
                var oStorage = getActionStorage();
                var sParamName, sParamValue;
                if (oStorage) {
                    var sActionToken = ''+new Date().getTime();
                    oStorage.put(sActionToken, oItemConfig);
                    sParamName = 'actionToken';
                    sParamValue = sActionToken;
                } else {
                    sParamName = 'actionFailure';
                    sParamValue = 'storage';
                }
                return Promise.resolve(composeUrl(sUrl, sParamName, sParamValue));
            } else if (!bFromMessageService) {
                // If not running in base domain, use the message service to get the redirect url
                // This will use a hidden IFRAME in base domain, then recall this same function with the oItemConfig
                return Util.getMessageService(getRedirectDeepLink(oItemConfig), true).then(function(oMessageService) {
                    return oMessageService.sendTransaction({
                        request: 'performAction',
                        response: 'actionRedirect',
                        parameter: oItemConfig
                    }).then(function(sUrl) {
                        return Util.ensureBaseDomain(sUrl);
                    });
                }).catch(function(reason) {
                    $.sap.log.error('Could not generate redirect action link', reason);
                    return Promise.resolve(composeUrl(sUrl, 'actionFailure', 'messageService'));
                });
            } else {
                // Prevent an infinite loop if the message service itself is not on base domain
                return Promise.resolve(composeUrl(sUrl, 'actionFailure', 'messageService'));
            }
        },

        /**
         * Should be called when page starts up to check if an action should startup on the page.
         * This will check if there is a pending action to be executed from a page redirect.
         */
        checkRedirectAction: function() {
            $.when(
                DeferredUtil.whenUI5LibraryCSSReady(),
                DeferredUtil.whenLowPriority('LOWEST')
            ).done(function() {
                var oStorage = getActionStorage();
                if (oStorage) {
                    var sActionToken = Util.findURLParam('actionToken');
                    if (sActionToken) {
                        var oItemConfig = oStorage.get(sActionToken);
                        if (oItemConfig) {
                            oStorage.remove(sActionToken);
                            ActionSearchUtil.performAction(oItemConfig, true);
                        }
                    }
                } 
            });
        }
    };

    SearchUtil.register('TransitiveAction', {
        /**
         * Search provider for People with transitive action.
         * 
         * @param {Object} oCriteria
         * @param {String} oCriteria.searchValue
         * @param {Integer} oCriteria.maxresults
         * @param {String=} oCriteria.actionId
         * @param {Array.<String>=} oCriteria.keys
         * @param {Array.<String>=} oCriteria.existingActionIds
         */
        search : function(oCriteria) {
            var oRequest = {
                queryType : oCriteria.queryType,
                keywords : oCriteria.searchValue,
                keys : oCriteria.keys,
                actionStartNum : 0,
                actionPageSize : 0,

                // TODO: Will this change?
                peopleStartNum : 0,
                peoplePageSize : oCriteria.maxresults || DEFAULT_PAGE_SIZE,
                actionId : oCriteria.actionId,
                existingActionIds : oCriteria.existingActionIds
            };
            return DeferredUtil.createDeferred($.extend(({
                ODataService : {
                    data: oRequest
                },
                ajaxService : {
                    arguments: [oRequest]
                }
            })[SERVICE_TYPE], SEARCH_SERVICE[SERVICE_TYPE])).then(function(oResponse) {
                return createResponse('People', oCriteria, normalizeResponse(oResponse), 0) || createResponse('Ext', oCriteria, oResponse, 0);
            });
        }
    });

    SearchUtil.register('Action', {
        /**
         * Search provider for Action.
         * 
         * @param {Object} oCriteria
         * @param {String} oCriteria.searchValue
         * @param {Integer} oCriteria.maxresults
         * @param {String=} oCriteria.actionId
         * @param {Array.<String>=} oCriteria.keys
         * @param {Array.<String>=} oCriteria.existingActionIds
         */
        search : function(oCriteria) {
            var oRequest = {
                queryType : 'action',
                keywords : oCriteria.searchValue,
                keys : oCriteria.keys,
                actionStartNum : 0,
                actionPageSize : oCriteria.maxresults || DEFAULT_PAGE_SIZE,
                peopleStartNum : 0,
                peoplePageSize : 0,
                actionId : oCriteria.actionId,
                existingActionIds : oCriteria.existingActionIds,
                sourceType : oCriteria.sourceType,
                requireDeeplinks : !Util.isRunningBaseDomain() && !Util.isBaseDomainCORSEnabled()
            };
            return DeferredUtil.createDeferred($.extend(({
                ODataService : {
                    data : oRequest
                },
                ajaxService : {
                    arguments : [ oRequest ]
                }
            })[SERVICE_TYPE], SEARCH_SERVICE[SERVICE_TYPE])).then(function(oResponse) {
                return createResponse('Action', oCriteria, normalizeResponse(oResponse), 0);
            });
        },

        /**
         * Handle selecting an action.
         * 
         * @param {Object} oItemConfig.item The item being selected
         * @param {Object} oItemConfig.subject The subject (i.e. user) to a
         *            transitive action
         * @param {Object} oItemConfig.criteria The criteria used to produce
         *            this item
         */
        selectItem : function(oItemConfig) {
            ActionSearchUtil.performAction(oItemConfig);
        }
    });

    SearchUtil.register('CopilotAction', {
        /**
         * Handle selecting an action.
         * 
         * @param {Object} oItemConfig.item The item being selected
         * @param {Object} oItemConfig.subject The subject (i.e. user) to a
         *            transitive action
         * @param {Object} oItemConfig.criteria The criteria used to produce
         *            this item
         */
        selectItem : function(oItemConfig) {
            ActionSearchUtil.performAction(oItemConfig);
        }
    });

    /** @inner The landing page for any action not defining a custom pageContextUrl. */
    var DEFAULT_PAGE_DEEPLINK = "/sf/start";
    var ADMIN_DEEPLINK = "/sf/admin";
    var WINDOW_OPTIONS = {};

    /**
     * Redirect the given oItemConfig to a different page before executing the given action.
     * This requires session storage to function properly, otherwise an error will be displayed.
     *
     * @param {Object} oItemConfig
     * @param {Boolean} confirmed
     */
    function redirectAction(oItemConfig) {
        showBusyDialog(ActionSearchUtil.generateRedirectLink(oItemConfig).then(function(sUrl) {
            var oParam = Util.decodeParam(sUrl);
            var sFailureReason = oParam && oParam.actionFailure;
            showRedirectConfirmationMessage(sFailureReason, function(oWinOptions) {
                LinkUtil.gotoURL(sUrl, false, oWinOptions);
            });
        }));
    }

    /**
     * Get the deeplink backup for an action item redirect.
     *
     * @param {Object} oItemConfig
     * @return {String}
     */
    function getRedirectDeepLink(oItemConfig) {
        var oActionItem = oItemConfig && oItemConfig.item;
        return (oActionItem && oItemConfig.item.pageContextUrl) ||
            (isAdminLink(oActionItem) ? ADMIN_DEEPLINK : DEFAULT_PAGE_DEEPLINK) + "?_actionRedirect=true";
    }

    /**
     * Get the URL that this action item would redirect to without the token
     *
     * @param {Object} oItemConfig
     * @return {String} The base url for redirecting for this item
     */
    function getRedirectLinkUrl(oItemConfig) {
        return Util.ensureBaseDomain(getRedirectDeepLink(oItemConfig));
    }

    /**
     * Compose a url with params, adding ? or &
     *
     * @inner
     * @param sUrl
     * @param oParam
     * @return {String}
     */
    function composeUrl(sUrl, sParamName, sParamValue) {
        var oParam = {};
        oParam[sParamName] = sParamValue;
        return sUrl + (sUrl.indexOf('?') >= 0 ? '&' : '?') + $.param(oParam);
    }

    /**
     * Get a reference to the session storage location for an action executed as a redirect.
     * If the return is null, then action storage will not be supported.
     *
     * @inner
     * @return {jQuery.sap.storage.Storage} The storage to use, or null if not supported
     */
    function getActionStorage() {
        var sAjaxToken = window.ajaxSecKey;
        if (sAjaxToken) { // There must be an active session to activate this
            var oStorage = $.sap.storage('session', '_ActionSearch_'+sAjaxToken);
            if (oStorage.isSupported()) {
                return oStorage;
            }
        }
        return false;
    }

    /**
     * @param {Object} oActionItem
     * @return {Boolean}
     */
    function isAdminLink(oActionItem) {
        if (oActionItem) {
            var sActionTarget = oActionItem.actionTarget;
            return oActionItem.sourceType == 'adminlink' && typeof sActionTarget == 'string' && sActionTarget.indexOf('javascript:') == 0;
        }
        return false;
    }

    /**
     * Check if the given action item can execute now in the current page context. If not
     * Then a page redirect is required.
     *
     * @inner
     * @param {Object} oItemConfig
     * @return {Boolean}
     */
    function isActionableInCurrentContext(oActionItem) {
        var sActionType = oActionItem.actionType;
        var sPageContextUrl = oActionItem.pageContextUrl;
        if ((sActionType == 'link' && !isAdminLink(oActionItem)) || sPageContextUrl == '*') {
            return true;
        } else if (!Util.isRunningBaseDomain()) {
            return false;
        }
        if (isAdminLink(oActionItem) || sPageContextUrl == '/sf/admin') {
            return !!window.isAdminHomepage;
        }
        return sPageContextUrl == null || window.location.pathname == sPageContextUrl;
    }

    /**
     * Check if the current page context is acceptable for the requested pageContext.
     *
     * @param {String} sPageContextUrl
     * @return {Boolean}
     */
    function isRunningInContext(sPageContextUrl) {
        if (Util.isRunningBaseDomain()) {
            var sPageContextUrl = Util.ensureBaseDomain(sPageContextUrl);
            if (sPageContextUrl == '/sf/admin') {
                // This code had a reference to PLT-57367
                // Copying logic from /au-performancemanagement/au-performancemanagement-web/src/main/webapp/ui/admin/js/launchform/launchForm.js
                if (window.isAdminHomepage) {
                    return true;
                }
            }
            return window.location.pathname == sPageContextUrl;
        }
        return false;
    }

    /**
     * Show a confirmation message to redirect to a different page before executing the action.
     * Or show an error message if redirecting is not supported because your on a 3rd party page
     * and session storage is not supported.
     *
     * @param {String} sFailureReason
     * @param {Function} fnCallback
     */
    function showRedirectConfirmationMessage(sFailureReason, fnCallback) {
        // UI-19788 No longer show any confirmation if there was no failure
        if (!sFailureReason) {
            fnCallback();
            return;
        }
        sap.ui.require(['sap/m/MessageBox'], function(MessageBox) {
            var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
            var sYes = rb.getText('COMMON_Yes');
            var sNo = rb.getText('COMMON_No');
            var sFailureSuffix = (sFailureReason ? '_' + sFailureReason : '');
            MessageBox.alert(rb.getText('COMMON_Action_Requires_Redirect'+sFailureSuffix), {
                actions: [sYes, sNo],
                onClose: function(sAction) {
                    if (sAction == sYes) {
                        fnCallback();
                    }
                }
            });
        });
    }

    /**
     * Show a busy dialog while the promise is pending.
     *
     * @param {Promise} oPromise
     * @param {Integer} iDelay The delay before showing the BusyDialog.
     */
    function showBusyDialog(oPromise, iDelay) {
        var oBusy, bDone = false;
        var iTimeoutID = setTimeout(function() {
            sap.ui.require(['sap/m/BusyDialog'], function(BusyDialog) {
                oBusy = !bDone && (new BusyDialog().open());
            });
        }, iDelay || 100);
        oPromise.catch(function() {}).then(function() {
            bDone = true;
            clearTimeout(iTimeoutID);
            if (oBusy) {
                oBusy.close();
                oBusy.destroy();
            }
        });
    }

    /**
     * Handle a quickcard action. In this context a quickcard action is one
     * which can be executed using the current page without navigating the
     * window.
     * 
     * The actionTarget will be one or two fragments separated by "|" character
     * The last fragment is always the action name, which will be a global variable where the action handler will be located
     * The first fragment, if present, will split into groups by a semi-colon ";" each group will be comma-separated list
     * of javascript files. Files in each group will execute in parallel, and each group will wait for the previous group
     * to complete before starting.
     * 
     * Different Javascript file types are supported:
     * 1) as a UI5 path like: "sap/sf/module/file"; this goes through sap.ui.require()
     * 2) as a SMRF path like: "/ui/module/js/file.js", "ajaxservice:module.controller"; this goes through SMRF.load
     * 
     * @inner
     * @param {Object} oItemConfig
     * @param {Object} oItemConfig.item
     * @param {String} oItemConfig.item.actionTarget
     * @param {Object} oItemConfig.subject
     * @param {String} oItemConfig.referenceId
     */
    function handleQuickcardAction(oItemConfig) {
        var oActionItem = oItemConfig.item;
        var sActionTarget = oActionItem && oActionItem.actionTarget;
        var aFragments = sActionTarget && sActionTarget.split('|');
        if (!sActionTarget) { // No action don't continue
            return Promise.resolve();
        }

        var aGroups;
        if (aFragments && aFragments.length > 1) {
            aGroups = aFragments[0].split(';').map(function(sFrag) {
                return sFrag.split(',');
            });
        } else {
            aGroups = [];
        }
        var iGroupIndex = 0; // Index increases as dependencies are loaded
        var sActionName = aFragments && aFragments[aFragments.length - 1];
        var oActionArgs = oItemConfig.actionArgs;

        /*
         * Optionally specified actionArgs, versus default arguments (subject,
         * referenceId, actionParams).
         */
        if (oActionArgs && !$.isArray(oActionArgs)) {
            oActionArgs = [ oActionArgs ];
        }
        // Default to using (subject, referenceId, actionParams)
        if (!$.isArray(oActionArgs)) {
            var oActionParams = oItemConfig.actionParams || {
                actionId : oActionItem.actionId,
                actionLabel : oActionItem.actionLabel
            };
            oActionArgs = [ oItemConfig.subject, oItemConfig.referenceId, oActionParams, oItemConfig.target ];
        }

        /**
         * Called when the dependencies are resolved.
         * 
         * @inner
         */
        function executeAction() {
            // Allows dot syntax, i.e. "sap.sf.module.ActionCard"
            var oAction = $.sap.getObject(sActionName);
            var fOpen = oAction && oAction.openActionQuickCard;
            if (fOpen) {
                /*
                 * TODO: We should set subject and referenceId into
                 * oActionParams and pass one argument, but this is already the
                 * API defined by the old ActionSearch.
                 */
                return fOpen.apply(oAction, oActionArgs);
            } else {
                $.sap.log.error('ActionSearchUtil: cannot find ' + sActionName + '.openActionQuickCard()');
            }
        }

        /**
         * Load one group of files.
         * 
         * @param {Array.<String>} aFiles 
         * @return {Promise} A promise when the files have finished loading.
         * @inner
         */
        function loadGroup(aFiles) {
            if (!aFiles || aFiles.length == 0) {
                return Promise.resolve();
            }

            var aSmrfFiles = [];
            var aRequireFiles = [];
            // Separate files that go through Util.includeScripts and sap.ui.require
            // Files that end with ".js" or ".css" will go through Util.includeScripts, also "ajaxservice:" urls too
            aFiles.forEach(function(f) {
                /\.(js|css)$/.test(f) || f.indexOf("ajaxservice:") == 0 ? aSmrfFiles.push(f) : aRequireFiles.push(f);
            });
            var aPromises = [];
            if (aRequireFiles.length > 0) {
                aPromises.push(new Promise(function(res, rej) {
                    sap.ui.require(aRequireFiles, res, rej);
                }));
            }
            if (aSmrfFiles.length > 0) {
                aPromises.push(Util.includeScripts(aSmrfFiles));
            }
            // Make the callback after all Util.includeScripts and sap.ui.require are finished
            return Promise.all(aPromises);
        }

        /**
         * Load all the dependencies for this actionTarget.
         * 
         * @return {Promise} A promise to resolve when all dependencies have resolved.
         * @inner
         */
        function loadDependencies() {
            // Exit condition for the recursion, if there are no more groups to load, resolve now.
            if (iGroupIndex >= aGroups.length) {
                return Promise.resolve();
            } else {
                // Load the next group of files, then recursively call the same function again.
                return loadGroup(aGroups[iGroupIndex++]).then(loadDependencies);
            }
        }

        return loadDependencies().then(executeAction).catch(function(reason) {
            $.sap.log.error('Could not load files, reason: ', reason);
        });
    }
    
    /**
     * Handle the launch forms admin type links.
     * 
     * @inner
     * @param {Object} oItemConfig
     */
    function handleAdminLink(oItemConfig) {
        var oItem = oItemConfig.item;
        
        // This code is following the example in sfActionSearchBox._handleAdminLink
        // Expecting: "javascript:createLinkModalComponent(['/ui/admin/js/launchform/launchForm.js'],'LaunchFormController',{formType:'PM'});"
        var sUrl = oItem.actionTarget;
        var sStatement = 'new ' + sUrl.substring(11); // strip off "javascript:" prefix

        function executeAction() {
            setTimeout(function(){
                eval(sStatement);
            }, 100);
        }

        Util.includeScripts(['/ui/admin/js/portlets/admModalLinkComponent.js', '/ui/admin/js/launchform/launchForm.js']).then(executeAction);
    }

    /**
     * A link action is one which navigates the window.
     * 
     * @inner
     * @param {Object} oItemConfig
     * @param {Object} oItemConfig.item The item selected
     * @param {String} oItemConfig.item.actionTarget The url
     * @param {Object=} oItemConfig.subject The transitive action's subject
     */
    function handleLinkAction(oItemConfig) {
        var oItem = oItemConfig.item;
        var sUrl = oItem.actionTarget;
        if (sUrl) {
            var oParams = {};
            var oSubject = oItemConfig.subject;
            if (oSubject) {
                oParams.userid = oSubject.userId;
                oParams.username = oSubject.userName;
                oParams.id = oSubject.id;
            }
            for ( var sAttr in oParams) {
                var oValue = oParams[sAttr];
                sUrl = sUrl.replace('${' + sAttr + '}', typeof oValue != undefined ? encodeURIComponent('' + oValue) : '');
            }

            // Action Search allows user to fudge the url like this "www.google.com"
            var sLowerCasedUrl = sUrl.toLowerCase();
            if (sLowerCasedUrl.indexOf('/') != 0 && sLowerCasedUrl.indexOf('./') != 0 && sLowerCasedUrl.indexOf('#') != 0 && sLowerCasedUrl.indexOf('http://') != 0 && sLowerCasedUrl.indexOf('https://') != 0 && sLowerCasedUrl.indexOf('mailto:') != 0) {
                sUrl = window.location.protocol + '//' + sUrl;
            }

            LinkUtil.gotoURL(Util.ensureBaseDomain(sUrl), !Util.isBizXDomain(sUrl) && !Util.isBaseDomainCORSEnabled(), getWindowOptions(oItem));
        }
    }

    /**
     * @private
     * @param {Object} oItem
     * @return {Object}
     */
    function getWindowOptions(oItem) {
        return oItem.linkType === "3" ? {} : undefined;
    }

    SearchUtil.register('ActionPeople', {
        /**
         * Search provider for ActionPeople.
         * 
         * @param {Object} oCriteria
         * @param {String} oCriteria.searchValue
         * @param {String} oCriteria.queryType Defaults to 'ActionPeople'
         * @param {Integer} oCriteria.maxresults
         * @param {String=} oCriteria.actionId
         * @param {Array.<String>=} oCriteria.keys
         * @param {Array.<String>=} oCriteria.existingActionIds
         */
        search : function(oCriteria) {
            var oRequest = {
                queryType : 'people_action',
                keywords : oCriteria.searchValue,
                keys : oCriteria.keys,
                actionStartNum : 0,
                actionPageSize : oCriteria.maxresults || DEFAULT_PAGE_SIZE,
                peopleStartNum : 0,
                peoplePageSize : oCriteria.maxresults || DEFAULT_PAGE_SIZE,
                actionId : oCriteria.actionId,
                existingActionIds : oCriteria.existingActionIds,
                requireDeeplinks : !Util.isRunningBaseDomain() && !Util.isBaseDomainCORSEnabled()
            };
            return DeferredUtil.createDeferred($.extend(({
                ODataService : {
                    data : oRequest
                },
                ajaxService : {
                    arguments : [oRequest]
                }
            })[SERVICE_TYPE], SEARCH_SERVICE[SERVICE_TYPE])).then(function(oResponse) {
                oResponse = normalizeResponse(oResponse);
                var aItems = [];
                SEARCH_TYPES.forEach(function(sType) {
                    var oResult = createResponse(sType, oCriteria, oResponse, 0);
                    if (oResult && oResult.items && oResult.items.length > 0) {
                        aItems.push(oResult);
                    }
                });

                /*
                 * If one of the query types returned a result, then this
                 * becomes a search result for just that query type.
                 */
                if (aItems.length == 1) {
                    return aItems[0];
                } else {
                    $.each(aItems, function(i, oItem) {
                        var aTypeItems = oItem.items;
                        var iMultipleLimit = TYPE_INFO[oItem.type].multipleLimit;
                        /*
                         * Limit each individual item response, like people to 6
                         * and actions to 3. The "more" function will just
                         * return the original response, but with only the few
                         * items that were removed.
                         */
                        if (aTypeItems && aTypeItems.length > iMultipleLimit) {
                            oItem.items = aTypeItems.splice(iMultipleLimit, aTypeItems.length - iMultipleLimit);
                            aItems[i] = {
                                type : oItem.type,
                                items : aTypeItems,
                                hasMore : true,
                                totalCount : oItem.totalCount,
                                more : function() {
                                    return $.Deferred().resolve(oItem).promise();
                                }
                            };
                        }
                    });
                    return {
                        items : aItems,
                        multiple : aItems.length > 1,
                        hasMore : false,
                        type : 'ActionPeople'
                    };
                }
            });
        }
    });

    // ------------------------------------------------------
    // Constants
    // ------------------------------------------------------

    var SERVICE_TYPE = Util.findURLParam('odataActionSearch') != 'false' ? 'ODataService' : 'ajaxService';

    var SEARCH_SERVICE = {
        ODataService : {
            type : 'ODataService',
            serviceName : 'queryActionSearch',
            method : 'POST'
        },
        ajaxService : {
            type : 'ajaxService',
            serviceName : 'actionSearchController',
            serviceMethod : 'query'
        }
    };

    var LAZY_SEARCH_SERVICE = {
        ODataService : {
            type : 'ODataService',
            serviceName : 'lazyQueryActionSearch',
            method : 'POST'
        },
        ajaxService : {
            type : 'ajaxService',
            serviceName : 'actionSearchController',
            serviceMethod : 'lazyQuery'
        }
    };

    var HIT_ACTION_SEARCH_ITEM_SERVICE = {
        ODataService : {
            type : 'ODataService',
            serviceName : 'hitActionSearchItem',
            method : 'POST'
        },
        ajaxService : {
            type : 'ajaxService',
            serviceName : 'actionSearchController',
            serviceMethod : 'hitActionSearchItem'
        }
    };

    DeferredUtil.registerODataService({
        serviceAlias: '_ActionSearch_',
        serviceName: ['queryActionSearch', 'lazyQueryActionSearch', 'hitActionSearchItem']
    });
    DeferredUtil.finalizeODataRegistry({
        serviceAlias:'_ActionSearch_'
    });

    var SEARCH_TYPES = [ 'Action', 'CopilotAction', 'People' ];
    var TYPE_INFO = {
        People : {
            queryType : 'people',
            resultKey : 'peoples',
            itemsKey : 'items',
            indexKey : 'indexRef',
            countKey : 'totalCount',
            multipleLimit : 6
        },
        Action : {
            queryType : 'action',
            resultKey : 'actions',
            itemsKey : 'detailList',
            indexKey : 'startIndex',
            countKey : 'totalCount',
            multipleLimit : 3
        },
        CopilotAction : {
            queryType : 'copilot_action',
            resultKey : 'copilotActions',
            itemsKey : 'detailList',
            indexKey : 'startIndex',
            countKey : 'totalCount',
            multipleLimit : 3
        },
        Ext : {
            queryType : 'ext',
            resultKey : 'exts',
            itemsKey : 'detailList',
            indexKey : 'startIndex',
            countKey : 'totalCount'
        }
    };

    // ------------------------------------------------------
    // Utility Functions
    // ------------------------------------------------------

    /**
     * Add any action ids from the items to a list to keep track of all actionIds seen.
     * @param {Object} oCrumbs Crumbs to accumulate processing each page
     * @param {Object} oResult
     */
    function addActionIds(oCrumbs, aItems) {
        var aExistingActionIds = oCrumbs.existingActionIds = oCrumbs.existingActionIds || [];
        $.each(aItems, function(i, oItem) {
            aExistingActionIds.push(oItem.actionId);
        });
    }

    /**
     * Normalize the backend response.
     * @inner
     * @param {Object} oResponse
     */
    function normalizeResponse(oResponse) {
        oResponse = DeferredUtil.normalizeODataResponse(oResponse, 'GlobalSearchResultVO');
        if (oResponse.peoples && oResponse.peoples.items) {
            oResponse.peoples.items.forEach(function(oItem) {
                oItem.keys = oItem.keyValues;
                delete oItem.keyValues;
                if (oItem.employments) {
                    oItem.employments.forEach(function(oEmpl) {
                        oEmpl.employmentType = oEmpl.employmentTypeStr;
                        delete oEmpl.employmentTypeStr;
                    });
                }
            });
        }
        return oResponse;
    }

    /**
     * @param {String} sType
     * @param {Object} oCriteria
     * @param {Object} oResponse
     * @param {Integer} iPageIndex
     * @param {Object=} oCrumbs Crumbs to accumulate processing each page
     */
    function createResponse(sType, oCriteria, oResponse, iPageIndex, oCrumbs) {
        oCrumbs = oCrumbs || {};
        var oInfo = TYPE_INFO[sType];
        var oResult = oResponse && oResponse[oInfo.resultKey];
        if (oResult) {
            var aItems = oResult[oInfo.itemsKey];
            var iTotalCount = oCrumbs.totalCount;
            // UI-10021 the totalCount should only be read from the first response and should not change
            if (iTotalCount == null) {
                iTotalCount = oResult[oInfo.countKey];
            }
            var iCurrentPageCount = aItems ? aItems.length : 0;
            var iLastIndex = 0;
            if (iCurrentPageCount > 0) {
                for (var i=0; i<iCurrentPageCount; i++) {
                    var oItem = aItems[i];
                    var iIndex = oItem[oInfo.indexKey];
                    if (iIndex > iLastIndex) {
                        iLastIndex = iIndex;
                    }
                }
            }
            var iNextPageIndex = iPageIndex + 1;
            var iNextStartIndex;
            var iMaxResults = oCriteria.maxresults || DEFAULT_PAGE_SIZE; 
            if (iLastIndex === 0 || isNaN(iLastIndex)) {
                iNextStartIndex = iNextPageIndex * iMaxResults;
            } else {
                iNextStartIndex = iLastIndex + 1;
            }
            if (sType == 'Action' || sType == 'CopilotAction') {
                addActionIds(oCrumbs, aItems);
            }

            // If sample actions are enabled, then filter sample actions
            if (ActionSearchUtil._sampleActions) {
                var sSearchText = oCriteria && oCriteria.searchValue;
                var aSamples = oCrumbs.samples;
                if (!aSamples) { // only initialize actions if the crumbs didn't already contain them
                    aSamples = SAMPLES[sType];
                    if (aSamples && sSearchText) {
                        sSearchText = sSearchText.toLowerCase();
                        aSamples = aSamples.filter(function(oSample) {
                            var sLabel = oSample.actionLabel || oSample.label || oSample.name;
                            if (sLabel && (''+sLabel).toLowerCase().indexOf(sSearchText) >= 0) {
                                return true;
                            }
                            var keyValues = oSample.keyValues;
                            if (keyValues) {
                                for (var sKey in keyValues) {
                                    var value = keyValues[sKey];
                                    if (value && (''+value).toLowerCase().indexOf(sSearchText) >= 0) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        });
                    } else {
                        aSamples = [];
                    }
                    oCrumbs.samples = aSamples;
                    aItems.push.apply(aItems, aSamples);
                    var iSampleCount = aSamples.length;
                    iCurrentPageCount += iSampleCount;
                    iTotalCount += iSampleCount;
                }
            }

            oCrumbs.totalCount = iTotalCount;

            // UI-10626 It could have more items when below two conditions match.
            // 1) the number of items returned from backend < totalCount
            // 2) the number of items for current page returned from backend > 0
            var iTotalReturned = oCrumbs.totalReturned = (oCrumbs.totalReturned || 0) + iCurrentPageCount;
            var bHasMore = iCurrentPageCount > 0 && iTotalReturned < iTotalCount;

            return {
                type : sType,
                items : aItems,
                hasMore : bHasMore,
                totalCount : iTotalCount,
                more : bHasMore ? function() {
                    return createLazyDeferred(sType, oCriteria, iNextStartIndex, iNextPageIndex, oCrumbs);
                } : null
            };
        }
    }

    /**
     * @inner
     * @param {String} sType
     * @param {Object} oCriteria
     * @param {String} oCriteria.searchValue,
     * @param {Array} oCriteria.keys
     * @param {Integer} iStartIndex
     * @param {Integer} iPageIndex
     * @param {Object} oCrumbs Crumbs to accumulate processing each page
     */
    function createLazyDeferred(sType, oCriteria, iStartIndex, iPageIndex, oCrumbs) {
        var oInfo = TYPE_INFO[sType];
        var oRequest = {
            queryType : oInfo.queryType,
            keywords : oCriteria.searchValue,
            keys : oCriteria.keys,
            actionId : oCriteria.actionId,
            sourceType : oCriteria.sourceType
        };
        var oPagination = {
            startIndex : iStartIndex,
            pageSize : oCriteria.maxresults
        };
        if (sType == 'Action') {
            oRequest.existingActionIds = oCrumbs.existingActionIds;
        }
        return DeferredUtil.createDeferred($.extend(({
            ODataService : {
                data : { params: oRequest, pagination: oPagination}
            }, ajaxService : {
                arguments : [oRequest, oPagination]
            }
        })[SERVICE_TYPE], LAZY_SEARCH_SERVICE[SERVICE_TYPE])).then(function(oResponse) {
            return createResponse(sType, oCriteria, normalizeResponse(oResponse), iPageIndex, oCrumbs) || {
                type : sType,
                items : [],
                hasMore : false
            };
        });
    }

    // A testing action
    ActionSearchUtil.registerQuickcardHandler({
        actionName: '_testActionSearch',
        actionHandler: function(oItemConfig) {
            sap.ui.require(['sap/m/MessageBox'], function(MessageBox) {
                MessageBox.alert(JSON.stringify(oItemConfig, null, 4));
            });
        }
    });

    ActionSearchUtil.registerQuickcardHandler({
        actionName: '_PP3EditDialog',
        subjectExpected: true,
        actionHandler: function(command, item, user) {
            SMRF.load(['/ui/peopleprofile/js/actionSearchPopup.js'], function() {
                showPP3EditDialog(command, item, user);
            });
        }
    });

    ActionSearchUtil._sampleActions = ('true' == Util.findURLParam('_sampleActions'));

    var SAMPLES = {
        Action : [{
            actionLabel: 'Sample Quickcard Action',
            actionTarget: '|_testActionSearch',
            actionType: 'quickcard'
        }, {
            actionLabel: 'Sample adminLink',
            actionTarget: 'javascript:sap.m.Dialog({title:"Hello",buttons:[new sap.m.Button({text:"ok",press:function(e){e.getSource().getParent().close()}})]}).open()',
            actionType: 'link',
            sourceType: 'adminlink'
        }, {
            actionLabel: 'Sample TransitiveAction',
            actionTarget: '|_testActionSearch',
            actionType: 'quickcard',
            transitive: true
        }, {
            actionLabel: 'Sample OrgChart',
            actionTarget: '/sf/orgchart?selected_user=cgrant1',
            actionType: 'link'
        }],

        Ext : [{
            id: 'ext1',
            label: 'Ext Label #1'
        }, {
            id: 'ext1',
            label: 'Ext Label #1'
        }]
    };
  
    $.sap.setObject('sap.sf.surj.shell.util.ActionSearchUtil', /** @lends sap.sf.surj.shell.util.AboutBoxUtil */ ActionSearchUtil);
    return ActionSearchUtil;
});
