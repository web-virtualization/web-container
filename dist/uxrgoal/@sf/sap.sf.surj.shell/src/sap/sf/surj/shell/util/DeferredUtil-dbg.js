// WARNING: If you change this file, please also make the same change to
// idl-surj-web/src/main/webapp/ui/surj/js/util/DeferredUtil.js


sap.ui.define('sap/sf/surj/shell/util/DeferredUtil', [
        'jquery.sap.global',
        'sap/sf/surj/shell/util/Util',
        'sap/sf/surj/shell/util/Logger',
        'sap/sf/surj/shell/util/SMRF',
        'sap/sf/surj/shell/core/BizXResourceBundle',
        './ServiceVisibilityMapping'
    ], function($, Util, Logger, SMRF, BizXResourceBundle, ServiceVisibilityMapping) {
    

    var MSGS = window.MSGS;
    if (!MSGS) {
      MSGS = {};
      window.MSGS = MSGS;
    }

    var COMMON_DWR_PATH = '/ajax/remoting/call/plaincall/';
    var DEFAULT_DWR_URL_PREFIX = '/xi' + COMMON_DWR_PATH;
    var DWR_URL_PREFIX_LOOKUP = (function () {
        var prefixMap = {};
        for (var sVisibility in ServiceVisibilityMapping) {
            var aMapping = ServiceVisibilityMapping[sVisibility];
            if (aMapping instanceof Array) {
                aMapping.forEach(function (serviceName) {
                    prefixMap[serviceName] = "/" + sVisibility + COMMON_DWR_PATH;
                });
            }
        }
        return prefixMap;
    }());

    var RAL_ERROR_MSG = MSGS.COMMON_RAL_SYSTEM_EXCEPTION_CONVERTER_ERROR || 
                    'The sensitive private data on this page could not be displayed because there was a failure writing to the Read Access Log.';
    var SECURITY_SCANNER_ERROR_MSG = MSGS.COMMON_SECURITY_SCANNER_EXCEPTION_CONVERTER_ERROR || 
                    'This content was rejected by the Security Scan of User Inputs feature because it might contain malicious content. Please review your content for security risks, such as scripting, and try again.';
    // SESSION_ID was a hard coded value in engine.js from AjaxService, with some random value, this was copied from there
    var SESSION_ID = '80A8BD291A8E635A37D57F13E5D1F423' + Math.floor(1E3 * Math.random());

    // BATCH_ID is not truly required, since we override the response text to provide a unique callback, but for backwards compatibility we pass
    // along an increasing batch_id to each DWR request, which might be useful for tracking purposes
    var BATCH_ID = 0;
    var TYPE_AJAX_SERVICE = 'ajaxService';
    var TYPE_ODATA = 'ODataService';

    /**
     * @name sap.sf.surj.shell.util.DeferredUtil
     */
    var DeferredUtil = {
        TYPE_AJAX_SERVICE: TYPE_AJAX_SERVICE,
        TYPE_ODATA: TYPE_ODATA,

        /**
         * @deprecated Use invokeService instead
         * @param {Object} oConfig
         * @param {String} oConfig.serviceType
         * @return {Deferred|Promise}
         */
        createDeferred : function(oConfig) {
            return this.invokeService(oConfig);
        },

        /**
         * @param {Object} oConfig
         * @param {String} oConfig.serviceType
         * @return {Deferred|Promise}
         */
        invokeService : function(oConfig) {
            var fDeferredFactory = null;
            switch (oConfig.type) {
            case TYPE_AJAX_SERVICE:
                return this.invokeAjaxService(oConfig);
            case TYPE_ODATA:
                return this.invokeODataService(oConfig);
            default:
                throw new Error('Invalid service type');
            }
        },

        /**
         * Invoke an ajax service.
         *
         * This replaces the usage of AjaxService by directly using jQuery.ajax to send a POST to the DWR servlet and
         * then overriding the response handling, completely bypassing the DWR UI engine.
         * 
         * This is not fully featured like the DWR engine.js, but it should work for any of our existing use cases, and it
         * does NOT require any Proxy.js file included on the page. There are no external dependencies for this to work (other
         * than jquery)
         *
         * Currently the new functionality is opt-in, but initial testing show that this can replace the old method, they
         * should be backwards compatible, this might change in the near future.
         * 
         * @param {Object} oConfig
         * @param {String} oConfig.serviceName
         * @param {String} oConfig.serviceMethod
         * @param {Array} oConfig.arguments
         * @param {Boolean} oConfig.legacyMode Pass this as false to bypass AjaxService and use the new functionality
         * @return {Promise}
         */
        invokeAjaxService : function(oConfig) {
            /** @inner */
            function serialize(value) {
                if (value == null) {
                    return 'null:null';
                } else switch(typeof value) {
                    case "boolean":
                        return "boolean:" + value;
                    case "number":
                        return "number:" + value;
                    case "string":
                        return "string:" + encodeURIComponent(value);
                    case "object":
                        if (value instanceof String) {
                            return "String:" + encodeURIComponent(value);
                        } else if (value instanceof Boolean) {
                            return "Boolean:" + value;
                        } else if (value instanceof Number) {
                            return "Number:" + value;
                        } else if (value instanceof Date) {
                            return "Date:" + value.getTime();
                        } else {
                            return serializeObject(value);
                        }
                    case "function":
                        return '';
                    default:
                        throw new Error("invalid type passed to serialize");
                }
            }

            /** @inner */
            function serializeObject(value) {
                // Duck-type an Array using .join
                // Changed from Array.isArray(value) to support Array-like things, like Int8Array UI-20035
                if (value && value.join) {
                    var result = ["Array:["];
                    for (var i=0; i<value.length; i++) {
                        i != 0 && result.push(",");
                        result.push(getReference(value[i]));
                    }
                    result.push("]");
                    return result.join("");
                } else if (value.nodeName && value.nodeType) {
                    if (window.XMLSerializer) {
                        value = (new XMLSerializer).serializeToString(value);
                    } else if (value.toXml) {
                        value = value.toXml();
                    } else {
                        value = value.innerHTML;
                    }
                    return "XML:" + encodeURIComponent(value);
                } else {
                    var result = "";
                    for (var attr in value) {
                        var subvalue = value[attr];
                        if (typeof subvalue != 'function') {
                            result += (result&&",")+encodeURIComponent(attr)+":"+getReference(subvalue);
                        }
                    }
                    return "Object_Object:{" + result + "}";
                }
            }

            /** @inner */
            function getReference(value) {
                var oCache;
                var bHasCache = aCached.some(function(elem) {
                    if (elem.value === value) {
                        oCache = elem;
                        return true;
                    }
                });
                if (bHasCache) {
                    return 'reference:'+oCache.id;
                } else {
                    var id = 'c0-e'+(refId++);
                    if (value && typeof value == 'object') {
                        aCached.push({id: id, value: value});
                    }
                    aParams.push(id+'='+serialize(value, true));
                    return 'reference:'+id;
                }
            }

            /** @inner */
            function getError(sHtml) {
                var lines = sHtml.split('\n');
                var msg = false;
                var error = null;
                for (var i=0; i<lines.length; i++) {
                    var line = lines[i].trim();
                    if (line == '<dd class="msg">') {
                        error = {};
                        msg = true;
                    } else if (msg) {
                        var text = /<strong>(.*)<\/strong>/.exec(line);
                        if (text) {
                            error.message = text[1];
                        } else if (line == '<div>') {
                            error.detail = '';
                        } else if (line == '</dd>') {
                            break;
                        } else if (line != '</div>' && error.detail != null) {
                            error.detail += line.replace('<br />', '\n');
                        }
                    }
                }
                return error;
            }

            /** @inner */
            function cleanup() {
                delete window[sCallbackIdSuccess];
                delete window[sCallbackIdError];
            }

            /** @inner */
            function handleResponse(sResponseText) {
                if (sResponseText.indexOf('throw') == 0) {
                    window[sCallbackIdSuccess] = function(batchId, requestId, response) {
                        cleanup();
                        oDfd.resolve(response);
                    };
                    window[sCallbackIdError] = function(batchId, requestId, response) {
                        // batch errors pass the response object as the first argument
                        if (typeof batchId == 'object') response = batchId;
                        cleanup();
                        oDfd.reject(response.message, response);
                    };
                    try {
                        Util.dangerouslyEvalScript(sResponseText
                            .replace(/^throw .*\r?\n/, '')
                            .replace('dwr.engine._remoteHandleCallback', sCallbackIdSuccess)
                            .replace('dwr.engine._remoteHandleException', sCallbackIdError)
                            .replace('dwr.engine._remoteHandleBatchException', sCallbackIdError)
                            .replace('if (window.dwr)', 'if (true)'));
                    } catch(e) {
                        oDfd.reject('Invalid Server Response', e);
                    }
                } else {
                    // This case happens when DWR is called without a session or invalid CSRF
                    // Try to parse the HTML error response, otherwise return generic error
                    var oError = getError(sResponseText);
                    if (oError) {
                        oDfd.reject(oError.message, oError);
                    } else {
                        oDfd.reject('Invalid Server Response', sResponseText);
                    }
                }
            }

            if (!DeferredUtil.isAjaxServiceAllowed()) {
                return $.Deferred().reject('AjaxServices are not allowed on this page');
            }
            
            // UPDATE: To use the legacy asProxy code, AjaxService must already exist and has not been overridden
            // Using the AjaxService for now, must opt-in with {noASProxy:true} to get new behavior
            // Also adding '&noASProxy=true' as a URL parameter will always opt-in for testing
            if ((window.AjaxService != null && !window.AjaxService.override) &&
                    !oConfig.noASProxy && Util.findURLParam('noASProxy') != 'true' &&
                    DeferredUtil.isAjaxServiceAvailable(oConfig)) {
                return this.invokeAjaxServiceLegacy(oConfig);
            }

            var sCallbackPrefix = 'sfDeferredUtilCallback';
            var sCallbackIdSuccess = sCallbackPrefix + (JSONP_INDEX++);
            var sCallbackIdError = sCallbackPrefix + (JSONP_INDEX++);
            var oDfd = $.Deferred();
            var aCached = [];
            var aArgs = oConfig.arguments;
            var bAsync = oConfig.async !== false;
            var sServiceName = oConfig.serviceName;
            var sScriptName = sServiceName + 'Proxy';
            var sMethodName = oConfig.serviceMethod;
            var aParams = [
                ['callCount=1'],
                ['page='+window.location.pathname + window.location.search],
                ['httpSessionId='],
                ['scriptSessionId='+SESSION_ID],
                ['c0-scriptName='+sScriptName],
                ['c0-methodName='+sMethodName],
                ['c0-id=0']
            ];
            var refId = 0;
            if (aArgs) {
                for (var i = 0; i<aArgs.length; i++) {
                    aParams.push('c0-param'+i+'='+serialize(aArgs[i]));
                }
            }
            aParams.push('batchId='+BATCH_ID++);
            var sUrl = (DWR_URL_PREFIX_LOOKUP[sServiceName] || DEFAULT_DWR_URL_PREFIX) + sScriptName + '.' + sMethodName + '.dwr';
            // Doing this eliminates the need for the X-Ajax-Token header
            if (window.ajaxSecKey) {
                sUrl += '?_s.crb=' + window.ajaxSecKey;
            }

            var oHeaders = {};
            var skipId = 'skipSeamFilterJsfPhase';
            var skipEl = document.getElementById(skipId);
            if (skipEl && skipEl.content == 'true') {
                oHeaders['X-' + skipId] = 'true';
            }
            // WEF-3402
            // The viewId is a required header, try the following: AjaxServiceMeta.viewId, AjaxService._viewId
            // or fallback to window.location.pathname as a last resort
            var AjaxServiceMeta = window.AjaxServiceMeta || {};
            var AjaxService = window.AjaxService || {};
            var viewid = AjaxServiceMeta.viewId || AjaxService._viewid || window.location.pathname;
            // viewids must have the .xhtml extension
            if (!/\.xhtml$/.test(viewid)) {
                viewid += ".xhtml";
            }
            oHeaders.viewid = viewid;
            $.ajax({
                url: Util.ensureBaseDomain(sUrl),
                type: 'POST',
                data: aParams.join('\n'),
                contentType: 'text/plain',
                dataType: 'text',
                success: handleResponse,
                headers: oHeaders,
                async: bAsync,
                error: function(oXHR) {
                    oDfd.reject('Unable to connect', oXHR);
                },
                xhrFields: {
                    withCredentials: true,
                }
            });

            return oDfd.promise();
        },

        /**
         * Invoke an ajax service.
         * 
         * @param {Object} oConfig
         * @param {String} oConfig.serviceName
         * @param {String} oConfig.serviceMethod
         * @param {Array} oConfig.arguments
         * @return {Promise}
         */
        invokeAjaxServiceLegacy : function(oConfig) {
            return this.loadAjaxService(oConfig).then(function(oService) {
                var sMethodName = oConfig.serviceMethod;
                if (typeof oService[sMethodName] == 'function') {
                    var oDeferred = $.Deferred();
                    var aArguments = oConfig.arguments || [];
                    var aFinalArguments = [].slice.call(aArguments).concat({
                        callback : function() {
                            oDeferred.resolve.apply(this, arguments);
                        },
                        errorHandler : function(sErrorMessage, oException) {
                            oException && LOG.error('Error invoking AjaxServiceHandler', oException);

                            //Special exceptions
                            var errorCode = (oException && oException.errorCode);
                            if (errorCode == 'RALSE') {
                                //Overwrite all errors messages because RAL don't display it.
                                sErrorMessage = RAL_ERROR_MSG;
                            } else if (errorCode == 'SECURITYSCANNER') {
                                //append the error message
                                sErrorMessage = SECURITY_SCANNER_ERROR_MSG + ' ' + sErrorMessage; 
                            }
                            oDeferred.reject(sErrorMessage, oException);
                        }
                    });
                    oService[sMethodName].apply(oService, aFinalArguments);
                    var oPromise = oDeferred.promise();
                    if (oConfig.timeout > 0) {
                        return DeferredUtil.addTimeout(oPromise, oConfig.timeout);
                    }
                    return oPromise;
                } else {
                    var sErrorMessage = '[DeferredUtil] The ajaxService method ' + sMethodName + ' does not exist';
                    LOG.error(sErrorMessage);
                    return $.Deferred().reject(sErrorMessage);
                }
            });
        },

        getAjaxServiceProxyUrl : function(oConfig) {
            var sModule = oConfig.module;
            return 'ajaxservice:' + (sModule ? sModule + '.' : '') + oConfig.serviceName + (oConfig.legacy ? '?legacy=true' : '');
        },

        /**
         * Initialize AjaxService with a replacement for AjaxService on browsers that will support it.
         */
        initAjaxService : function() {
            if (this.isAjaxServiceAllowed() && !window.AjaxService && window.Proxy) {
                window.AjaxService = AjaxServiceOverride;
            } else if (window.AjaxService && AjaxService.setViewId && window.AjaxServiceMeta) {
                var viewId = AjaxServiceMeta.viewId;
                if (viewId && (viewId != AjaxService._viewid)) {
                    AjaxService.setViewId(viewId);
                }
            }
        },

        /**
         * Initialize the ajaxService.
         *
         * @param {Object} oConfig
         * @param {String} oConfig.serviceName
         * @param {Boolean} oConfig.legacy
         * @param {String} oConfig.module
         * @param {Promise.<Object>} A promise for the ajaxService MBeanInstance.
         */
        loadAjaxService : function(oConfig) {
            if (!this.isAjaxServiceAllowed()) {
                var sErrorMessage = '[DeferredUtil] AjaxServices are not allowed';
                LOG.error(sErrorMessage);
                return $.Deferred().reject(sErrorMessage);
            }
            DeferredUtil.initAjaxService();
            var sServiceName = oConfig.serviceName;
            var oService = null;
            if (window.AjaxService) {
                oService = AjaxService.getMBeanInstance(sServiceName);
            }
            if (!oService) {
                var sAjaxService = this.getAjaxServiceProxyUrl(oConfig);
                var oPromise = AJAXSERVICE_PROMISES[sAjaxService];
                if (!oPromise) {
                    var oDfd = $.Deferred();
                    oPromise = AJAXSERVICE_PROMISES[sAjaxService] = oDfd.promise();
                    var oAjaxPromise;
                    // If AjaxService is not available, then we will need to download that as well.
                    if (!window.AjaxService) {
                        oAjaxPromise = SMRF.loadPromise('/ui/ajaxservice/js/AjaxService.js');
                    } else {
                        oAjaxPromise = Promise.resolve();
                    }
                    oAjaxPromise.then(function() {
                        return SMRF.loadPromise(sAjaxService);
                    }).then(function() {
                        oService = AjaxService.getMBeanInstance(sServiceName);
                        if (oService) {
                            oDfd.resolve(oService);
                        } else {
                            var sErrorMessage = '[DeferredUtil] Could not find ajaxService ' + sServiceName;
                            LOG.error(sErrorMessage);
                            oDfd.reject(sErrorMessage);
                        }
                    }, function(reason) {
                        var sErrorMessage = '[DeferredUtil] Could not load ASProxy with URI ' + sAjaxService;
                        LOG.error(sErrorMessage);
                        oDfd.reject(sErrorMessage);
                    });
                }
                return oPromise;
            } else {
                return $.Deferred().resolve(oService);
            }
        },

        /**
         * Determine if DWR/AjaxService is allowed on this page.
         *
         * @return {boolean}
         */
        isAjaxServiceAllowed : function() {
            return Util.isRunningBaseDomain();
        },

        /**
         * Check if OData services on BizX domain are allowed.
         *
         * @return {Boolean}
         */
        isODataServiceAllowed : function() {
            if (Util.isRunningBaseDomain() || Util.isBaseDomainCORSEnabled()) {
                return true;
            }
            var oPageMetaData = window.pageHeaderJsonData;
            return  oPageMetaData && oPageMetaData.odataProxyUrl;
        },

        /**
         * Check if arbitrary services on BizX domain are allowed.
         *
         * @return {Boolean}
         */
        isServiceAllowed : function(oConfig) {
            switch (oConfig.type) {
            case TYPE_AJAX_SERVICE:
                return DeferredUtil.isAjaxServiceAllowed();
            case TYPE_ODATA:
                return DeferredUtil.isODataServiceAllowed();
            }
            return false;
        },

        /**
         * An AjaxService is considered available either when the service already exists, or the JSProxy file is
         * available to SMRF.load() without a SMRF package. Otherwise we'll use the new AjaxService built-in to
         * DeferredUtil.
         *
         * @param {Object} oConfig
         * @return {Boolean}
         */
        isAjaxServiceAvailable : function(oConfig) {
            // All Ajax services will be available now that SMRF can load any URL
            if (window.AjaxService) {
                var oService = AjaxService.getMBeanInstance(oConfig.serviceName);
                if (!oService) {
                    var sUrl = SMRF.normalizeUrl(DeferredUtil.getAjaxServiceProxyUrl(oConfig));
                    if (!sUrl) {
                        return false;
                    }
                    var oVersionMap = window.DEPS_VERSION_MAP;
                    if (!oVersionMap || !oVersionMap[sUrl]) {
                        return false;
                    }
                }
            }
            return true;
        },

        /**
         * Invoke an ODataService.
         * 
         * If you call registerODataService before calling invokeODataService
         * for the given serviceName, then the baseUrl of the OData call will be
         * changed to include all the other registered services, and will be
         * invoked after the registry is finalized.
         * 
         * You may opt out of this registry optimization by passing
         * useOptimizedMetadata as false. However, if there are no calls to
         * registerODataService on the page, then there will be no impact to
         * functionality.
         * 
         * @param {Object} oConfig
         * @param {String} oConfig.serviceName
         *     The name of the service/entity being invoked - e.g. "CustomTile"
         * @param {String=} oConfig.baseUrl
         *     Defaults to '/odata/v2/restricted/'
         * @param {Boolean=} oConfig.useOptimizedMetadata
         *     Defaults to true
         * @param {String=} oConfig.servicePath
         *     Additional path such as "('1234')"
         * @param {Boolean=} oConfig.strictValidation
         * @return {Promise.<Object>}
         *     A promise for the resulting OData data object returned. 
         */
        invokeODataService : function(oConfig) {
            oConfig = $.extend({
                baseUrl : DEFAULT_BASE_URL,
                strictValidation : true
            }, oConfig);

            var oDeferred = $.Deferred();
            var sBaseUrl = oConfig.baseUrl;
            var sService = oConfig.serviceName;
            var sServiceGroup = oConfig.serviceGroup;

            /*
             * It is preferred to pass the service group, but if it wasn't passed then
             * try to find a group that has registered this service.
             */
            if (!sServiceGroup && oConfig.useOptimizedMetadata !== false) {
                var aAvailableGroups = AVAILABLE_GROUPS[sBaseUrl];
                for (var i=0; aAvailableGroups && i<aAvailableGroups.length; i++) {
                    var sGroup = aAvailableGroups[i];
                    if (DeferredUtil.isODataServiceRegistered(sBaseUrl, sService, sGroup)) {
                        sServiceGroup = sGroup;
                        break;
                    }
                }
            }

            if (oConfig.useOptimizedMetadata == null) {
                oConfig.useOptimizedMetadata = !!(sServiceGroup || REGISTRY[getODataRegistryKey(sBaseUrl, sServiceGroup)]);
            }

            // UI-11164 if the baseUrl is on the BizX domain, then reset the session timer only when successful
            // var oSessionTimer = $.sap.getObject('SFSessionTimeout.sessionTimer');
            // if (oSessionTimer && Util.isBizXDomain(sBaseUrl)) {
            //     oDeferred.done($.proxy(oSessionTimer.reset, oSessionTimer));
            // }
            //
            // Calling SessionTimeout reset is not required anymore!
            // Since SessionTimeout will directly listen to ajax functions from jquery

            /**
             * Invoke will be instant, or after the finalize promise is resolved
             * (if useOptimizedMetadata is true)
             * 
             * @inner
             */
            function invoke() {
                var urlParameters = {};
                var inputParams = oConfig.urlParams;

                if (inputParams && typeof inputParams == 'object') {
                    if ($.isArray(inputParams.results)) {
                        oConfig.urlParams.results.forEach(function(param) {
                            urlParameters[param.key] = param.value;
                        });
                    } else {
                        urlParameters = $.extend({}, inputParams);
                    }
                }

                urlParameters['$format'] = 'json';

                var sServiceUrl;
                if (oConfig.action == "batch") {
                    sServiceUrl = sBaseUrl + '$batch';
                }else {
                    sServiceUrl = sBaseUrl + sService;
                }
                var sServicePath = oConfig.servicePath;
                
                if (sServicePath) {
                    sServiceUrl += sServicePath;
                }
                
                sServiceUrl = DeferredUtil.processODataURL(sServiceUrl + '?' + $.param(urlParameters));

                var oHeaders = {};
                var oAjaxSettings = {
                    headers: oHeaders,
                    xhrFields: {
                        withCredentials: true
                    }
                };

                // caller may provide arbitrary headers
                if (oConfig.headers) {
                    $.extend(oHeaders, oConfig.headers);
                }

                // shortcut properties for certain known headers
                if (!oConfig.strictValidation) {
                    oHeaders['X-UI5-Strict-Validation'] = 'false';
                }

                if (oConfig.bustCache !== false) {
                    oAjaxSettings.cache = false;
                }

                var method = oConfig.method;
                if (method) {
                    oAjaxSettings.method = method;
                    if (method == 'POST') {
                        var oData = oConfig.data;
                        if (oData) {
                            if (typeof oData == 'object') {
                                oData = JSON.stringify(oData);
                            }
                            oAjaxSettings.data = oData;
                        }
                        oAjaxSettings.contentType = 'application/json';
                    }
                }

                var ajaxDeferred;
                if (oConfig.action == "upsert") {
                    ajaxDeferred = $.ajax($.extend(oAjaxSettings, {
                        method : 'POST',
                        url : sServiceUrl,
                        data : JSON.stringify(oConfig.data),
                        contentType : 'application/json',
                        dataType : 'json'
                    }));
                } else if (oConfig.action == "delete") {
                    ajaxDeferred = $.ajax($.extend(oAjaxSettings, {
                        method : 'DELETE',
                        url : sServiceUrl,
                        dataType : 'json'
                    }));
                } else if (oConfig.action == "batch") {
                    ajaxDeferred = $.ajax($.extend(oAjaxSettings, {
                        method : 'POST',
                        url : sServiceUrl,
                        headers : oConfig.headers,
                        data : oConfig.data
                    }));
                } else {
                    ajaxDeferred = $.ajax($.extend(oAjaxSettings, {
                        url : sServiceUrl,
                        dataType : 'json'
                    }));
                }
                ajaxDeferred.done(function(oData) {
                    oDeferred.resolve(oData && oData.d ? oData.d : oData);
                });
                /**
                 * @inner
                 * @see http://api.jquery.com/jquery.ajax/
                 * 
                 * Copied from there:
                 * 
                 * A function to be called if the request fails. The
                 * function receives three arguments: The jqXHR (in jQuery
                 * 1.4.x, XMLHttpRequest) object, a string describing the
                 * type of error that occurred and an optional exception
                 * object, if one occurred. Possible values for the second
                 * argument (besides null) are "timeout", "error", "abort",
                 * and "parsererror". When an HTTP error occurs, errorThrown
                 * receives the textual portion of the HTTP status, such as
                 * "Not Found" or "Internal Server Error."
                 */
                ajaxDeferred.fail(function(jqXHR, textStatus, errorThrown) {
                    var sErr = 'OData Service ' + sService + ' Failed, Error Status: ' + textStatus;
                    if (typeof errorThrown == 'string') {
                        sErr += ', errorThrown: ' + errorThrown;
                    }
                    LOG.error(sErr);

                    oDeferred.reject(sErr, jqXHR);
                    //jqXHR http://api.jquery.com/jQuery.ajax/#jqXHR
                    //https://confluence.successfactors.com/display/ENGOPS/Guidelines+for+RAL+API+Exception+Handling#GuidelinesforRALAPIExceptionHandling-5b.RALExceptionHandling
                    var RAL_ERROR_CODE                  = 'COE0045';
                    var SECURITY_SCANNER_ERROR_CODE     = 'COE0059';
                    var WAF_BLOCK_ERROR_CODE            = 'COE0060';
                    //var UNAUTHORIZED_ERROR_CODE         = 'LGN0003';

                    var errorCode = jqXHR.getResponseHeader('Error-Code') || jqXHR.getResponseHeader('X-Error-Code');

                    switch (errorCode) {
                        case RAL_ERROR_CODE:
                            DeferredUtil.showErrorDialog(RAL_ERROR_MSG);
                            break;
                        case SECURITY_SCANNER_ERROR_CODE:
                            DeferredUtil.showErrorDialog(SECURITY_SCANNER_ERROR_MSG);
                            break;
                        case WAF_BLOCK_ERROR_CODE:
                            try {
                                var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
                                var xError_MSG = jqXHR.getResponseHeader('X-Message-Code');
                                var WAF_BLOCK_ERROR_MSG = 'There was an error processing your request. Please contact support. Error Code: {0}';
                                if (rb) {
                                    WAF_BLOCK_ERROR_MSG = rb.getText('COMMON_WAF_BLOCK_EXCEPTION_CONVERTER_ERROR', xError_MSG);
                                }
                                DeferredUtil.showErrorDialog();
                            } catch(e) {
                                LOG.error("Error loading resource bundle: " + e);
                            }
                            break;
                        /*
                        case UNAUTHORIZED_ERROR_CODE:
                            sap.ui.require(['sap/sf/surj/shell/session/SessionTimer'], function(Timer) {
                                Timer.timeout();
                            });
                            break;
                        */
                    }
                });
            }

            /*
             * If the user has requested an optimized data request, that means
             * the baseURL needs to be constructed from all of the registered
             * services, not just the one being used. That way the $metadata
             * will be optimized for this page to only contain those
             * Entities/FunctionImports that are actually used, minimizing the
             * download time for the $metadata XML.
             */
            if (oConfig.useOptimizedMetadata) {
                getOptimizedBaseUrl(sBaseUrl, sServiceGroup).done(function(sOptimizedBaseUrl) {
                    if (DeferredUtil.isODataServiceRegistered(sBaseUrl, sService, sServiceGroup)) {
                        sBaseUrl = sOptimizedBaseUrl;
                    }
                    invoke();
                });
            } else {
                invoke();
            }

            var oPromise = oDeferred.promise();
            if (oConfig.timeout > 0) {
                return this.addTimeout(oPromise, oConfig.timeout);
            }
            
            return oPromise;
        },

        /**
         * Returns the string given as argument escaped for oData.
         * The returned string will be surrounded by a pair of single
         * quote characters, and each inner single quote character it
         * may contain will be escaped by another single quote character.
         * 
         *
         * @public
         * @param {String} sString The string to escape for oData
         * @returns {String} The string escaped for oData
         */
        encodeStringForOData: function(sString) {
            if (sString === null || typeof sString === 'undefined') {
                return "''";
            } else if (sString === "''") {
                return sString;
            }

            sString = '' + sString;
            var iLastIndex = sString.length - 1;
            if (sString.length > 2 && sString.charAt(0) === "'" && sString.charAt(iLastIndex) === "'") {
                sString = sString.substr(0, iLastIndex);
                sString = sString.substr(1);
            }
            return "'" + sString.replace(/\'+/g, "''") + "'";
        },

        /**
         * Normalize an OData response so that it resembles what DWR would have returned.
         * For use when replacing DWR ajaxService calls with OData functionimports that have
         * not changed the response object return types.
         *
         * @param {Object} oResponse The response object from OData
         * @param {String=} sResponseType A named response type
         */
        normalizeODataResponse : function(oResponse, sResponseType) {
            if (oResponse && typeof oResponse == 'object') {
                for (var sProp in oResponse) {
                    var oValue = oResponse[sProp];
                    var aResults = oValue && oValue.results;
                    if (aResults) {
                        if (aResults.length > 0 && aResults[0].key) {
                            oResponse[sProp] = aResults.reduce(function(map, entry) {
                                map[entry.key] = DeferredUtil.normalizeODataResponse(entry.value);
                                return map;
                            }, {});
                        } else {
                            oResponse[sProp] = aResults.map(DeferredUtil.normalizeODataResponse);
                        }
                    } else if (oValue && typeof oValue == 'object') {
                        DeferredUtil.normalizeODataResponse(oValue, sResponseType);
                    }
                }
                if (sResponseType && oResponse[sResponseType]) {
                    oResponse = oResponse[sResponseType];
                }
            }
            return oResponse;
        },

        /**
         * show error dialog here
         */
        showErrorDialog: function(errorMsg) {
            sap.ui.require(['sap/m/Text', 'sap/m/Dialog', 'sap/m/Button'], function(Text, Dialog, Button) {
                var oContent = [
                    new Text({
                      text: errorMsg
                    }).addStyleClass('exceptionText')
                ];

                var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
                var errDialog = new Dialog('ajaxErrorDialog', {
                    title: rb.getText('COMMON_Error'),
                    contentWidth: '600px',
                    resizable: false,
                    content: oContent,
                    endButton: new Button({
                        text: rb.getText('COMMON_Ok'),
                        type: 'Emphasized',
                        press: function (oEvent) {
                            oEvent.getSource().getParent().close();
                        }.bind(this)
                    }),
                    afterClose: function () {
                        this.destroy();
                    }
                }).addStyleClass('globalAjaxErrDialog');
                errDialog.open();
            });
        },

        /**
         * Final step to process Url, adding any Proxy and ensuring base domain if needed.
         *
         * @param {String} sUrl
         * @return {String}
         */
        processODataURL : function(sUrl) {
            var oPageMetaData = window.pageHeaderJsonData || {};
            var sProxyUrl = oPageMetaData.odataProxyUrl;
            if (sProxyUrl) {
                if (sUrl && sUrl.indexOf('/') == 0 && sUrl.indexOf('//') != 0) {
                    if (sProxyUrl.lastIndexOf('/') == (sProxyUrl.length-1)) {
                        sProxyUrl = sProxyUrl.substring(0, sProxyUrl.length-1);
                    }
                    return sProxyUrl + sUrl;
                }
            } else {
                return Util.ensureBaseDomain(sUrl);
            }
            return sUrl;
        },

        /**
         * Use this utility function to create an ODataModel. Normally this will
         * return a Promise, and asynchronously resolve the ODataModel. To
         * immediately create the ODataModel, you must pass useOptimizedMetadata
         * as false, and highPriority as true.
         * 
         * The resulting ODataModel can be used to bind properties on a Control
         * object, or directly used to invoke services like read/create/remove
         * 
         * Alternatively, use invokeODataService if just one service call is
         * required, and the ODataModel object instance is not needed.
         * 
         * @param {Object=} oConfig
         * @param {String=} oConfig.baseUrl Default '/odata/v2/restricted/'
         * @param {Integer=} oConfig.version Default 1, can be 2 or 4
         * @param {Boolean=} oConfig.useOptimizedMetadata Default true
         * @param {Boolean=} oConfig.highPriority Default false, if false then
         *            the ODataModel will not be created right away, it will
         *            wait for high priority things to complete first to ensure
         *            that no OData connections will be made.
         * @param {Object=} oConfig.options Options to pass to the ODataModel,
         *            examples {loadMetadataAsync, tokenHandling, json}
         * @return A Promise for the ODataModel
         */
        createODataModel : function(oConfig) {
            oConfig = $.extend({
                baseUrl : DEFAULT_BASE_URL,
                highPriority : false,
                version : 1,
                options : {
                    loadMetadataAsync : true,
                    tokenHandling : false,
                    json : true
                }
            }, oConfig || {});

            var sBaseUrl = oConfig.baseUrl;
            var sServiceGroup = oConfig.serviceGroup;

            if (oConfig.useOptimizedMetadata == null) {
                oConfig.useOptimizedMetadata = !!(sServiceGroup || REGISTRY[getODataRegistryKey(sBaseUrl, sServiceGroup)]);
            }

            /**
             * @inner
             */
            function createModel() {
                var oClassLookup = {
                    1 : 'sap.ui.model.odata.ODataModel',
                    2 : 'sap.ui.model.odata.v2.ODataModel',
                    4 : 'sap.ui.model.odata.v4.ODataModel'
                };
                var oModelConfig = $.extend({}, oConfig.options);
                var sSecurityToken = window.ajaxSecKey;
                if (typeof sSecurityToken == 'string') {
                    oModelConfig.headers = oModelConfig.headers || {};
                    oModelConfig.headers['X-CSRF-Token'] = sSecurityToken;
                }
                var sClass = oClassLookup[oConfig.version];
                if (sClass) {
                    $.sap.require(sClass);
                    var oClass = $.sap.getObject(sClass);
                    return new oClass(DeferredUtil.processODataURL(sBaseUrl), oModelConfig);
                } else {
                    throw 'Invalid ODataModel version: ' + oConfig.version;
                }
            }

            /**
             * @inner
             */
            function start() {
                if (oConfig.useOptimizedMetadata === false) {
                    return createModel();
                } else {
                    return getOptimizedBaseUrl(sBaseUrl, sServiceGroup).then(function(sOptimizedBaseUrl) {
                        sBaseUrl = sOptimizedBaseUrl;
                        return createModel();
                    });
                }
            }

            if (oConfig.highPriority) {
                return start();
            } else {
                return this.whenLowPriority(oConfig.priority).then(start);
            }
        },

        /**
         * Determine if the given OData service was registered.
         * 
         * @param {String} sBaseUrl
         * @param {String} sService
         */
        isODataServiceRegistered : function(sBaseUrl, sService, sServiceGroup) {
            var oRegistry = getODataRegistry(sBaseUrl, sServiceGroup);
            var aServices = oRegistry && oRegistry.services;
            return aServices && $.inArray(sService, aServices) >= 0;
        },

        /**
         * The given service group will be replaced with this sServiceAlias.
         *
         * @param {String} oConfig.serviceGroup
         * @param {String} oConfig.serviceAlias
         */
        registerODataServiceAlias : function(oConfig) {
            var args = arguments;
            if (args.length == 3) {
                oConfig = {
                    baseUrl: args[0] || DEFAULT_BASE_URL,
                    serviceGroup: args[1],
                    serviceAlias: args[2]
                }
            } else {
                oConfig = $.extend({
                    baseUrl : DEFAULT_BASE_URL
                }, oConfig || {});
            }
            var oRegistry = getODataRegistry(oConfig.baseUrl, oConfig.serviceGroup || oConfig.serviceAlias);
            oRegistry.serviceAlias = oConfig.serviceAlias;
            oRegistry.optimizedBaseUrl = null;
        },

        /**
         * Register the odata service so that it can be used to optimize the
         * $metadata XML response size.
         * 
         * @param {Object} oConfig
         * @param {String|Array.<String>} oConfig.serviceName
         *     The name of the entity/service
         * @param {String} oConfig.serviceGroup
         *     A unique string to group the services, e.g. module name like "GACESearch"
         * @param {String=} oConfig.baseUrl 
         *     Defaults to '/odata/v2/restricted/'
         * @return {Boolean} If the registry was successful
         */
        registerODataService : function(oConfig) {
            oConfig = $.extend({
                baseUrl : DEFAULT_BASE_URL
            }, oConfig || {});
            var sBaseUrl = oConfig.baseUrl;
            var sServiceAlias = oConfig.serviceAlias;
            var sServiceGroup = oConfig.serviceGroup || sServiceAlias;
            var oRegistry = getODataRegistry(sBaseUrl, sServiceGroup);
            var aAvailableGroups = AVAILABLE_GROUPS[sBaseUrl] = AVAILABLE_GROUPS[sBaseUrl] || [];
            if ($.inArray(sServiceGroup, aAvailableGroups) < 0) {
                aAvailableGroups.push(sServiceGroup);
            }
            if (sServiceAlias) {
                oRegistry.serviceAlias = sServiceAlias;
            }
            var bNotFinalized = !oRegistry.optimizedBaseUrl;
            if (bNotFinalized) {
                var sService = oConfig.serviceName;
                var aServices = oRegistry.services = oRegistry.services || [];
                var bResult = true;
                if (!$.isArray(sService)) {
                    sService = [ sService ];
                }
                $.each(sService, function(i, sService) {
                    if ($.inArray(sService, aServices) < 0) {
                        aServices.push(sService);
                    }
                });
            } else {
                LOG.error('The following service was already finalized: ' + oConfig.baseUrl + oConfig.serviceName);
            }
            return bNotFinalized;
        },

        /**
         * Finalize the odata registry so that optimized odata calls can start.
         * 
         * @param {String=} oConfig.baseUrl
         *     Defaults to '/odata/v2/restricted/'
         * @param {String=} oConfig.serviceGroup
         * @param {String=} oConfig.serviceAlias
         */
        finalizeODataRegistry : function(oConfig) {
            var sBaseUrl, sServiceGroup, sServiceAlias;
            if (typeof oConfig == 'string') {
                sBaseUrl = oConfig;
                sServiceGroup = arguments[1];
                sServiceAlias = arguments[2];
            } else if (oConfig && typeof oConfig == 'object') {
                sBaseUrl = oConfig.baseUrl;
                sServiceGroup = oConfig.serviceGroup;
                sServiceAlias = oConfig.serviceAlias;
            }
            if (sServiceAlias && !sServiceGroup) {
                sServiceGroup = sServiceAlias;
            }
            getODataRegistry(sBaseUrl || DEFAULT_BASE_URL, sServiceGroup).finalize();
        },

        /**
         * Reset the ODataRegistry so that future optimized OData calls will use
         * a different subset of service names.
         * 
         * @param {String=} sBaseUrl optional, defaults to
         *            '/odata/v2/restricted/'
         */
        resetODataRegistry : function(sBaseUrl, sServiceGroup) {
            REGISTRY[getODataRegistryKey(sBaseUrl, sServiceGroup)] = null;
        },

        /**
         * Invoke a jsonp service. This has a couple of features which
         * jQuery.getJSON does not have, which is the possibility to time out,
         * and the jsonp callback may take more than one parameter.
         * 
         * @param {String} sUrl
         * @param {Integer=} iTimeout
         * @return {Promise}
         */
        invokeJsonpService : function(sUrl, iTimeout) {
            var sCallbackId = 'sfDeferredUtilCallback' + (JSONP_INDEX++);

            var iQueryIndex = sUrl.indexOf('?');
            var iLastQueryIndex = sUrl.lastIndexOf('?');
            var aResult = /^(.*[&\?][^\?]+=)\?([^\?]*)$/.exec(sUrl);
            if (iLastQueryIndex !== iQueryIndex && aResult) {
                sUrl = aResult[1] + sCallbackId + aResult[2];
            } else {
                sUrl += ((iQueryIndex < 0) ? '?' : '&') + 'callback=' + sCallbackId;
            }

            var oDfd = $.Deferred();
            window[sCallbackId] = function() {
                if (oDfd.state() == 'pending') {
                    oDfd.resolve.apply(oDfd, arguments);
                }
            }

            /*
             * jQuery.ajax or getJSON do not support multi-argument function
             * calls, as this is not standard for jsonp. So we will manually
             * create the script ourselves.
             */
            var oScript = document.createElement('script');
            oScript.id = sCallbackId;
            oScript.type = 'text/javascript';
            oScript.src = sUrl;
            var snonce = Util.getCSPScriptNonce();
            if (snonce){
                oScript.nonce = snonce;
            }

            var iTimeoutId = null;

            if (iTimeout != null && iTimeout > 0) {
                var iTimeoutId = setTimeout(function() {
                    if (oDfd.state() == 'pending') {
                        oDfd.reject('timeout'); // No status codes for timeout
                        window[sCallbackId] = function() {
                        };
                    }
                }, iTimeout);
            }

            // Reject if the script tag dispatches error event
            $(oScript).bind('error', function() {
                oDfd.reject('unknown_error');
            });

            // Cleanup the script tag once the deferred is complete
            oDfd.always(function() {
                $('#' + sCallbackId).remove();
                iTimeoutId != null && clearTimeout(iTimeoutId);
                window[sCallbackId] = null;
            });

            // Insert the jsonp script tag into head
            // Don't use jQuery.fn.append for this because it misbehaves
            $('head')[0].appendChild(oScript);

            return oDfd.promise();
        },

        /**
         * Add a priorty deferred, which will cause low priority calls to be
         * delayed until this priority Deferred is complete.
         * 
         * @param {Promise} oPromise A promise that this priority call will
         *            complete
         * @param {String} sCallId An identifier for this priority call
         * @param {Boolean} bKeyContent Will default to true, pass as false if
         *            this high priority call is not key content
         */
        addPriorityDeferred : function(oPromise, sCallId, bKeyContent) {
            if (bKeyContent !== false) {
                KEY_CONTENT_COUNT++;
            }
            PRIORITY_COUNT++;
            oPromise.always(function() {
                if (bKeyContent !== false) {
                    --KEY_CONTENT_COUNT;
                    setTimeout(function() {
                        if (KEY_CONTENT_COUNT == 0) {
                            KEY_CONTENT_DFD.resolve();
                        }
                    }, 20);
                }
                if (--PRIORITY_COUNT == 0) {
                    var iCount = 0;
                    $.each(PRIORITY_ORDER, function(i, sPriority) {
                        iCount += DELAYED_CALLS[sPriority].length;
                    });
                    if (iCount > 0) {
                        LOG.debug('Priority Call ' + sCallId + ' complete; now initiating ' + iCount + ' low priority calls');
                        $.each(PRIORITY_ORDER, function(i, sPriority) {
                            var aCalls = DELAYED_CALLS[sPriority];
                            if (aCalls.length > 0) {
                                DELAYED_CALLS[sPriority] = [];
                                $.each(aCalls, function(i, fCallback) {
                                    if (typeof fCallback == 'function') {
                                        try {
                                            var oPromise = fCallback();
                                            // Duck type a promise
                                            if (oPromise && typeof oPromise.promise == 'function') {
                                                DELAYED_PROMISES.push(oPromise);
                                            }
                                        } catch (e) {
                                            LOG.error('A low priority call failed', e);
                                        }
                                    }
                                });
                            }
                        });
                    } else {
                        LOG.debug('Priority Call ' + sCallId + ' complete; no low priority calls waiting');
                    }
                }
            });
        },
        
        /**
         * @return {Promise}
         */
        whenKeyContentLoaded : function() {
            return KEY_CONTENT_DFD.promise();
        },

        /**
         * Create a Promise that is resolved when a low priority process can
         * run.
         * 
         * @param {String} sPriority "HIGHEST", "HIGH", "MEDIUM", "LOW", or
         *            "LOWEST"
         * @return {Promise}
         */
        whenLowPriority : function(sPriority) {
            var oDeferred = $.Deferred();
            this.delayLowPriorityCall(function() {
                oDeferred.resolve();
            }, sPriority);
            return oDeferred.promise();
        },

        /**
         * Delay a callback until all priority Deferreds have been resolved
         * 
         * @param {Function} fCallback This function is called after all
         *            priority Deferreds are resolved, or right away if there
         *            are no priority Deferreds.
         * @param {String} sPriority "HIGHEST", "HIGH", "MEDIUM", "LOW", or
         *            "LOWEST" - default is "MEDIUM"
         */
        delayLowPriorityCall : function(fCallback, sPriority) {
            if (PRIORITY_COUNT == 0) {
                var oPromise = fCallback();
                // Duck type a promise
                if (oPromise && typeof oPromise.promise == 'function') {
                    DELAYED_PROMISES.push(oPromise);
                }
            } else {
                if (!DELAYED_CALLS[sPriority]) {
                    sPriority = 'MEDIUM';
                }
                DELAYED_CALLS[sPriority].push(fCallback);
            }
        },

        /**
         * Call this to wait for low priority calls to finish.
         * 
         * @return {Promise} A promise that all low priority calls are complete
         */
        whenLowPriorityCallsFinish : function() {
            var oDfd = $.Deferred();
            this.whenLowPriority().always(function() {
                setTimeout(function() {
                    var iLen = DELAYED_PROMISES.length;
                    function checkLength() {
                        if (iLen === DELAYED_PROMISES.length) {
                            oDfd.resolve();
                        } else {
                            DeferredUtil.whenLowPriorityCallsFinish().then(function() {
                                oDfd.resolve();
                            }, function() {
                                oDfd.reject();
                            });
                        }
                    }
                    if (iLen > 0) {
                        return $.when.apply($, DELAYED_PROMISES).then(checkLength);
                    } else {
                        /*
                         * If no low priority calls are happening right now,
                         * give 10 milliseconds for another one to be added
                         * before resolving.
                         */
                        setTimeout(checkLength, 10);
                    }
                }, 10);
            });
            return oDfd.promise();
        },

        /**
         * Add a timeout to a promise so it will reject if the Promise takes too long.
         *
         * @param {Promise} oPromise
         *    The Promise that could potentially take a long time to resolve
         * @param {Integer} iTimeout
         *    The number of milliseconds before the Promise is rejected
         * @return {Promise}
         */
        addTimeout : function(oPromise, iTimeout) {
            var oDfd = $.Deferred();
            // If it times out, reject the deferred
            var iTimeoutId = setTimeout(function() {
                oDfd.reject('timeout');
            }, iTimeout);
            /** @inner */
            function complete(sType, oArgs) {
                // Only pass along the call if the Deferred is still pending
                if (oDfd.state() == 'pending') {
                    oDfd[sType].apply(oDfd, oArgs);
                }
                /*
                 * Clear the timeout only if the state is no longer pending
                 * if the previous call resolved or rejected, then the state
                 * will no longer be pending.
                 */
                if (oDfd.state() != 'pending') {
                    clearTimeout(iTimeoutId);
                }

            }
            // The three handlers will simply pass along to the Deferred
            oPromise.done(function() {
                complete('resolve', arguments);
            }).fail(function() {
                complete('reject', arguments);
            }).progress(function() {
                complete('notify', arguments);
            });
            return oDfd.promise();
        },

        /**
         * Wait for the sap.m library to load the CSS.
         *
         * @param {Integer=} iTimeout
         *     Maximum amount of time to wait, if not defined then never timeout.
         * @return {Promise}
         */
        whenUI5LibraryCSSReady : function(iTimeout) {
            // We only need to create this Promise object once
            if (!MLIB_PROMISE) {
                // Constants that could be changed later
                var sTesterId = 'surjMLibTester';
                var sTesterClass = 'sapMBarRight';
                var sTestCSSProperty = 'position';
                var sTestExpectedValue = 'absolute';
                var iShortIntervalThreshold = 5000;
                var iShortInterval = 50;
                var iLongInterval = 1000;
                var iStartTime = new Date().getTime();
            
                /* @inner */
                function isReady() {
                    /*
                     * Recreate this jQuery element each time to ensure no one else can delete the
                     * DOM element in between interval checks.
                     */
                    var $el = $('#' + sTesterId);

                    if ($el.length == 0) {
                        // If the test element doesn't exist, create one and add to the body
                        $el = $('<div style="display:none"></div>').attr({
                            id : sTesterId,
                            class : sTesterClass
                        }).appendTo('body');
                    }

                    return $el.css(sTestCSSProperty) === sTestExpectedValue;
                }

                // Create the Deferred, when finished make sure to remove the tester element.
                var oDfd = $.Deferred().always(function() {
                    $('#' + sTesterId).remove();
                });

                // We will check right away if it's ready
                if (isReady()) {
                    oDfd.resolve();
                } else {
                    // If not ready we will wait a short amount of time and test again
                    /** @inner */
                    function check() {
                        if (isReady()) {
                            oDfd.resolve();
                        } else {
                            /*
                             * If the CSS takes longer than the threshold amount of time, most likely the CSS will
                             * never load. So don't keep checking so quickly by using a longer interval.
                             */
                            var iElapsedTime = new Date().getTime() - iStartTime;
                            var iIntervalTime = iElapsedTime <= iShortIntervalThreshold ? iShortInterval : iLongInterval;
                            setTimeout(check, iIntervalTime);
                        }
                    }

                    setTimeout(check, iShortInterval);
                }

                // Stored in the outer scope to share across multiple calls
                MLIB_PROMISE = oDfd.promise();
            }

            /*
             * The MLIB_PROMISE will always wait until the library.css is finished
             * possibly forever if the CSS never loads. So if the caller wants to
             * timeout we need to wrap the promise by calling addTimeout.
             */
            if (iTimeout > 0) {
                return this.addTimeout(MLIB_PROMISE, iTimeout);
            } else {
                return MLIB_PROMISE;
            }
        }
    };

    /** @inner */
    var JSONP_INDEX = 0;

    /**
     * @inner
     * @param {String} sUrl
     * @param {String} sCallbackId
     * @return {String}
     */
    function constructJsonpUrl(sUrl, sCallbackId) {
        var iQueryIndex = sUrl.indexOf('?');
        var iLastQueryIndex = sUrl.lastIndexOf('?');
        var aResult = /^(.*[&\?][^\?]+=)\?([^\?])*$/.exec(sUrl);
        if (iLastQueryIndex !== iQueryIndex && aResult) {
            sUrl = aResult[1] + sCallbackId + aResult[2];
        } else {
            sUrl += ((iQueryIndex < 0) ? '?' : '&') + 'callback=' + sCallbackId;
        }
        return sUrl;
    }

    /**
     * Static registry for odata services.
     * 
     * @inner
     */
    var DEFAULT_BASE_URL = '/odata/v2/restricted/';
    var REGISTRY = {};
    var AVAILABLE_GROUPS = {};
    var AJAXSERVICE_PROMISES = {};
    var PRIORITY_COUNT = 0;
    var KEY_CONTENT_COUNT = 0;
    var KEY_CONTENT_DFD = $.Deferred();
    var PRIORITY_ORDER = [ 'HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST' ];
    var DELAYED_CALLS = {
        HIGHEST : [],
        HIGH : [],
        MEDIUM : [],
        LOW : [],
        LOWEST : []
    };
    var DELAYED_PROMISES = [];
    var MLIB_PROMISE;

    /**
     * Logger for DeferredUtil.
     * 
     * @inner
     */
    var LOG = Logger.getLogger('DeferredUtil');

    /**
     * Get the key for the registry.
     *
     * @inner
     * @param {String} sBaseUrl
     * @param {String} sServiceGroup
     */
    function getODataRegistryKey(sBaseUrl, sServiceGroup) {
        return sBaseUrl + (sServiceGroup ? '|' + sServiceGroup : '');
    }

    /**
     * Get the odata registry for a particular base url.
     * 
     * @inner
     * @param {String} sBaseUrl
     * @return {Object}
     */
    function getODataRegistry(sBaseUrl, sServiceGroup) {
        var sKey = getODataRegistryKey(sBaseUrl, sServiceGroup);
        var oRegistry = REGISTRY[sKey];
        if (!oRegistry) {
            var oFinalizeDfd = $.Deferred();
            oRegistry = REGISTRY[sKey] = {
                finalizePromise : oFinalizeDfd.promise(),
                finalize : function() {
                    oFinalizeDfd.resolve();
                }
            };
            // Commenting out the timeout for finalize
            // page must finalize registry to use it
            // var iTimeout = setTimeout(function() {
            // oFinalizeDfd.resolve();
            // }, 5000);
            // oFinalizeDfd.always(function() {
            // clearTimeout(iTimeout);
            // });
        }
        return oRegistry;
    }

    /**
     * Get the optimized base url, using the registered entities.
     * 
     * @inner
     * @param {String} sBaseUrl
     * @return {Promise.<String>} A promise for the optimized url, which will
     *         only be resolved once the registry has been finalized.
     */
    function getOptimizedBaseUrl(sBaseUrl, sServiceGroup) {
        var oRegistry = getODataRegistry(sBaseUrl, sServiceGroup);
        return oRegistry.finalizePromise.then(function() {
            var sOptimizedUrl = oRegistry.optimizedBaseUrl;
            if (sOptimizedUrl) {
                return $.Deferred().resolve(sOptimizedUrl);
            } else {
                sOptimizedUrl = sBaseUrl;
                var sServiceAlias = oRegistry.serviceAlias;
                if (sServiceAlias) {
                    if (!/\/$/.test(sOptimizedUrl)) {
                        // Add a forward slash if not already there
                        sOptimizedUrl += '/';
                    }
                    sOptimizedUrl += sServiceAlias + '/';
                } else {
                    var aServices = oRegistry.services;
                    if (aServices && aServices.length > 0) {
                        aServices.sort();
                        if (!/\/$/.test(sOptimizedUrl)) {
                            // Add a forward slash if not already there
                            sOptimizedUrl += '/';
                        }
                        sOptimizedUrl += aServices.join(',') + '/';
                    }
                }
                // Cache the optimized base url for later use
                oRegistry.optimizedBaseUrl = sOptimizedUrl;
            }
            return sOptimizedUrl;
        });
    }

    var HOOK_ID = 0;
    var PREHOOKS = [];
    var POSTHOOKS = [];

    /**
     * @inner
     * @param {Array.<function>} aCallbacks
     */
    function hookCallback(aCallbacks) {
        aCallbacks.forEach(function(fCallback) {
            try {
                typeof fCallback == 'function' && fCallback();
            } catch(e) {
                jQuery.sap.log.error('Error on AjaxService hook callback');
            }
        });
    }

    /**
     * @inner
     * @param {Array.<function>} aCallbacks
     * @param {function} fCallback
     * @return {Integer} iHookId
     */
    function addHook(aCallbacks, fCallback) {
        var id = HOOK_ID++;
        aCallbacks.push({id:id, prehook: fCallback});
        return id;
    }

    /**
     * @inner
     * @param {Array.<function>} aCallbacks
     * @param {Integer} iHookId
     */
    function removeHook(aCallbacks, iHookId) {
        for (var i=aCallbacks.length-1; i>=0; i--) {
            if (aCallbacks[i].id == iHookId) {
                aCallbacks.splice(i, 1);
            }
        }
    }

    /**
     * @inner
     * @param {Array.<function>} aCallbacks
     */
    function clearHooks(aCallbacks) {
        aCallbacks.length = 0;
    }

    /**
     * A replacement for window.AjaxService, but should only be used if window.Proxy is available,
     * and only when AjaxService is not already available.
     *
     * @inner
     */
    var AjaxServiceOverride = {
        /**
         * Check this variable to know if AjaxService has been overridden.
         */
        override: true,

        getRedirectUrl: function() {
            return window.timeout_redirect_url;
        },

        /**
         * @param {String} sServiceName
         * @return {Proxy} A proxy object that uses DeferredUtil internally
         */
        getMBeanInstance: function(sServiceName) {
            // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
            return new Proxy({}, {
                get: function(oTarget, sServiceMethod) {
                    return function() {
                        hookCallback(PREHOOKS);
                        var aArguments = Array.prototype.slice.call(arguments);
                        var callback = aArguments[aArguments.length-1];
                        var oCallbackMeta = {};
                        var bAsync;
                        if(typeof callback != 'undefined') {
                            if (typeof callback == 'function') {
                                // assign the passed in function as part of the callback
                                oCallbackMeta.callback = callback;
                            } else {
                                oCallbackMeta = callback;
                            }
                            bAsync = callback.async;
                        }
                        aArguments.splice(aArguments.length-1, 1); // remove the callback obj
                        DeferredUtil.invokeAjaxService({
                            noASProxy: true,
                            async: bAsync,
                            serviceName: sServiceName,
                            serviceMethod: sServiceMethod,
                            arguments: aArguments
                        }).done(function(oResponse) {
                            if (typeof oCallbackMeta.callback == 'function') {
                                oCallbackMeta.callback(oResponse);
                            }
                            hookCallback(POSTHOOKS);
                        }).fail(function(reason) {
                            jQuery.sap.log.error(reason);
                            if (typeof oCallbackMeta.errorHandler == 'function') {
                                oCallbackMeta.errorHandler(reason);
                            }
                        });
                    }
                }
            });
        },  
        addPreHook: function(fCallback) {
            return addHook(PREHOOKS, fCallback);
        },
        removePreHook: function(iHookId) {
            removeHook(PREHOOKS, iHookId);
        },
        clearPreHooks: function() {
            clearHooks(PREHOOKS);
        },
        addPostHook: function(fCallback) {
            return addHook(POSTHOOKS, fCallback);
        },
        removePostHook: function(iHookId) {
            removeHook(POSTHOOKS, iHookId);
        },
        clearPostHooks: function() {
            clearHooks(POSTHOOKS);
        }
    };

    // low priority things must wait for ui5 to init
    (function() {
        var oDfd = $.Deferred();
        DeferredUtil.addPriorityDeferred(oDfd.promise(), 'init.ui5');
        sap.ui.getCore().attachInit(function() {
            oDfd.resolve();
        });
    })();

    // if PerfPhase namespace exists, use that to delay low priority things
    (function(PerfPhase) {
        if (PerfPhase) {
            var oDfd = $.Deferred();
            DeferredUtil.addPriorityDeferred(oDfd, 'PerfPhase.highPriority');
            window.PerfPhase.runLowPriority(function() {
                oDfd.resolve();
            });
        }
    })(window.PerfPhase);

    $.sap.setObject('sap.sf.surj.shell.util.DeferredUtil', DeferredUtil);
    return DeferredUtil;
});
