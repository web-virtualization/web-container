sap.ui.define([
    './PostMessageAPI',
    './Util'
], function (PostMessageAPI, Util) {
    'use strict';

    /**
     * The FLP Services were generated from the following wiki.
     * @see https://wiki.wdf.sap.corp/wiki/display/unifiedshell/Post+Message+Service
     * 
     * Example usage:
     * 
     * sap.ui.require(['sap/sf/surj/shell/util/FLPServices'], function(FLPServices) {
     *   FLPServices.isIntentSupported(['#GenericWrapperTest-open']).then(function(oResponse) {
     *      var bSupported = oResponse['#GenericWrapperTest-open'].supported;
     *   });
     * });
     * 
     * @namespace sap.sf.surj.shell.util.FLPServices
     */

    var fnPostMessageResponseHandler = function (oBody) {
        return oBody.result;
    };

    return {
        /**
         * @return {Boolean} Are FLPServices supported
         */
        isSupported: function () {
            var sSapShellParam = Util.findURLParam('sap-shell');
            return (sSapShellParam &&
                sSapShellParam.toLowerCase() === 'flp' &&
                PostMessageAPI.isSupported());
        },

        CrossApplicationNavigation: {
            /**
             * This service function returns a string representing the URL hash to perform a cross application
             * navigation. For further details refer to the documentation of the corresponding service function.
             * The JSON below shows an expected message sample.
             * 
             * @param oArgs Example: {
             *     "target": {
             *         "semanticObject": "GenericWrapperTest",
             *         "action": "open"
             *     },
             *     "params": {
             *         "A": "B"
             *     }
             * }
             * @return {Promise.<String>} Example: "#GenericWrapperTest-open?A=B"
             */
            hrefForExternal: function (oArgs) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.hrefForExternal', {
                    oArgs: oArgs
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * Performs a window.history.go with number of steps back as specified by the iSteps parameter or one
             * step if iSteps is not provided. It expects a positive integer and performs a negation (iSteps * -1)
             * prior to calling window.history.go(iSteps)
             * 
             * @param iSteps Example: 3
             * @return {Promise.<Object>} Example: {}
             */
            historyBack: function (iSteps) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.historyBack', {
                    iSteps: iSteps
                });
            },

            /**
             * Deprecated - use getLinks instead. Resolves a given semantic object and business parameters to a
             * list of links, taking into account the form factor of the current device. For further details refer
             * to the documentation of the corresponding service function. The JSON below shows an expected message
             * sample.
             * 
             * @param sSemanticObject Example: "GenericWrapperTest"
             * @param mParameters Example: {
             *     "A": "B"
             * }
             * @param bIgnoreFormFactors Example: false
             * @return {Promise.<Array>} Example: [
             *     {
             *         "intent": "#GenericWrapperTest-open~6X1?A=B",
             *         "text": "GenericWrapper Test"
             *     }
             * ]
             */
            getSemanticObjectLinks: function (sSemanticObject, mParameters, bIgnoreFormFactors) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.getSemanticObjectLinks', {
                    sSemanticObject: sSemanticObject,
                    mParameters: mParameters,
                    bIgnoreFormFactors: bIgnoreFormFactors
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * (since 1.62.0) Resolves a given semantic object and business parameters to a list of links, taking
             * into account the form factor of the current device. For further details refer to the documentation
             * of the corresponding service function. The JSON below shows an expected message sample.
             * 
             * @param semanticObject Example: "GenericWrapperTest"
             * @param params Example: {
             *     "A": "B"
             * }
             * @return {Promise.<Array>} Example: [
             *     {
             *         "intent": "#GenericWrapperTest-open~6X1?A=B",
             *         "text": "GenericWrapper Test"
             *     }
             * ]
             */
            getLinks: function (semanticObject, params) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.getLinks', {
                    semanticObject: semanticObject,
                    params: params
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * Tells whether the given intent(s) are supported, taking into account the form factor of the current
             * device. "supported" means that navigation to the intent is possible. For further details refer to
             * the documentation of the corresponding service function. The JSON below shows an expected message
             * sample.
             * 
             * @param aIntents Example: [
             *     "#GenericWrapperTest-open",
             *     "#Action-showBookmark",
             *     "#Action-invalidAction"
             * ]
             * @return {Promise.<Object>} Example: {
             *     "#GenericWrapperTest-open": {
             *         "supported": true
             *     },
             *     "#Action-showBookmark": {
             *         "supported": true
             *     },
             *     "#Action-invalidAction": {
             *         "supported": false
             *     }
             * }
             */
            isIntentSupported: function (aIntents) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.isIntentSupported', {
                    aIntents: aIntents
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * (Since 1.32) Tells whether the given Navigation is supported. This is the same functionality as
             * isIntentSupported, but accepts a parameter format equivalent to toExternal/ hrefForExternal: It
             * accepts the Navigation Intent description to be an JavaScript object wit separate members for
             * SemanticObject, Action , Parameters etc. Not an already encoded Shell hash. See documentation for
             * details.
             * 
             * @param aIntents Example: [
             *     {
             *         "target": {
             *             "semanticObject": "GenericWrapperTest",
             *             "action": "open"
             *         }
             *     },
             *     {
             *         "target": {
             *             "semanticObject": "Action",
             *             "action": "showBookmark"
             *         },
             *         "parameters": {
             *             "P1": [
             *                 "V1"
             *             ]
             *         }
             *     }
             * ]
             * @return {Promise.<Array>} Example: [
             *     {
             *         "supported": true
             *     },
             *     {
             *         "supported": false
             *     }
             * ]
             */
            isNavigationSupported: function (aIntents) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.isNavigationSupported', {
                    aIntents: aIntents
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * Triggers the navigation to a specified external target. For further details refer to the
             * documentation of the corresponding service function. The JSON below shows an expected message
             * sample.
             * 
             * @param oArgs Example: {
             *     "target": {
             *         "semanticObject": "GenericWrapperTest",
             *         "action": "open"
             *     },
             *     "params": {
             *         "A": "B"
             *     }
             * }
             * @return {Promise.<Object>} Example: {}
             */
            toExternal: function (oArgs) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.toExternal', {
                    oArgs: oArgs
                });
            },

            /**
             * (since 1.32) Retrieves an app state object specified by a key. The JSON below shows an expected
             * message sample.
             * 
             * @param sAppStateKey Example: "AS123F74"
             * @return {Promise.<Object>} Example: {}
             */
            getAppStateData: function (sAppStateKey) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.getAppStateData', {
                    sAppStateKey: sAppStateKey
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * This function replaces the inner app route part of the hash of the launchpad. The JSON below shows
             * an expected message sample.
             * 
             * @param appSpecificRoute Example: "&/Second/0"
             * @return {Promise.<Object>} Example: {}
             */
            setInnerAppRoute: function (appSpecificRoute) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.setInnerAppRoute', {
                    appSpecificRoute: appSpecificRoute
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * This function updates the data of the in app state. This function also creates a new in app state if
             * no in app state has been created yet. The JSON below shows an expected message sample.
             * 
             * @param sData Example: "any kind of data as a string"
             * @return {Promise.<String>} Example: "ASYA2HQ9WDLNRRH0ORY2EE3SXM63LAUVGN323YHF"
             */
            setInnerAppStateData: function (sData) {
                return PostMessageAPI.sendRequest('sap.ushell.services.CrossApplicationNavigation.setInnerAppStateData', {
                    sData: sData
                }).then(fnPostMessageResponseHandler);
            }
        },

        ShellUIService: {
            /**
             * Sets a flag in the FLP container to indicate whether the user left unsaved changes in the
             * application.
             * 
             * @param bIsDirty Example: true
             * @return {Promise.<Object>} Example: {}
             */
            setDirtyFlag: function (bIsDirty) {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellUIService.setDirtyFlag', {
                    bIsDirty: bIsDirty
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * Sets the title of the shell. The JSON below shows an expected message sample.
             * 
             * @param sTitle Example: "application new title"
             * @return {Promise.<Object>} Example: {}
             */
            setTitle: function (sTitle) {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellUIService.setTitle', {
                    sTitle: sTitle
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * Sets the given hierarchy in the shell header. The JSON below shows an expected message sample.
             * 
             * @param aHierarchyLevels Example: [
             *     {
             *         "title": "Main View",
             *         "icon": "sap-icon://documents",
             *         "intent": "#Action-sameApp"
             *     },
             *     {
             *         "title": "View 2",
             *         "subtitle": "Application view number 2",
             *         "intent": "#Action-sameApp&/View2/"
             *     },
             *     {
             *         "title": "View 3",
             *         "subtitle": "Application view number 3",
             *         "intent": "#Action-sameApp&/View3/"
             *     }
             * ]
             * @return {Promise.<Object>} Example: {}
             */
            setHierarchy: function (aHierarchyLevels) {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellUIService.setHierarchy', {
                    aHierarchyLevels: aHierarchyLevels
                });
            },

            /**
             * Sets the given related apps in the shell header. The JSON below shows an expected message sample.
             * 
             * @param aRelatedApps Example: [
             *     {
             *         "title": "App 1",
             *         "icon": "sap-icon://folder",
             *         "subtitle": "go to app 1",
             *         "intent": "#Action-toapp1"
             *     },
             *     {
             *         "title": "App 2",
             *         "icon": "sap-icon://folder",
             *         "subtitle": "go to app 2",
             *         "intent": "#Action-toapp2"
             *     },
             *     {
             *         "title": "App 3",
             *         "icon": "sap-icon://folder",
             *         "subtitle": "go to app 3",
             *         "intent": "#Action-toapp3"
             *     }
             * ]
             * @return {Promise.<Object>} Example: {}
             */
            setRelatedApps: function (aRelatedApps) {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellUIService.setRelatedApps', {
                    aRelatedApps: aRelatedApps
                });
            },

            /**
             * (since 1.66) Show/Hide a UI blocker in the FLP shell. The JSON below shows an expected message
             * sample.
             * 
             * @param bShow Example: true
             * @return {Promise.<Object>} Example: {}
             */
            showShellUIBlocker: function (bShow) {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellUIService.showShellUIBlocker', {
                    bShow: bShow
                });
            },

            /**
             * Returns the current URL of the FLP with or without the Hash Fragment. Starting at version 1.66, if
             * the "bIncludeHash" is passed with value "true", the returned URL will contain the Hash Fragment as
             * well.
             * 
             * @param bIncludeHash Example: true
             * @return {Promise.<String>} Example: "http://localhost:8080/ushell/test-resources/sap/ushell/shells/sandbox/fioriSandbox.html?sap-client=120#Semantic-Action"
             */
            getFLPUrl: function (bIncludeHash) {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellUIService.getFLPUrl', {
                    bIncludeHash: bIncludeHash
                }).then(fnPostMessageResponseHandler);
            },

            /**
             * This function returns the list of groups in the shell that can be used when adding a new tile. The
             * JSON below shows an expected message sample.
             * 
             * 
             * @return {Promise.<Array>} Example: [
             *     {
             *         "title": "My Home",
             *         "object": {
             *             "id": "group_0"
             *         }
             *     },
             *     {
             *         "title": "My Group",
             *         "object": {
             *             "id": "group_1"
             *         }
             *     }
             * ]
             */
            getShellGroupIDs: function () {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellUIService.getShellGroupIDs', {

                }).then(fnPostMessageResponseHandler);
            },

            /**
             * This function creates a bookmark for the given parameters. The JSON below shows an expected message
             * sample.
             * 
             * @param oParameters Example: {
             *     "title": "My Bookmark",
             *     "url": "#SO-Action~Context?P1=a&P2=x&/route?RPV=1",
             *     "icon": "sap-icon://home",
             *     "info": "bookmark information",
             *     "subtitle": "bookmark subtitle",
             *     "serviceUrl": "",
             *     "serviceRefreshInterval": "5",
             *     "numberUnit": "EUR"
             * }
             * @param groupId Example: "group_0"
             * @return {Promise.<Object>} Example: {}
             */
            addBookmark: function (oParameters, groupId) {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellUIService.addBookmark', {
                    oParameters: oParameters,
                    groupId: groupId
                });
            }
        },

        renderer: {
            /**
             * This function creates and displays a button at the left side of the header of Fiori launchpad. The
             * JSON below shows an expected message sample.
             * 
             * @param sId Example: "btnSendMailID"
             * @param sTooltip Example: "A tooltip for the header button"
             * @param sIcon Example: "sap-icon://email"
             * @param bVisible Example: true
             * @return {Promise.<Object>} Example: {}
             */
            addHeaderItem: function (sId, sTooltip, sIcon, bVisible) {
                return PostMessageAPI.sendRequest('sap.ushell.services.renderer.addHeaderItem', {
                    sId: sId,
                    sTooltip: sTooltip,
                    sIcon: sIcon,
                    bVisible: bVisible
                });
            },

            /**
             * This function makes the header button with the specified ID/IDs visible at the left side of the
             * header of Fiori launchpad. The JSON below shows an expected message sample.
             * 
             * @param aIds Example: [
             *     "btnSendMailID"
             * ]
             * @return {Promise.<Object>} Example: {}
             */
            showHeaderItem: function (aIds) {
                return PostMessageAPI.sendRequest('sap.ushell.services.renderer.showHeaderItem', {
                    aIds: aIds
                });
            },

            /**
             * This function makes the header button with the specified ID/IDs hidden at the left side of the
             * header of Fiori launchpad. The JSON below shows an expected message sample.
             * 
             * @param aIds Example: [
             *     "btnSendMailID"
             * ]
             * @return {Promise.<Object>} Example: {}
             */
            hideHeaderItem: function (aIds) {
                return PostMessageAPI.sendRequest('sap.ushell.services.renderer.hideHeaderItem', {
                    aIds: aIds
                });
            },

            /**
             * This function sets the title in the Fiori Launchpad shell header. The JSON below shows an expected
             * message sample.
             * 
             * @param sTitle Example: "A New Title in the FLP Header"
             * @return {Promise.<Object>} Example: {}
             */
            setHeaderTitle: function (sTitle) {
                return PostMessageAPI.sendRequest('sap.ushell.services.renderer.setHeaderTitle', {
                    sTitle: sTitle
                });
            },

            /**
             * This function sets the header visibility according to the given value. The JSON below shows an
             * expected message sample.
             * 
             * @param bVisible Example: true
             * @return {Promise.<Object>} Example: {}
             */
            setHeaderVisibility: function (bVisible) {
                return PostMessageAPI.sendRequest('sap.ushell.services.renderer.setHeaderVisibility', {
                    bVisible: bVisible
                });
            }
        },

        ShellNavigation: {
            /**
             * This function triggers the navigation to a specified external target. The JSON below shows an
             * expected message sample.
             * 
             * @param oArgs Example: {
             *     "target": {
             *         "semanticObject": "GenericWrapperTest",
             *         "action": "open"
             *     },
             *     "params": {
             *         "A": "B"
             *     }
             * }
             * @return {Promise.<Object>} Example: {}
             */
            toExternal: function (oArgs) {
                return PostMessageAPI.sendRequest('sap.ushell.services.ShellNavigation.toExternal', {
                    oArgs: oArgs
                });
            }
        },

        NavTargetResolution: {
            /**
             * This function returns a list of unique semantic objects assigned to the current user. The function
             * attempts to use client-side target resolution, if it is enabled. If not, it falls back to the
             * NavTargetResolution adapter implementation. The JSON below shows an expected message sample.
             * 
             * 
             * @return {Promise.<Array>} Example: [
             *     "SemanticObject1",
             *     "SemanticObject2"
             * ]
             */
            getDistinctSemanticObjects: function () {
                return PostMessageAPI.sendRequest('sap.ushell.services.NavTargetResolution.getDistinctSemanticObjects', {

                });
            },

            /**
             * This function gets the hash part of the URL and expands the sap-intent-param if present and
             * retrievable. The JSON below shows an expected message sample.
             * 
             * @param sHashFragment Example: "#SO-action?AAA=444&&BBB=555"
             * @return {Promise.<Object>} Example: {}
             */
            expandCompactHash: function (sHashFragment) {
                return PostMessageAPI.sendRequest('sap.ushell.services.NavTargetResolution.expandCompactHash', {
                    sHashFragment: sHashFragment
                });
            },

            /**
             * This function returns a Boolean indication whether the given navigation intents are supported for the given parameters. The JSON below shows an expected message sample.
             * 
             * @param {Array.<Object>} aInput Example: [{"target":{"semanticObject":"GenericWrapperTest1","action":"open"},"params":{"A":"B"}},{"target":{"semanticObject":"GenericWrapperTest2","action":"open"},"params":{"A":"B"}}]
             * @return {Promise.<Object>} Example: [{"supported":false},{"supported":true}]
             */
            isNavigationSupported: function (aInput) {
                return PostMessageAPI.sendRequest('sap.ushell.services.NavTargetResolution.isNavigationSupported', aInput);
            }
        },

        AppLifeCycle: {
            /**
             * Create application, send the following message in order to create an application associated with the
             * URL, The JSON below shows an expected message sample. The URL is the output from URL template and
             * contains attributes need if the process of opening the application. The sHash, enables to define the
             * start hash for the routing of the application.
             * 
             * @param sUrl Example: "https:......"
             * @param sHash Example: "#aa-bb"
             * @return {Promise.<Object>} Example: {}
             */
            create: function (sUrl, sHash) {
                return PostMessageAPI.sendRequest('sap.ushell.services.AppLifeCycle.create', {
                    sUrl: sUrl,
                    sHash: sHash
                });
            },

            /**
             * Destroy application by id, send the following message in order to destroy an application associated
             * with the Id in the BleBoxRT, The JSON below shows an expected message sample.
             * 
             * @param appId Example: "id"
             * @return {Promise.<Object>} Example: {}
             */
            destroy: function (appId) {
                return PostMessageAPI.sendRequest('sap.ushell.services.AppLifeCycle.destroy', {
                    appId: appId
                });
            },

            /**
             * Instruct the Stateful container to store the application, so that it can be used again, store passes
             * a cacheId to the Stateful container, the stateful container should use the cashId as a reference key
             * for the restore flow.
             * 
             * @param sCacheId Example: "application-cache-id-1"
             * @return {Promise.<Object>} Example: {}
             */
            store: function (sCacheId) {
                return PostMessageAPI.sendRequest('sap.ushell.services.AppLifeCycle.store', {
                    sCacheId: sCacheId
                });
            },

            /**
             * Instruct the Stateful container to restore an application, so that it can be used again, restore
             * passes a cacheId to the Stateful container and an initial hash to state the route form, the stateful
             * container should use the cashId to restore the application, and set the route pointing on the sHash.
             * 
             * @param sCacheId Example: "application-cache-id-1"
             * @param sHash Example: "#xxx-yyy&/r=1"
             * @return {Promise.<Object>} Example: {}
             */
            restore: function (sCacheId, sHash) {
                return PostMessageAPI.sendRequest('sap.ushell.services.AppLifeCycle.restore', {
                    sCacheId: sCacheId,
                    sHash: sHash
                });
            }
        },

        sessionHandler: {
            /**
             * The bellow sample is expected to trigger a logout from the hosted application:
             * 
             * 
             * @return {Promise.<Object>} Example: {}
             */
            logoutSession: function () {
                return PostMessageAPI.sendRequest('sap.ushell.sessionHandler.logoutSession', {

                });
            },

            /**
             * The bellow sample is expected to trigger session extending in the hosted application:
             */
            extendSessionEvent: function () {
                PostMessageAPI.attachRequestHandler('sap.ushell.sessionHandler.extendSessionEvent', function (oEvent) {
                    PostMessageAPI.sendResponse(oEvent.getParameter('data'), 'success');
                });
            },

            /**
             * The bellow sample notifies Shell that user is active and will trigger extending of the session:
             * 
             * 
             * @return {Promise.<Object>} Example: {}
             */
            notifyUserActive: function () {
                return PostMessageAPI.sendRequest('sap.ushell.sessionHandler.notifyUserActive', {

                });
            }
        }
    };
});