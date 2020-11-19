sap.ui.define([
    'jquery.sap.global',
    'sap/ui/base/EventProvider',
    'sap/ui/Device',
    'sap/ui/core/HTML'
], function($, EventProvider, Device, HTML) {
    // Some of this code is copied from /ui/surj/js/Util.js
    // TODO: Delete the old version and use this one instead
    // References to Util must properly use sap.ui.require or sap.ui.define

    var MESSAGE_SERVICES = {};
    var Util;
    // TODO: Follow up with security team on status of these URLs
    // sapui5.hana.ondemand.com is required because alternative UI5 versions such as beta use this UI5 CDN
    var CSP_WHITELISTED_URLS = [
        "hyphenopoly.bundle.js",
        "sapui5.hana.ondemand.com"
    ];

    var SAFE_XHTML = /^(?:[^<>&"']|(?:&(?:[a-z]{2,}|#\d+|#x[\da-f]+);))*$/i;

    var SF_PROTECTED_POSTMESSAGE_URL = "/sf/protected/postmessage";

    /**
     * Escape special characters in Regular Expression patterns.
     * 
     * @param {String} text
     * @return {String}
     */
    RegExp.escape = (function() {
        var specials = [ '/', '.', '*', '+', '?', '|', '$', '(', ')', '[', ']', '{', '}', '\\', '&', '^' ];
        var sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
        return function(text) {
            return text.replace(sRE, '\\$1');
        };
    })();

    // The array temporally holds the list of modules on external domain that has user assistant enabled.
    // We will find a better way to maintain this list. 
    var EXTERNAL_MODULES_WITH_USER_ASSISTANT_SUPPORT = [
        "LEARNING"
    ];

    var Util = {
        /**
         * Locale cache if preferred locale is supported by UI5
         */

        _bPreferredLocaleSupported : null,
        /**
         * Is the page in RTL mode.
         * 
         * @param {HTMLElement|String=} oEl
         * @return {Boolean}
         */
        isRTL : function(oEl) {
            var sRtl = 'rtl';
            if (oEl) {
                return $(oEl).hasClass(sRtl);
            } else {
                var pageHeaderJsonData = window.pageHeaderJsonData;
                var sLangDir = pageHeaderJsonData && pageHeaderJsonData.langDir;
                if (sLangDir) {
                    return sLangDir == sRtl;
                } else {
                    return $(document.body).hasClass(sRtl);
                }
            }
        },

        /**
         * @return {Boolean}
         */
        isFioriEnabled : function() {
            var pageHeaderJsonData = window.pageHeaderJsonData;
            var isFioriEnabledSet = pageHeaderJsonData && pageHeaderJsonData.fioriEnabled;
            if (isFioriEnabledSet) {
                return isFioriEnabledSet;
            } else {
                return $('body').hasClass('fiori');
            }
        },

        /**
         * @param {String} name
         * @return {String}
         */
        findURLParamByUrl : function(name, url) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(url);
            if (results == null)
                return "";
            else
                return results[1];
        },

        /**
         * @param {String} name
         * @return {String}
         */
        findURLParam : function(name) {
            return this.findURLParamByUrl(name, window.location.href);
        },

        /**
         * Remove nonalphanumeric characters from the string
         * @public
         * @param {string} text         The string to remove nonalphanumeric characters from
         * @param {string} replaceWith  (Optional). String to replace nonalphanumeric with. Default is _
         */
        createIdentifier : function (text, replaceWith) {
            var swap = replaceWith ? replaceWith : '_';
            return text.replace(/\W/g, swap);
        },

        normalizeForLangDir : function(ltrString) {
            if (!ltrString) {
                return '';
            }
            if (this.isRTL()) {
                return ltrString.replace(/\(/g, '\u200E(').replace(/\)/g, ')\u200E');
            }
            return ltrString;       
        },
        /**
         * This function is used to invoke the mail  
         */
        invokeMailToURL : function(mailToURL) {
            if(sap.ui.Device.browser.chrome) {
                // RCM-22477 - This function will be used only in Chrome browser because
                // Chrome treat the mailto link as insecure and not allowing insecure url to open under https url.
                window.location = mailToURL;
            } else {
                // RCM-17472 - Internet Explorer that needs to launch the "mailto" URL in the hidden iframe due to
                // http://jira.successfactors.com/browse/RCM-17058?focusedCommentId=1334712&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-1334712
                var id = 'juicMailToFrame', old = $('#' + id), iframe;
                old.remove();
                iframe = document.createElement('iframe');
                iframe.id = id;
                iframe.src = mailToURL;
                iframe.style.display = 'none';
                var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
                iframe.title = rb.getText('COMMON_HIDDEN_FRAME_TITLE') || 'Hidden frame used to aid in UI rendering';
                document.body.appendChild(iframe);
            }
        },

        /**
         * Get the ajaxToken, then setup any future Ajax requests to SuccessFactors to pass along the header on requests.
         * This could potentially replace SuccessFactors XMLHttpRequest wrapper which adds that header.
         * This only works if CORS is activated on SuccessFactors domain to the current page domain.
         *
         * @param {Object} oSettings
         *    The baseURL of SuccessFactors, i.e. https://performancemanager5.successfactors.com
         * @param {String=} oSettings.deepLink
         *    The suffix of the URL for the deeplink, appended to the baseUrl, used to call SF to get the ajax token,
         *    default is "/sf/protected/cors"
         * @param {Integer=} oSettings.timeout
         *    Timeout to wait for reply in milliseconds, default is 100, only applicable if using message service
         * @param {Booean=} oSettings.disconnect
         *    Disconnect the message service afterwards, default is false
         * @return {Promise.<String>}
         *    A promise for the ajax token string
         */
        initAjaxToken: function(oSettings) {
            oSettings = oSettings || window.pageHeaderJsonData;
            if (Util._initAjaxTokenPromise) {
                return Util._initAjaxTokenPromise;
            }
            return Util._initAjaxTokenPromise = Util.getAjaxToken(oSettings).then(function(sAjaxSecKey) {
                var sBaseUrl = (oSettings && oSettings.baseUrl) || Util.getLocationOrigin();
                window.ajaxSecKey = sAjaxSecKey; // TODO: Maybe this global reference shouldn't be used
                $(document).ajaxSend(function(oEvent, jqXHR, oOptions) {
                    var sReqUrl = oOptions && oOptions.url;
                    // OData requests will need this header, others do not
                    // Any request that gets this header will need a Preflight OPTIONS request
                    // This request reduces performance, and in some cases will be restricted by nginx
                    // so for this reason we should limit which URLs get this header
                    if (sReqUrl &&
                        Util.isBizXDomain(sReqUrl) &&
                        /(?:https?:\/\/[^\/]|)*\/odata\//.test(sReqUrl)) {
                        jqXHR.setRequestHeader('X-Ajax-Token', sAjaxSecKey);
                    }
                    Util._AddCredentailsForCompanyMessageBundle(sReqUrl, oOptions);
                });
                return sAjaxSecKey;
            });
        },

        _AddCredentailsForCompanyMessageBundle: function(sReqUrl, oOptions) {
            if(sReqUrl && Util.isBizXDomain(sReqUrl) && sReqUrl.indexOf("/messagebundle/" + encodeURIComponent((window.pageHeaderJsonData || {}).companyId) + "/") >= 0) {
                oOptions.xhrFields = {withCredentials: true};
            }
        },

        /**
         * Retrieve the ajaxSecKey.
         * This only works if CORS is activated on SuccessFactors domain to the current page domain.
         *
         * @param {Object} oSettings
         *    The baseURL of SuccessFactors, i.e. https://performancemanager5.successfactors.com
         * @param {String=} oSettings.deepLink
         *    The suffix of the URL for the deeplink, appended to the baseUrl, used to call SF to get the ajax token,
         *    default is "/sf/protected/cors"
         * @return {Promise.<String>}
         *    A promise for the ajax token string
         */
        getAjaxToken : function(oSettings) {
            if (window.ajaxSecKey) {
                return Promise.resolve(window.ajaxSecKey);
            }
            oSettings = oSettings || {};
            var sBaseUrl = oSettings.baseUrl,
                sDeepLink = oSettings.deepLink || '/sf/protected/cors';
            if (!sBaseUrl) {
                throw new Error("oSettings.baseUrl is required");
            }
            return new Promise(function(res, rej) {
                $.ajax({
                    url: sBaseUrl + sDeepLink,
                    xhrFields: {
                        withCredentials: true
                    }
                }).then(function(sResponseText) {
                    var aParts = /ajaxSecKey\s*=\s*['"]([^'"]*)['"]/.exec(sResponseText);
                    if (aParts) {
                        res(aParts[1]);
                    } else {
                        $.sap.log.error('AjaxToken Deeplink response did not contain AjaxToken');
                        rej('invalidResponse');
                    }
                }, function(jqXHR) {
                    $.sap.log.error('AjaxToken Deeplink could not be read');
                    rej('serverError');
                });
            });
        },
        /**
         * Returns the CSP script nonce
         *
         * @return {string} the CSP script nonce
         */
        getCSPScriptNonce: function() {
            return (document.querySelector('meta[name=snonce]')||{}).content;
        },
        /**
         * Replacement for JavaScript's eval() function.
         *
         * WARNING!:
         *
         * As https://eslint.org/docs/rules/no-eval eloquently explains
         * (which we now parapharse here), in general, evaluating arbitrary
         * strings as JavaScript code is risky because the code can be
         * potentially dangerous and is often misused.  Using eval() on
         * untrusted code can open a program up to several different
         * injection attacks. The use of eval() in most contexts can be
         * substituted for a better, alternative approach to a problem.
         *
         * However, if you truly need to evaluate a string as JavaScript
         * code, and you have ensured that the string only contains only
         * trusted code, then you can use this function.
         *
         * Note that if there is a CSP script nonce available, then this
         * code will execute the code via a script tag with the nonce,
         * rather than using eval().
         *
         * @param {string} scriptString the CSP script nonce
         * @return {boolean} whether a CSP-nonced script tag was used or not
         *                   (in which case, a eval() call was used instead)
         */
        dangerouslyEvalScript: function(scriptString) {
            // If there isn't a CSP script nonce available, then use eval()
            var snonce = this.getCSPScriptNonce();
            if (!snonce) {
                eval(scriptString); // eslint-disable-line no-eval
                return false;
            }

            // Since there is a CSP script nonce available, use a script tag
            // with the nonce
            var doc = document;
            var scriptTag = doc.createElement("script");
            if (snonce) {
                scriptTag.nonce = snonce;
            }
            var scriptId = "escript_" + Date.now();
            scriptTag.id = scriptId;
            scriptTag.text = scriptString + ";\ndocument.body.removeChild(document.getElementById('" + scriptId + "'));";
            doc.body.appendChild(scriptTag);
            return true;
        },
        dangerouslyIncludeScript: function(url, attribs, loadHandler) {
            var doc = document;
            var scriptTag = doc.createElement("script");
            var snonce = this.getCSPScriptNonce();
            if (snonce) {
              scriptTag.nonce = snonce;
            }
            scriptTag.type = "text/javascript";
            scriptTag.src = url;
            if (attribs) {
              for (var key in attribs) {
                scriptTag.setAttribute(key, attribs[key]);
              }
            }
            var promise = new Promise(function(resolve){
                scriptTag.onload = function() {
                    loadHandler && loadHandler();
                    resolve();
                }
                scriptTag.onerror = function(error) {
                    console.warn('There is a problem loading url ' + url);
                }
            });
            doc.body.appendChild(scriptTag);
            return promise;
        },
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
            if (Array.isArray(val)) {
                var aResult = bClone ? [] : val;
                val.forEach(function(subval, i) {
                    aResult[i] = Util.maybeUnescapePlainText(subval, bClone);
                });
                return aResult;
            } else if (val && typeof val == 'object') {
                var oResult = bClone ? {} : val;
                for (var sAttr in val) {
                    oResult[sAttr] = Util.maybeUnescapePlainText(val[sAttr], bClone);
                }
                return oResult;
            } else if (typeof val == 'string' && SAFE_XHTML.test(val)) {
                return $('<div>' + val + '</div>').text();
            }
            return val;
        },
        /**
         * Get the pageMetaData object prior to the shell being created.
         * Make sure to call initAjaxToken first, using the result from this you can call initPageHeader.
         *
         * @param {Object} oSettings
         *    All the options to pass
         * @param {String} oSettings.baseUrl
         *    The baseURL of SuccessFactors, i.e. https://performancemanager5.successfactors.com
         * @param {String} oSettings.odataProxyUrl
         *    The odataProxyUrl to use
         * @param {String=} oSettings.moduleId
         *    The ID of the menu item that should be selected, i.e. Jam, Default is "NONE"
         * @param {String=} oSettings.pageQualifier
         *    Optional page qualifier used for identifying the page uniquely if the moduleId is not enough
         * @param {String=} oSettings.hcMode
         *    one of ["normal", "hcb", "hcw"], default is calculated from the current theme
         * @param {String=} oSettings.language
         *    The current language of the page, default is the language from UI5 core
         * @param {Boolean=} oSettings.disableCompanyTranslations
         *    Should company translations be disabled
         * @return {Promise} a Promise for the pageMetaData object
         */
        fetchPageMetaData: function(oSettings) {
            window.pageHeaderJsonData = $.extend({}, oSettings, {
                enableBaseDomainCheck: true // this is always checked
            });

            // having an odataProxyUrl means the page is using a Smart Proxy
            // in which case CORS and AjaxToken are not required
            if (!oSettings.odataProxyUrl) {
                if (!Util.isRunningBaseDomain() && !Util.isBaseDomainCORSEnabled()) {
                    return Promise.reject("getPageMetaData requires CORS enabled");
                }
                if (!window.ajaxSecKey) {
                    return Promise.reject("getPageMetaData requires ajaxSecKey");
                }
            }

            return new Promise(function(res, rej) {
                sap.ui.require([
                    'sap/sf/surj/shell/util/DeferredUtil',
                    'jquery.sap.storage'
                ], function(DeferredUtil) {
                    var sAjaxToken = window.ajaxSecKey;
                    var sLanguage = oSettings.language;
                    var sHcMode = oSettings.hcMode;
                    var sCompanyId = oSettings.companyId;
                    var sUserId = oSettings.userId;
                    var sProxyUserId = oSettings.proxyUserId;
                    var bUseAbs = oSettings.useAbsPaths !== false;

                    if (!sHcMode) {
                        var aParts = /(hcb|hcw)$/.exec(sap.ui.getCore().getConfiguration().getTheme());
                        if (aParts) {
                            sHcMode = aParts[1];
                        } else {
                            sHcMode = 'normal';
                        }
                    }
                    var aParams = [
                        ['$format', 'json'],
                        ['moduleId', oSettings.moduleId || 'NONE'],
                        ['useAbsPaths', bUseAbs],
                        ['hcMode', sHcMode]
                    ];
                    if (sUserId) {
                        aParams.push(['userId', sUserId]);
                    }
                    if (sCompanyId) {
                        aParams.push(['companyId', sCompanyId]);
                    }
                    if (sLanguage) {
                        aParams.push(['locale', sLanguage]);
                    }
                    if (oSettings.pageQualifier) {
                        aParams.push(['pageQualifier', oSettings.pageQualifier]);
                    }
                    if (oSettings.disableCompanyTranslations) {
                        aParams.push(['disableCompanyTranslations', oSettings.disableCompanyTranslations]);
                    }
                    if (sProxyUserId) {
                        aParams.push(['proxyUserId', sProxyUserId]);
                    }
                    if (sAjaxToken) {
                        aParams.push(['_s.crb', sAjaxToken]);
                    }
                    var aExtraParams = [];
                    if (!sLanguage && oSettings.languageKey) {
                        aExtraParams.push(['languageKey', oSettings.languageKey]);
                    }
                    // WEF-2502 Change to allow LMS to pass "languageKey" instead of a "language" setting
                    // This allows LMS to customize the session storage key with the language of their choice
                    // but does not impact the header or the BizX setting for language, in the rare case that
                    // LMS and BizX have different Language settings.
                    // Also - if both language and languageKey are missing (e.g. LMS has not patched any changes yet)
                    // We cannot stop using the session storage, which would cause a huge spike in ODATA calls in LMS
                    // In short, we prefer having the user defect with a work around, rather than risk increasing
                    // the number of requests to the header for every LMS page load.
                    var aStorageParams = aParams;
                    if (aExtraParams.length > 0) {
                        aStorageParams = aStorageParams.concat(aExtraParams);
                    }
                    var sStorageKey;
                    sStorageKey = 'PageMetaData_' + aStorageParams.map(function(aParam) {
                        return aParam.map(function(val) {
                            return (val+"").replace(/[\$\_\.]/g, '');
                        }).join("-");
                    }).join("_");
                    var oStorage = sStorageKey && sAjaxToken && !oSettings.disableStorage && $.sap.storage('session', '_BizX_');
                    var oPageMetaData = oStorage && oStorage.get(sStorageKey);
                    if (oPageMetaData) {
                        res(oPageMetaData);
                    } else {
                        DeferredUtil.invokeODataService({
                            baseUrl: '/odata/v2/restricted/_PageMetaData_/',
                            serviceName: 'getPageMetaData',
                            urlParams: aParams.reduce(function(oMap, aParam) {
                                oMap[aParam[0]] = aParam[1];
                                return oMap;
                            }, {})
                        }).then(function(oData) {
                            oPageMetaData = DeferredUtil.normalizeODataResponse(oData, 'PageMetaData');
                            oStorage && oStorage.put(sStorageKey, oPageMetaData);
                            res(oPageMetaData);
                        }, function(sErr, jqXHR) {
                            jQuery.sap.log.error($.sap.getObject('responseJSON.error.message.value', 4, jqXHR) || sErr);
                            rej('serverError');
                        });
                    }
                });
            });
        },

        fetchPageNavigations: function(oSettings) {
            return new Promise(function(res, rej) {
                sap.ui.require([
                    'sap/sf/surj/shell/util/DeferredUtil',
                    'jquery.sap.storage'
                ], function(DeferredUtil) {
                    var sModuleId = oSettings.moduleId;
                    var sPageId = oSettings.pageId;
                    var sLanguageKey = oSettings.language || oSettings.languageKey;
                    var sUserId = oSettings.userId;
                    var sAjaxToken = window.ajaxSecKey;
                    // WEF-2502 To utilize session storage, the language must be specified, in case the language has changed since the last visit.
                    var sStorageKey = 'PageNavigations_' + sPageId + '_' + sLanguageKey + '_' + sUserId + '_' + sAjaxToken;
                    var oStorage = sAjaxToken && !oSettings.disableStorage && $.sap.storage('session', '_BizX_');
                    var oPageNavigations = oStorage && oStorage.get(sStorageKey);
                    if (oPageNavigations) {
                        res(oPageNavigations);
                    } else {
                        DeferredUtil.invokeODataService({
                            baseUrl: '/odata/v2/restricted/_PageMetaData_/',
                            serviceName: 'getPageNavigations',
                            urlParams: {
                                'moduleId' : sModuleId,
                                'pageId' : sPageId
                            }
                        }).then(function(oData) {
                            oPageNavigations = DeferredUtil.normalizeODataResponse(oData, 'PageNavigations');
                            oStorage && oStorage.put(sStorageKey, oPageNavigations);
                            res(oPageNavigations);
                        }, function(sErr, jqXHR) {
                            $.sap.log.error($.sap.getObject('responseJSON.error.message.value', 4, jqXHR) || sErr);
                            rej('Error to fetch Navigatoins');
                        });
                    }

                });
            });
        },

        /**
         * Initialize the page prior to creating the BizX shell/header, this involves initialzing the
         * page header model, setting theme roots, and initialing the successfactors global theme.
         * Use getPageMetaData to obtain the pageMetaData object to pass to this.
         *
         * @param {Object} oPageMetaData
         * @return {Promise}
         */
        initPageHeader: function(oPageMetaData) {
            return Promise.all([
                Util.initPageHeaderModel(oPageMetaData),
                Util.initThemeRoots(oPageMetaData),
                Util.initGlobalTheme(oPageMetaData)
            ]);
        },

        // -----------------------------------------------------------------------
        // START: Code copied from locale-bootstrap.js
        // -----------------------------------------------------------------------

        /**
         * Get the language of a given locale, take care of any special mappings.
         * @inner
         * @param {String} sLocale
         * @return {Boolean}
         */
        _getLanguage: function(sLocale) {
            if (sLocale) {
                return /([^-_]*)(?:[-_].*|)/.exec(sLocale)[1];
            }
            return '';
        },

        /**
         * Check if all provided languages are the same language.
         * @inner
         * @param {...} Variable array of locales
         * @return {Boolean} If all the locales provided use the same language
         */
        _isSameLanguage: function() {
            var sLang;
            for (var i=0; i<arguments.length; i++) {
                var sLangCheck = Util._getLanguage(arguments[i]);
                if (i==0) {
                    sLang = sLangCheck;
                } else if (sLang != sLangCheck) {
                    return false;
                }
            }
            return true;
        },

        /**
         * Check if a language is supported by ui5.
         * @param {String} sLanguage The language to check
         * @return {Boolean} If the language or any derivative language is supported by ui5.
         */
        _isLanguageUI5Supported: function(sLanguage) {
            var aLanguages = sap.ui.getCore().getConfiguration().getLanguagesDeliveredWithCore();
            if (!aLanguages || aLanguages.length == 0) {
                return false;
            }

            var bSupported = false;
            var aParts = sLanguage.split(/[\-_]/);
            while (aParts.length > 0) {
                if (aLanguages.indexOf(aParts.join('_')) >= 0) {
                    bSupported = true;
                    break;
                }
                aParts.pop();
            }

            return bSupported;
        },

        /**
         * Rewrite a URL so that the Locale will be one that we want.
         *
         * 1) The requested locale might be "en" but we might really want to use "en_DEBUG_APOS" for a /messagebundle url
         * 2) The requested locale might be "en_US" but we might really want to us "en" for a core UI5 module which doesn't support en_US
         *
         * @param {String} sUrl
         * @return {String}
         */
        _rewriteBundleUrl: function(sUrl, oPageMetaData) {
            // Only re-write "/messagebundle" URLs
            if (/^(https?:\/\/[^\/]*|\/\/[^\/]*|)\/messagebundle\//.test(sUrl)) {
                if (!Util.isRunningBaseDomain()) {
                    var result = /\/(vmod_[^\/]*)\//.exec(sUrl);
                    if (result) {
                        var localOrigin = Util.getLocationOrigin();
                        localOrigin = localOrigin.replace(/[^A-Z0-9]+/ig, "");
                        sUrl = sUrl.replace(result[1], result[1] + "-" + localOrigin);
                    }
                }
                var aParts = /(.*\/[^_]*)(_[^\/]*|)(\.\w+)$/.exec(sUrl);
                if (aParts) {
                    var sSuffix = aParts[3];
                    if (sSuffix == ".properties") {
                        var sLocale = aParts[2];
                        if (sLocale) {
                            sLocale = sLocale.substring(1);
                        }

                        var sPreferredLocale = oPageMetaData && oPageMetaData.userInfo && oPageMetaData.userInfo.normalizedLocale;
                        if (sPreferredLocale) {
                            sPreferredLocale = sPreferredLocale.replace(/-/g, '_');

                            // If the locales are different, check if the requested locale should be overridden by the preferred one
                            if (sLocale != sPreferredLocale) {
                                // If the preferred locale is the same language as the requested one then always override
                                var bOverride = Util._isSameLanguage(sLocale, sPreferredLocale);

                                // UI-21017
                                //
                                // There is a special case when the the preferred locale is not supported by UI5.
                                // UI5 will always request english for this case as a fallback. Here we will check if that
                                // is the case and override anyway.
                                //
                                // This happens for the following locales in b1908:
                                //
                                // -------------------------------------------------------------------------
                                // | Normalized Locale | SF Locale ID | Name                               |
                                // ------------------------------------------------------------------------|
                                // | ms                | bs_BS        | Bahasa Melayu ‎(Malay)‎ -- SF Bahasa |
                                // | id                | bs_ID        | Bahasa Indonesia ‎(Indonesian)‎      |
                                // -------------------------------------------------------------------------
                                if (!bOverride && sLocale == 'en') {
                                    // Cache the value of bSupported so we don't need to recalculate it
                                    var bSupported = Util._bPreferredLocaleSupported;
                                    if (bSupported == null) {
                                        bSupported = Util._isLanguageUI5Supported(sPreferredLocale);
                                        Util._bPreferredLocaleSupported = bSupported;
                                    }
                                    bOverride = !bSupported;
                                }

                                // When bOverride is false here, it means someone is requesting a messagebundle bundle
                                // that is not the user's locale. For example requesting French, but the user's locale is English.
                                // We do not want to rewrite the URL in that case.
                                if (bOverride) {
                                    sUrl = aParts[1] + (sPreferredLocale ? '_' : '') + sPreferredLocale + sSuffix;
                                }
                            }
                        }
                    }
                }
            }
            return sUrl;
        },

        /**
         * Add locale mapping by overriding the LoaderExtensions.
         * This should only be called for SharedHeader at the beginning of the page startup
         * but I cannot use locale-bootstrap which is a standalone script before UI5 load
         * This needs to be part of the library itself and might need its own changes to adapt
         * to this environment.
         *
         * @param {Object} oPageMetaData
         */
        initLocaleMapping: function(oPageMetaData) {
            return new Promise(function(res, rej) {
                /**
                 * A replacement function that is used internally by _upgrade.
                 *
                 * @param {String} sResourceName
                 * @param {Object} mOptions
                 */
                var _loadResource = function(sResourceName, mOptions) {
                    if (typeof sResourceName === "string") {
                        mOptions = mOptions || {};
                    } else {
                        mOptions = sResourceName || {};
                        sResourceName = mOptions.name;
                    }
                    mOptions.url = Util._rewriteBundleUrl(mOptions.url, oPageMetaData);
                    // Cannot call 2 argument version if sResourceName is undefined
                    var aArgs = [mOptions];
                    if (typeof sResourceName == 'string') {
                        aArgs.splice(0, 0, sResourceName);
                    }
                    return _loadResourceOriginal.apply(this, aArgs);
                };

                // This code is slightly changed since we only need localeMapping
                // resourceMapping is not supported for shared header
                var _loadResourceOriginal;
                var oConfig = sap.ui.getCore().getConfiguration();
                if (oConfig.getVersion().compareTo('1.58') >= 0) {
                    sap.ui.require(["sap/base/util/LoaderExtensions"], function(LoaderExtensions) {
                        _loadResourceOriginal = LoaderExtensions.loadResource;
                        LoaderExtensions.loadResource = _loadResource;
                        res();
                    }, rej);
                } else {
                    _loadResourceOriginal = jQuery.sap.loadResource;
                    jQuery.sap.loadResource = _loadResource;
                    res();
                }
            });
        },

        // -----------------------------------------------------------------------
        // END: Code copied from locale-bootstrap.js
        // -----------------------------------------------------------------------


        /**
         * Initialize the "pageHeader" model with the PageMetaData object.
         * Called by initPageHeader, use that instead to get all initialization in parallel.
         *
         * @param {Object} oPageMetaData
         * @return {Promise}
         */
        initPageHeaderModel: function(oPageMetaData) {
            window.pageHeaderJsonData = oPageMetaData = $.extend(window.pageHeaderJsonData || {}, oPageMetaData);
            return Promise.all([
                Util.initLocaleMapping(oPageMetaData),
                new Promise(function(res, rej) {
                    sap.ui.require(['sap/ui/model/json/JSONModel'], function(JSONModel) {
                        sap.ui.getCore().setModel(new JSONModel(window.pageHeaderJsonData), 'pageHeader');
                        res();
                    });
                })
            ]);
        },

        /**
         * Determine if UI5 should be themed from SuccessFactors or not.
         * If the basepath of UI5 is coming from SuccessFactors, this will always be true.
         * Otherwise, read the pageHeaderJsonData to determine if the current UI5 version is outside
         * of the min/max versions in the settings.
         * 
         * @returns {Boolean}
         */
        isUI5Themable: function() {
            var basePath = sap.ui.resource("", "");
            if (!Util.isBizXDomain(basePath)) { // Ignore BizXDomain UI5, assume that is always themable
                var oPageMeta = window.pageHeaderJsonData;
                var oSettings = oPageMeta && oPageMeta.settings;
                if (oSettings) {
                    var minVersion = oSettings.minThemableUI5Version;
                    var maxVersion = oSettings.maxThemableUI5Version;
                    // Pull the current version and compare that against the min/max version
                    var oVersion = sap.ui.getCore().getConfiguration().getVersion();
                    if ((minVersion && oVersion.compareTo(minVersion) < 0) ||
                        (maxVersion && oVersion.compareTo(maxVersion) >= 0)) {
                        return false;
                    }
                }
            }
            return true;
        },

        /**
         * Initialize the themeRoots from the pageMetaData.
         * Called by initPageHeader, use that instead to get all initialization in parallel.
         *
         * @param {Object} oPageMetaData The page meta data
         */
        initThemeRoots: function(oPageMetaData) {
            var oResourceRoots = oPageMetaData.resourceRoots;
            if (oResourceRoots && oResourceRoots.results) {
                oResourceRoots.results.forEach(function(oEntry) {
                    $.sap.registerResourcePath(oEntry.key, oEntry.value);
                });
            } else if (oResourceRoots) {
                for (var sPath in oResourceRoots) {
                    $.sap.registerResourcePath(sPath, oResourceRoots[sPath]);
                }
            }
            var sThemeRoot = oPageMetaData.themeRoot;
            if (sThemeRoot && Util.isUI5Themable()) {
                return new Promise(function(res, rej) {
                    var sCurrentTheme = sap.ui.getCore().getConfiguration().getTheme();
                    var aThemedLibs = oPageMetaData.themedLibraries;
                    if (typeof aThemedLibs == 'string') aThemedLibs = aThemedLibs.split(",");
                    var aSupportedThemes = oPageMetaData.supportedThemes;
                    if (typeof aSupportedThemes == 'string') aSupportedThemes = aSupportedThemes.split(',');
                    if (aSupportedThemes && aSupportedThemes.length > 0 && aThemedLibs && aThemedLibs.length > 0) {
                        var oCore = sap.ui.getCore();
                        var bWait = false;
                        aSupportedThemes.forEach(function(sTheme) {
                            var bIsCurrentTheme = (sTheme == sCurrentTheme);
                            // FIXME: bIsCurrentTheme should be passed as 4th param, and registerPlugin should be removed
                            // TODO: Find which versions of UI5 support this new way
                            oCore.setThemeRoot(sTheme, aThemedLibs, sThemeRoot/*, bIsCurrentTheme*/);
                            if (bIsCurrentTheme) {
                                bWait = true;
                                oCore.registerPlugin({
                                    startPlugin: function(privateCore) {
                                        privateCore._updateThemeUrls(sTheme, true);
                                        res();
                                    }
                                });
                            }
                        });
                        if (!bWait) {
                            res();
                        }
                    }
                });
            }
            return Promise.resolve();
        },

        /**
         * Init the SuccessFactors global theme.
         * Called by initPageHeader, use that instead to get all initialization in parallel.
         *
         * @param {Object} oPageMetaData The page meta data
         */
        initGlobalTheme: function(oPageMetaData) {
            if ($('#globalCss').length == 0) { // if the globalCss is not already available
                $('body').addClass('globalBackground');
                var sThemeCSS = oPageMetaData.themeCSS;
                if (sThemeCSS) {
                    $('<link />').attr({
                        href: sThemeCSS,
                        type: 'text/css',
                        rel: 'stylesheet',
                        id: 'globalCss'
                    }).appendTo('head');
                }
            }
            return Util.waitForGlobalTheme();
        },

        /**
         * Wait for the global theme to be applied, it will poll for the theme to be applied and resolve a promise.
         * 
         * @return {Promise}
         */
        waitForGlobalTheme : function() {
            var iMaxAttempts = 100,
                iAttempts = 0,
                oRevealer = null;
            return new Promise(function(res, rej) {
                /** @inner */
                function poll() {
                    iAttempts++;
                    oRevealer = oRevealer || $('<div id="globalLogoPositionRevealer" style="display:none"></div>').appendTo(sap.ui.getCore().getStaticAreaRef());
                    if (oRevealer.css('left') == 'auto' && iAttempts < iMaxAttempts) {
                        setTimeout(poll, 10);
                    } else {
                        res();
                    }
                }
                // We must wait for the CSS to be applied before continue
                poll();
            });
        },

        /**
         * Check if this page is the message service.
         * @inner
         * @return {Boolean}
         */
        isMessageServicePage: function() {
            return window.location.href.indexOf(SF_PROTECTED_POSTMESSAGE_URL) >= 0;
        },

        /**
         * @param {String} sDeepLinkBackup
         */
        getMessageService: function(sDeepLinkBackup, timeoutTime) {
            if (timeoutTime) { // Allow a caller to specify a smaller timeout
                return new Promise(function(res, rej) {
                    var oMsgPromise = Util.getMessageService(sDeepLinkBackup);
                    if (typeof timeoutTime != 'number') {
                        timeoutTime = 5000;
                    }
                    var iTimeoutID = setTimeout(function() {
                        iTimeoutID = null;
                        rej('timeout');
                    }, timeoutTime);
                    /** @inner */
                    function wrap(callback) {
                        return function(o) {
                            if (iTimeoutID != null) {
                                clearTimeout(iTimeoutID);
                                callback(o);
                            }
                        };
                    }
                    oMsgPromise.then(wrap(res), wrap(rej));
                });
            }

            var oSettings = window.pageHeaderJsonData || {};
            var sBaseUrl = oSettings.baseUrl,
                iTimeout = 60000, // Give 1 minute for the MessageService IFRAME
                sDeepLink = oSettings.messageServiceUrl || SF_PROTECTED_POSTMESSAGE_URL;

            if (!sBaseUrl) {
                throw new Error("oSettings.baseUrl is required");
            }

            // Other threads wanting message service to the same baseurl will share the same promise
            var oPromise = MESSAGE_SERVICES[sBaseUrl];
            if (oPromise) {
                return oPromise;
            }

            var oParams = {
                parentFrameOrigin: Util.getLocationOrigin()
            };

            if (sDeepLinkBackup && typeof sDeepLinkBackup == 'string') {
                oParams.deepLink = sDeepLinkBackup;
            }
            var pageInfo = oSettings.pageInfo;
            if (sDeepLink == SF_PROTECTED_POSTMESSAGE_URL && pageInfo) {
                oParams.pageId = pageInfo.pageId;
                oParams.moduleId = pageInfo.moduleId;
            }
            sDeepLink += "?" + $.param(oParams);

            oPromise = MESSAGE_SERVICES[sBaseUrl] = new Promise(function(res, rej) {
                function handleMessage(oEvent) {
                    var oOriginalEvent = oEvent.originalEvent;
                    if (oOriginalEvent.origin == sBaseUrl) {
                        var data = oOriginalEvent.data;
                        var sMessage = data;
                        if (Array.isArray(sMessage) && sMessage.length > 0) {
                            sMessage = sMessage[0];
                        }
                        if (typeof sMessage == 'string' && sMessage.indexOf(PREFIX) == 0) {
                            sMessage = sMessage.substring(PREFIX.length);
                            oMessageService.fireEvent(sMessage, {
                                data: data
                            });
                        }
                    }
                }

                function disconnect() {
                    oWin.unbind('message', handleMessage);
                    oFrame.remove();
                    oFrame = oWin = MESSAGE_SERVICES[sBaseUrl] = null;
                    oMessageService.fireEvent('disconnected');
                }
                
                var PREFIX = 'PostMessageAPI_';
                var oWin = jQuery(window);
                var oFrame = jQuery('<iframe class="messageServiceIframe"></iframe>').css({
                    position: 'absolute',
                    visibility: 'hidden',
                    left: 0, top: 0, width: 0, height: 0
                });
                var oMessageService = new EventProvider();

                iTimeoutID = setTimeout(function() {
                    iTimeoutID = null;
                    rej('timeout');
                }, iTimeout);

                oFrame.appendTo(sap.ui.getCore().getStaticAreaRef());
                oWin.bind('message', handleMessage);

                oMessageService.attachEventOnce('ready', function() {
                    if (iTimeoutID != null) { // null means already timed out
                        clearTimeout(iTimeoutID);
                        res(oMessageService);
                    }
                });

                oMessageService.attachEventOnce('logoutComplete', function() {
                    disconnect();
                });

                /**
                 * Send a message through the message service.
                 *
                 * @param {String} sMessage
                 *    The name of the message
                 * @param {any} oParameter
                 *    An optional parameter to send
                 */
                oMessageService.sendMessage = function(sMessage, oParameter) {
                    sMessage = PREFIX + sMessage;
                    oFrame[0].contentWindow.postMessage(oParameter ? [sMessage, oParameter] : sMessage, sBaseUrl);
                };

                /**
                 * Send a message that has a one time reply.
                 *
                 * @param {String} oSettings.request
                 *    The name of the message that initiates the transaction
                 * @param {*} oSettings.parameter
                 *    An optional parameter object to pass along
                 * @param {String=} oSettings.response
                 *    The name of the message that is expected to reply back
                 * @param {Integer=} oSettings.timeout
                 *    Optional timeout value in milliseconds
                 * @param {Function=} oSettings.validator
                 *    Optional validator in case the same transaction could be used in other threads.
                 * @return {Promise}
                 *    A promise for the reply data for the next responseMessage
                 */
                oMessageService.sendTransaction = function(oSettings) {
                    oSettings = oSettings || {}
                    var sRequest = oSettings.request,
                        oParameter = oSettings.parameter,
                        sResponse = oSettings.response || oSettings.request,
                        iTimeout = oSettings.timeout || 5000,
                        fValidator = oSettings.validator;
                    if (!sRequest) {
                        throw new Error('oSettings.request is required');
                    }
                    return new Promise(function(res, rej) {
                        function handler(oEvent) {
                            if (iTimeoutID != null) { // null means the message service timed out already
                                var bValid = true;
                                if (fValidator) {
                                    if (bValid = fValidator(oEvent)) {
                                        oMessageService.detachEvent(sResponse, handler);
                                    }
                                }
                                if (bValid) {
                                    clearTimeout(iTimeoutID);
                                    iTimeoutID = false;
                                    var oData = oEvent.getParameter('data');
                                    res(oData && oData[1]);
                                }
                            }
                        }
                        if (typeof fValidator == 'function') {
                            oMessageService.attachEvent(sResponse, handler);
                        } else {
                            oMessageService.attachEventOnce(sResponse, handler);
                        }
                        var iTimeoutID = setTimeout(function() {
                            if (iTimeoutID !== false) { // false means the message service was already created
                                iTimeoutID = null;
                                rej('timeout');
                            }
                        }, iTimeout);
                        oMessageService.sendMessage(sRequest, oParameter);
                    });
                };

                oMessageService.disconnect = disconnect;

                setTimeout(function() {
                    // Once the src is updated, the request is made and the message service is "live"
                    oFrame.attr('src', sBaseUrl + sDeepLink);
                }, 0);
            });

            return oPromise;
        },

        /**
         * Get the current window's location origin.
         *
         * @param {Object=} loc
         * @return {String}
         */
        getLocationOrigin: function(loc) {
            if (!loc) {
                loc = window.location;
            }
            var origin = loc.origin;
            if (!origin) {
                origin = loc.protocol + '//' + loc.hostname;
                var port = loc.port;
                if (port) {
                    origin += (':' + port);
                }
            }
            return origin;
        },

        /**
         * Is the Base Domain CORS Enabled.
         *
         * @return {Boolean}
         */
        isBaseDomainCORSEnabled: function() {
            var oPageMetaData = window.pageHeaderJsonData;
            return oPageMetaData && oPageMetaData.enableCORS;
        },

        /**
         * Check if the current page is running in the SF base domain.
         * @return {Boolean}
         */
        isRunningBaseDomain : function() {
            // UI-18114 If the ajaxSecKey is missing, AJAX/DWR calls on the BaseDomain will not work
            // so we should treat this page as if it were not running on the BaseDomain
            if (!window.ajaxSecKey) {
                return false;
            }

            // UI-18065 By default we assume the page is always running in base domain
            // But the page can opt-in to enable a baseDomain check, so that if the page is using a URL
            // that does not match the base domain, then certain functionalities in the header will be disabled
            // Such as Proxy Now, Show Me, Global Notifications, To Dos, and any DWR calls 
            var oPageMetaData = window.pageHeaderJsonData || {};
            if (oPageMetaData.enableBaseDomainCheck && (oPageMetaData.baseUrl || oPageMetaData.defaultBaseUrl)) {
                return Util.isBizXDomain(Util.getLocationOrigin());
            }

            return true;
        },

        /**
         * Determine if the given url is pointing to the BizX domain.
         * @param {String} sUrl
         * @return {Boolean}
         */
        isBizXDomain : function(sUrl) {
            // Relative path should check the "current" page
            var sFirstChar;
            if (!sUrl || ((sFirstChar = sUrl.charAt(0)) == '.') || (sFirstChar == '/' && sUrl.indexOf('//') != 0)) {
                return Util.isRunningBaseDomain();
            }
            var oPageMetaData = window.pageHeaderJsonData || {};
            var sfBaseUrl = oPageMetaData.baseUrl;
            var sfDefaultBaseUrl = oPageMetaData.defaultBaseUrl;
            return (!!sfBaseUrl && sUrl.indexOf(sfBaseUrl) == 0) || (!!sfDefaultBaseUrl && sUrl.indexOf(sfDefaultBaseUrl) == 0);
        },

        /**
         * Re-write the given URL, if it is relative, to have the base domain - but only if the current page is not base domain.
         * @param {String|Object} sUrl
         *    A string or object containing URL values
         * @param {Boolean=} bUseAbs
         *    Optionally force relative/static paths to absolute ones, default false
         * @return {String|Object} A modified URL or Object that will be absolute to base domain, if needed.
         */
        ensureBaseDomain : function(sPath, bUseAbs) {
            if (!Util.isRunningBaseDomain() || bUseAbs) {
                if (Array.isArray(sPath)) {
                    sPath.forEach(function(sElem, i) {
                        sPath[i] = Util.ensureBaseDomain(sElem, bUseAbs)
                    });
                } else if (typeof sPath == 'string') {
                    if (sPath && sPath.indexOf('/') == 0 && sPath.indexOf('//' != 0)) {
                        var oPageMetaData = window.pageHeaderJsonData || {};
                        var sfBaseUrl = oPageMetaData.baseUrl;
                        if (sfBaseUrl) {
                            sPath = sfBaseUrl + sPath;
                        }
                    }
                } else if (sPath && typeof sPath == 'object') {
                    var oResult = {};
                    for (var sAttr in sPath) {
                        oResult[sAttr] = Util.ensureBaseDomain(sPath[sAttr], bUseAbs);
                    }
                    return oResult;
                }
            }
            return sPath;
        },


        /**
         * Decode params on a url to a friendly JSON.
         * Use jQuery.param to encode params.
         *
         * The following should evaluate to true when X is a simple JSON object:
         *
         * jQuery.param(X) == jQuery.param(Util.decodeParam(jQuery.param(X)))
         *
         * @param {String} url
         * @return {Object} A json object
         */
        decodeParam: function(url) {
            // Strip the hash
            var aParts = /^(.*)\#.*$/.exec(url);
            if (aParts) {
                url = aParts[0];
            }
            aParts = /\?(.*)$/.exec(url);
            return aParts && aParts[1].split('&').reduce(function(m, p) {
                var sKey = p, aParts = p.split('='), sValue;
                if (aParts) {
                    sKey = aParts[0];
                    sValue = aParts[1] && decodeURIComponent(aParts[1]);
                }
                sKey = decodeURIComponent(sKey);
                if (/\[\]$/.test(sKey)) {
                    sKey = sKey.substring(0, sKey.length-2);
                    var to = m[sKey];
                    to = to || [];
                    to.push(sValue);
                } else {
                    var to = m[sKey];
                    if (Array.isArray(to)) {
                        to = to.concat([sValue]);
                    } else {
                        to = to != null ? [to, sValue] : sValue;
                    }
                }
                m[sKey] = to;
                return m;
            }, {});
        },

        /**
         * Convenience function for loading some files with SMRF.load, but initializing SMRF Variables using shell.library.smrf.js
         * prior to using SMRF.load to improve performance.
         *
         * @return {Promise} A promise to load these files
         */
        includeScripts: function(aFiles) {
            return new Promise(function(res, rej) {
                sap.ui.require([
                    'sap/sf/surj/shell/util/SMRF'
                ], function(SMRF) {
                    SMRF.updateSMRFVariables(['/ui/uicore/js/shell/shell.library.smrf.js']).then(function() {
                        return SMRF.loadPromise(aFiles);
                    }).then(res, rej);
                }, rej.bind(null, 'Could not include SMRF'));
            });
        },

        /**
         * Convenience function for loading some files using sync load
         *
         * @return {Promise} A promise to load these files
         */
        includeScriptsSync: function(aFiles) {
            var SMRF = sap.ui.requireSync('sap/sf/surj/shell/util/SMRF');
            SMRF.updateSMRFVariables(['/ui/uicore/js/shell/shell.library.smrf.js'], false);
            SMRF.loadSync(aFiles);
        },

        /**
         * Load a Javascript file after its required AjaxService proxy is loaded.
         *
         * @param {String} sFile The filename to load
         * @param {String} sModule The module for the ajax service, ex: "v4"
         * @param {String} sAjaxService The name of the AjaxService
         */
        loadWithAjaxService: function(sFile, sModule, sAjaxService) {
            return new Promise(function(res, rej) {
                sap.ui.require([
                    'sap/sf/surj/shell/util/DeferredUtil'
                ], function(DeferredUtil) {
                    DeferredUtil.loadAjaxService({
                        module: sModule,
                        serviceName: sAjaxService
                    }).then(function() {
                        Util.includeScripts(sFile).then(res, rej);
                    }, rej);
                }, rej.bind(null, 'Could not load dependencies'));
            });
        },

        /**
         * CSP stands for Content Security Policy.
         * Handles any events that occure before bizXHeader.controller initializes
         */
        initCSP: function() {
            if (window._initCSPViolations != null) {
                var violationBeforeInit = window._initCSPViolations.errors.length > 0;
                if (violationBeforeInit) {
                    this.openCSPviolationPopup(window._initCSPViolations.errors[0]); // We are only concerned about the very first event
                    window._initCSPViolations.cleanup();
                } else {
                    window._initCSPViolations.cleanup();
                    this.handleCSPviolation();
                }
            }
        },

        /**
         * UI-22276 - Catch URL's that we declare are safe, but may still throw a CSP violation because of browser related issues
         */
        isCSPWhiteListedURL: function(sourceFile) {
            var isWhiteListed;
            if (sourceFile) {
                var re = new RegExp('[^/]+(?=/$|$)');
                var fileToCheck = sourceFile.match(re);
                for (var i = 0; i < CSP_WHITELISTED_URLS.length; i++) {
                    if (fileToCheck == CSP_WHITELISTED_URLS[i]) {
                        isWhiteListed = true;
                        break;
                    }
                }
            }
            return isWhiteListed;
        },

        /*
         * Open csp popup when the event 'securitypolicyviolation' is triggered.
         */
        openCSPviolationPopup: function(e) {
            if (this.isCSPWhiteListedURL(e.sourceFile)) {
                return null;
            }
            return sap.ui.require(['sap/sf/surj/shell/util/AjaxServiceError'], function(AjaxServiceError) {
                var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
                var oContent = new HTML();
                oContent.setContent(rb.getText('COMMON_CSP_ERROR', [e.blockedURI, e.violatedDirective]));
                var title = rb.getText('COMMON_Err');
                AjaxServiceError.useUI5Dialog(oContent, title);
            });
        },

        /*
         * Handles Content Security Violations once bizXHeader.controller is initialized
         */
        handleCSPviolation: function() {
            var that = this;
            var multipleErrors = false;
            document.addEventListener("securitypolicyviolation", function _cspEventHandler(e) {
                if (!multipleErrors) {
                    that.openCSPviolationPopup(e);
                }
                document.removeEventListener("securitypolicyviolation", _cspEventHandler);
                multipleErrors = true;
            });
        },

        /**
         * IPS stands for In Product Support.
         */
        initIPS: function() {
            return new Promise(function(res, rej) {
                // IPS doesn't work on phone screen.
                if (!Device.system.phone) {
                    return sap.ui.require(['sap/sf/ips/Container'], function() {
                        var rb = sap.ui.getCore().getLibraryResourceBundle('sap.sf.surj.shell.i18n');
                        window.SFIpsFrame.init(rb.getText('COMMON_IN_PRODUCT_SUPPORT'));
                        res();
                    }, rej);
                } else {
                    res();
                }
            });
        },

        /**
         * KBA stands for Knowledge Based Answers.
         */
        initKBA: function() {
            // TODO: KBA should be migrated to a Pure UI5 module, currently it relies on JUIC and SMRF.load
            // If we want to support this on 3rd party domains we need to remove JUIC & SMRF.load dependency
            // ALSO: The KBA dialog (and any other JUIC-based dialog) has an undocumented dependency on "/ui/topnav/css/SFRevolutionTopNav.css
            return Util.loadWithAjaxService('/ui/kba/js/kbaQuestionAnswerController.js', 'passwordmanagement', 'kbaAnswerCollectionController').then(function() {
                new KBAQuestionAnswerDlgController();
            }).catch(function(reason) {
                jQuery.sap.log.error('KBAQuestionAnswerDlgController failure: ' + reason);
            });
        },

        /**
         * Init the password change dialog if that is necessary to do.
         */
        initPwdChange: function() {
            // TODO: Password Change should migrate to pure UI5 module, it is already UI5 though
            // If we want to support this on 3rd party domains we need to remove SMRF.load dependency
            return Util.loadWithAjaxService('/ui/uicore/js/changepasswordpopup/changePasswordPopup.js', 'v4', 'passwordChangeController').catch(function(reason) {
                jQuery.sap.log.error('changePasswordPopup failure: ' + reason);
            });
        },

        initFeedback: function() {
            return Util.includeScripts('/ui/userfeedback/js/feedback/feedBack.js');
        },

        /**
         * Do not call this, should only be called by BizXHeader.controller.js
         *
         * @param {Object} oControllerInstance
         */
        setHeaderController: function(oControllerInstance) {
            Util._initHeaderPromise();
            Util._headerCallback(oControllerInstance);
        },

        /**
         * Get the header controller, but as a promise so that you can wait for the instance to be created.
         * This is better than relying on a global variable like window.pageHeaderJsonData or window.BizXHeaderController.
         *
         * @return {Promise.<Object>} A Promise for the header controller instance.
         */
        getHeaderController: function() {
            return Util._initHeaderPromise();
        },

        /**
         * Get the page meta data (aka pageHeaderJsonData), but do so in a more reliable way that does not rely on
         * a global variable that might not exist.
         *
         * @return {Promise.<Object>} A promise for the page meta data object.
         */
        getPageMetaData: function() {
            return Util.getHeaderController().then(function(oControllerInstance) {
                return oControllerInstance.getModel().getData();
            });
        },

        /**
         * Used for any Nav Item with "isNewWindow" is true. Module picker items/subtabs etc.
         *
         * @param {String} helpURL
         */
        openUrl: function(helpURL) {
           window.open(helpURL,'sfhelp','scrollbars,resizable,height=480,width=730');
        },

        /**
         * Exposed for unit test purpose.
         */
        _initHeaderPromise: function() {
            if (!Util._headerPromise) {
                Util._headerPromise = new Promise(function(res) {
                    Util._headerCallback = res;
                });
            }
            return Util._headerPromise;
        },

        /**
         * Copied from /ui/surj/js/Util.js
         * @return {String} The current user's role.
         */
        getRole : function() {
            var role = 'user';
            var pageHeaderJsonData =  window.pageHeaderJsonData;
            if (pageHeaderJsonData) {
                var modules = pageHeaderJsonData.modules;
                if (modules) {
                    for (var i = 0; i < modules.length; i++) {
                        var item = modules[i];
                        if (item.id == 'ADMIN') {
                            role = 'admin';
                            break;
                        }
                    }
                }
            }
            return role;
        },

        /**
         * Add global varibles and scripts to DOM
         */
        addPageInitScripts: function() {
            return Util.getPageMetaData().then(function(metaData) {

                var pageInit = metaData.pageInit;
                if (!pageInit) {
                    return;
                }
                var globals = pageInit.globals;
                if (globals && Util.isRunningBaseDomain()) {
                    for (var i = 0; i < globals.length; i++) {
                        var obj = globals[i];
                        var name = obj.name;
                        var jsonStr = obj.value;

                        if (name && jsonStr) {
                            var json = JSON.parse(jsonStr);
                            //Re structure to add getMemory() method for webchat
                            if (name == "webchatMethods" && json) {
                                window[name] = {
                                    getMemory: function(conversationId) {
                                        var memory = {
                                            userId: json.userId,
                                            accessToken: 'Bearer ' + json.accessToken,
                                            lmsApiServerUrl:  json.lmsApiServerUrl,
                                            bizxApiServerUrl: json.bizxApiServerUrl,
                                            timeZone: new Date().getTimezoneOffset()/60
                                        }
                                        return {
                                            memory: memory,
                                            merge: true
                                        }
                                    }
                                };
                            } else {
                                window[name] = json;
                            }
                        }
                    }
                }

                var scripts = pageInit.scripts;
                if (scripts) {
                    for (var i = 0; i < scripts.length; i++) {
                        addScript(scripts[i]);
                    }
                }
                function addScript(script) {

                    // If information for script is not complete then leave
                    if (!script.url && !script.content) {
                        return;
                    }

                    // if no base domain with the flag of can being running to be false then leave
                    if (!script.canRunNoBaseDomain && !Util.isRunningBaseDomain()) {
                        return;
                    }

                    // If inline script, and there is no URL, then invoke it and return right away;
                    // otherwise, if both script and url, then load the URL first executing the inline script onload of the url
                    var scriptString = script.content;
                    if (!script.url) {
                        scriptString && Util.dangerouslyEvalScript(scriptString);
                        return;
                    }

                    // Build the external script tag
                    var snonce = Util.getCSPScriptNonce();
                    var node = document.createElement("script");
                    node.type = "text/javascript";
                    node.src = script.url;
                    var attrs = script.attribs;
                    if (snonce) {
                        attrs = attrs || {};
                        attrs.nonce = snonce;
                    }
                    if (attrs) {
                        for (var key in attrs) {
                            node.setAttribute(key, attrs[key]);
                        }
                    }
                    if (scriptString) {
                        node.onload = function () {
                            Util.dangerouslyEvalScript(scriptString);
                        }
                    }

                    // Append external script tag to body
                    document.body.appendChild(node);
                }
                Util._addScript = addScript; // for easy unit test purpose. Should not being called outside
            });
            
        },

        isSafari: function() {
            function BrowserInfo() {
                this.saf = false;

                var n = navigator;
                var nua = n.userAgent;
                this.saf = nua.indexOf( 'Safari' ) != -1 && nua.indexOf('Edge') == -1;
            }
            Util.browserInfo = new BrowserInfo();
            return Util.browserInfo.saf;
        },

        /**
         * Checking whether the current module in external domain has User Assistant Enabled.
         * @return {Boolean}
         */
        isUASupportedExternalModule: function() {
            var pageHeaderJsonData = window.pageHeaderJsonData;
            var pageInfo = pageHeaderJsonData && pageHeaderJsonData.pageInfo;
            if (pageInfo && pageInfo.moduleId) {
                return EXTERNAL_MODULES_WITH_USER_ASSISTANT_SUPPORT.indexOf(pageInfo.moduleId) >= 0;
            }
            return false 
        },

        /**
         * A simple hash algorith, a copy of Java's java.lang.String#hashCode()
         * NOTE: This is NOT a cryptographically secure hashing algorithm.
         * @param {String} input Any input string
         * @return {Number} A hash code of the input string.
         * @see @xweb/core-utils/src/util/hashCode.js
         */
        generateHashCode: function(input) {
            if (!input) return 0;
            var hash = 0;
            for (var i = 0; i < input.length; i++) {
                var chr = input.charCodeAt(i);
                hash = (hash << 5) - hash + chr; // eslint-disable-line no-magic-numbers
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        },

        /**
         * @see @xweb/core-utils/src/util/baseDomain#getSessionRef
         */
        getSessionRef: function() {
            var token = window.ajaxSecKey;
            var sessionRef = SESSION_REFS[token];
            if (!sessionRef && token) {
                sessionRef = SESSION_REFS[token] = token.substr(0, 4) + this.generateHashCode(token);
            }
            return sessionRef;
        },

        /**
         * Returns the specified URL as a finalized one, where a URL that is a
         * "uires" one would be converted to a site root-relative pathed one
         * (for use as a "http(s)" URL).
         *
         * WARNING!!!: If you make any changes to this function, then you must
         * make the changes in "theming/less/sfCustomCode.js.fmt"
         * in the classpath and "ui/theming/js/admin/lessaddon.js" in the webapp as well.
         *
         * ex:
         * Resource Reference could be 'uires:43?mod=848f1a34977d41f50f520144c02db60d&amp;name=bayer.png'
         * It will be transformed to '/public/ui-resource/CompanyID/43;mod=848f1a34977d41f50f520144c02db60d'
         */
        doURLFinalization: function (url, encodedCompanyID) {
            var UIRES_PROTOCOL = 'uires:',
                result,
                begIndex,
                endIndex;
            url += ''; // Ensures that URL is a JavaScript string in both client- and server-side JavaScript
            begIndex = url.indexOf(UIRES_PROTOCOL);
            if (begIndex == 0) {
                // E.g.: "uires:XXX?mod=YYY&name=ZZZ"
                begIndex += UIRES_PROTOCOL.length;
                endIndex = url.indexOf('?', begIndex);
                if (endIndex >= 0) {
                    result = url.substring(begIndex, endIndex);
                    begIndex = url.indexOf('mod=', endIndex);
                    if (begIndex >= 0) {
                        endIndex = url.indexOf('&', begIndex);
                        if (endIndex < 0) {
                            endIndex = url.length;
                        }
                        result += ';' + url.substring(begIndex, endIndex);
                    }
                } else {
                    result = url.substring(begIndex);
                }
                result = '/public/ui-resource/' + encodedCompanyID + '/' + result;
            } else {
                result = url;
            }
            return result;
        }
    };

    var SESSION_REFS = {};

    $.sap.setObject('sap.sf.surj.shell.util.Util', Util);
    return Util;
});
