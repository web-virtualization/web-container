sap.ui.define([
    'sap/ui/base/EventProvider',
    './Util'
], function (EventProvider, Util) {
    'use strict';

    /**
     * The PostMessageAPI can be used to send/receive messages to/from a target window object following the protocol
     * set by ushell (aka cFLP). Below are some example uses of this utility. This is a singleton instance, since there
     * can only be one parent cFLP instance for a single window context.
     * 
     * Sending a Request: (from BizX -> cFLP)
     * 
     * <code>
     * PostMessageAPI.sendRequest('<servicename>', {<optionalData>}).then(function(oResponse) {
     *   // handle response
     * }).catch(function(reason) {
     *   // handle error
     * });
     * </code>
     * 
     * Handling a Request: (from cFLP -> BizX)
     * 
     * <code>
     * PostMessageAPI.attachRequestHandler('<servicename>', function(oEvent) {
     *   var oRequest = oEvent.getParameter('data');
     *   var oResponse = {}; // generate response
     *   PostMessageAPI.sendResponse(oRequest, 'success', oResponse);
     * });
     * </code>
     * 
     * @namespace
     * @name sap.sf.surj.shell.util.PostMessageAPI
     * @see sap/ushell/appRuntime/ui5/AppRuntimePostMessageAPI/AppPostMessageAPI.js
     *   This is the ushell implementation of the communication mgr.
     */
    var PostMessageAPI = new EventProvider();

    PostMessageAPI._msgPrefix = 'POST_ID_';
    PostMessageAPI._msgId = 0;

    /**
     * Handle a message event from the target window.
     * @inner
     * @param {Event} oEvent 
     */
    PostMessageAPI.handleMessage = function (oEvent) {
        //filter out empty messages or messages from the wrong origin
        if (!(oEvent && this.isTargetOrigin(oEvent.origin))) {
            return;
        }

        var oMessageData = oEvent.data;

        if (typeof oMessageData === 'string') {
            try {
                oMessageData = JSON.parse(oMessageData);
            } catch (e) {
                return;
            }
        }

        // validate the message is expected format
        if (oMessageData && typeof oMessageData.request_id == 'string' && typeof oMessageData.service == 'string') {
            var oEventData = {
                data: oMessageData,
                originalEvent: oEvent
            };

            this.fireEvent('message', oEventData);
            this.fireEvent(this.getMessageEventId(oMessageData), oEventData);
        }
    };

    /**
     * Send a request to the target window, probably expecting a response, though that's optional.
     * 
     * @param {String} sService The name of the service
     * @param {Object=} oRequestBody The data to send on the request, optional for some services
     * @param {Boolean=} bSkipResponse Don't listen for any response if true, default is false
     * @return {Promise.<Object>} A promise for the response body
     */
    PostMessageAPI.sendRequest = function (sService, oRequestBody, bSkipResponse) {
        var that = this;
        return new Promise(function (resolve, reject) {
            var sRequestId = that.getNextRequestId();
            var oMessageData = {
                type: 'request',
                service: sService,
                body: oRequestBody || {},
                request_id: sRequestId
            };
            if (!bSkipResponse) {
                that.attachEventOnce(that.getResponseEventId(sService, sRequestId), function (oEvent) {
                    var oResponse = oEvent.getParameter('data');
                    if (oResponse && oResponse.status == 'success') {
                        resolve(oResponse.body);
                    } else {
                        reject(oResponse.body);
                    }
                });
            }
            var bSuccess = that.postMessage(oMessageData);
            if (bSuccess && bSkipResponse) {
                resolve({
                    status: 'success'
                });
            }
            if (!bSuccess) {
                reject({
                    status: 'failure',
                    body: {
                        message: 'could not postMessage to targetWindow'
                    }
                });
            }
        });
    };

    /**
     * Send a response to ushell after handling a request.
     * 
     * @param {Object} oRequest The request
     * @param {String} sStatus The status, 'success' or 'failure'
     * @param {Object} oResponseBody The response data object
     */
    PostMessageAPI.sendResponse = function (oRequest, sStatus, oResponseBody) {
        return this.postMessage({
            type: 'response',
            status: sStatus,
            service: oRequest.service,
            request_id: oRequest.request_id,
            body: oResponseBody
        });
    };

    /**
     * Attach a request event handler.
     * 
     * @param {String} sService The service name
     * @param {Function} fnHandler The handler
     */
    PostMessageAPI.attachRequestHandler = function (sService, fnHandler) {
        this.attachEvent(this.getRequestEventId(sService), fnHandler);
    };

    /**
     * Attach a request event handler that would only be handled once.
     * 
     * @param {String} sService The service name
     * @param {Function} fnHandler The handler
     */
    PostMessageAPI.attachRequestHandlerOnce = function (sService, fnHandler) {
        this.attachEventOnce(this.getRequestEventId(sService), fnHandler);
    };

    /**
     * Detach a request event handler.
     * 
     * @param {String} sService The service name
     * @param {Function} fnHandler The handler
     */
    PostMessageAPI.detachRequestHandler = function (sService, fnHandler) {
        this.detachEvent(this.getRequestEventId(sService), fnHandler);
    };

    /**
     * Post a message to the ushell window.
     * 
     * @param {Object} oMessageData The data to send.
     */
    PostMessageAPI.postMessage = function (oMessageData) {
        if (this.isSupported()) {
            var oWindow = this.getTargetWindow();
            var sTargetOrigin = this.getTargetOrigin();
            PostMessageAPI.fireEvent('messageSent', {
                data: oMessageData,
                targetWindow: oWindow,
                targetOrigin: sTargetOrigin
            });
            oWindow.postMessage(JSON.stringify(oMessageData), sTargetOrigin);
            return true;
        }
        return false;
    };

    /**
     * Check if the given origin is the target one.
     * 
     * @param {String} sOrigin
     * @return {Boolean} If the origin is supported 
     */
    PostMessageAPI.isTargetOrigin = function (sOrigin) {
        var sTargetOrigin = this.getTargetOrigin();
        return sTargetOrigin == '*' || sTargetOrigin == sOrigin;
    };

    /**
     * @inner
     */
    function getRequestedParentFrameOrigin() {
        var tryParams = ['parentFrameOrigin']; // we might add more parameters in the future
        for (var i = 0; i < tryParams.length; i++) {
            var param = Util.findURLParam(tryParams[i]);
            if (param) {
                return decodeAndNormalize(param);
            }
        }
        return null;
    }

    /**
     * @inner
     */
    function decodeAndNormalize(url) {
        if (url) {
            url = decodeURIComponent(url).toLowerCase();
            var parts = /^(.*)\/*$/.exec(url);
            if (parts) { // strip off any trailing "/"
                url = parts[1];
            }
        }
        return url;
    }

    /**
     * @inner
     */
    function toArray(parentFrameUrlString) {
        return parentFrameUrlString ? parentFrameUrlString.split('|').map(decodeAndNormalize) : null;
    }

    /**
     * Set the target origin.
     * 
     * @param {String} sTargetOrigin The target origin
     */
    PostMessageAPI.setTargetOrigin = function (sTargetOrigin) {
        this._sTargetOrigin = sTargetOrigin;
    };

    /**
     * Get the target origin to post messages to. This is configured in the parentFrameOrigin.
     * 
     * @return {String} The target origin
     */
    PostMessageAPI.getTargetOrigin = function () {
        if (this._sTargetOrigin) {
            return this._sTargetOrigin;
        }
        var parentFrameUrls = null;
        var pageHeaderJsonData = window.pageHeaderJsonData;
        if (pageHeaderJsonData && pageHeaderJsonData.settings) {
            parentFrameUrls = toArray(pageHeaderJsonData.settings['inframe.parentFrameOriginUrl']);
        }
        if (!parentFrameUrls) {
            var meta = document.getElementById('inframe.parentFrameOriginUrl');
            parentFrameUrls = toArray(meta && meta.getAttribute('content'));
        }
        if (parentFrameUrls && parentFrameUrls.length > 0) {
            if (parentFrameUrls.length > 1) {
                var paramValue = getRequestedParentFrameOrigin();
                if (paramValue && parentFrameUrls.indexOf(paramValue) >= 0) {
                    this._sTargetOrigin = paramValue;
                }
            }
            this._sTargetOrigin = this._sTargetOrigin || parentFrameUrls[0];
        }
        return this._sTargetOrigin;
    };

    /**
     *  Determine if this window is embedded by a Ushell application.
     * 
     * @return {Boolean}
     */
    PostMessageAPI.isSupported = function () {
        return this.getTargetOrigin() != null && this.getTargetWindow() !== window.self;
    };

    /**
     * Start listening for messages from ushell.
     */
    PostMessageAPI.start = function () {
        if (!this._fnHandler) {
            this._fnHandler = this.handleMessage.bind(this);
            this.getSourceWindow().addEventListener('message', this._fnHandler);
        }
    };

    /**
     * Stop listening for messages from ushell.
     */
    PostMessageAPI.stop = function () {
        if (this._fnHandler) {
            this.getSourceWindow().removeEventListener('message', this._fnHandler);
            this._fnHandler = null;
        }
    };

    /**
     * Generate a response event id for a service.
     * 
     * @param {String} sService The service
     * @param {String} sRequestId The requestId
     * @return {String} The event id
     */
    PostMessageAPI.getResponseEventId = function (sService, sRequestId) {
        return this.getMessageEventId({
            type: 'response',
            service: sService,
            request_id: sRequestId
        });
    };

    /**
     * Generate a request event id for a service.
     * 
     * @param {String} sService The service
     * @return {String} The event id
     */
    PostMessageAPI.getRequestEventId = function (sService) {
        return this.getMessageEventId({
            type: 'request',
            service: sService
        });
    };

    /**
     * Generate an event id for an arbitrary message data object.
     * 
     * @param {Object} oMessageData The message data
     * @return {String} The event id
     */
    PostMessageAPI.getMessageEventId = function (oMessageData) {
        if (oMessageData) {
            // A response contains the request_id, but not requests
            // Request event listeners should not care about the request_id; however the response listeners want
            // only the response for that particular request_id
            var sSuffix = oMessageData.type == 'response' ? ':' + oMessageData.request_id : '';
            return oMessageData.type + ':' + oMessageData.service + sSuffix;
        }
        return null;
    };

    /**
     * Get the next request id.
     * 
     * @return {String}
     */
    PostMessageAPI.getNextRequestId = function () {
        return this._msgPrefix + (++this._msgId);
    };

    /**
     * Get the window which this manager will listen for messages on.
     * 
     * @return {Window} The current window object
     */
    PostMessageAPI.getSourceWindow = function () {
        return this._oSourceWindow || window;
    };

    /**
     * Set the target window.
     * 
     * @param {Window} oTargetWindow
     */
    PostMessageAPI.setTargetWindow = function (oTargetWindow) {
        this._oTargetWindow = oTargetWindow;
    };

    /**
     * Get the target window that this manager sends messages to.
     * 
     * @return {Window} The target window object
     */
    PostMessageAPI.getTargetWindow = function () {
        if (this._oTargetWindow) {
            return this._oTargetWindow;
        }
        return window.parent;
    };

    // start the communication manager now
    PostMessageAPI.start();

    return PostMessageAPI;
});