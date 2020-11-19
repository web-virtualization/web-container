sap.ui.define('sap/sf/surj/shell/util/LinkUtil', [
    'jquery.sap.global', 
    'sap/sf/surj/shell/util/SMRF',
    'sap/sf/surj/shell/util/Util'
    ], function ($, SMRF, Util) {        
    "use strict";
    /**
     * Utilities for dealing with link objects.
     * 
     * @namespace
     * @name sap.sf.surj.util.LinkUtil
     */
    var LinkUtil = {
        /**
         * @param {String} sUrl
         * @param {Boolean=} dontCheckSecurityCrumb default false
         * @parma {Object=} windowOptions options for opening new window
         */
        gotoURL : function(url, dontCheckSecurityCrumb, windowOptions) {
            // There is a copy of this logic inside of /idl-surj-web/src/main/webapp/ui/surj/js/Util.js
            var hashIndex = url.indexOf('#');
            if (!dontCheckSecurityCrumb && hashIndex != 0) {
                var scrbParam = '_s.crb=';
                if (window.ajaxSecKey && url && (url.indexOf('javascript:') != 0) && (url.indexOf(scrbParam) < 0)) {
                    var queryIndex = url.indexOf('?');

                    // if there is a first # character
                    // and the first ? character is after the first # character
                    if (hashIndex >= 0 && queryIndex > hashIndex) {
                        // then there won't be a ? character considered
                        queryIndex = -1;
                    }

                    // get the hash if it exists
                    var hash = "";
                    if (hashIndex >= 0) {
                        hash = url.substring(hashIndex);
                        url = url.substring(0, hashIndex);
                    }

                    // add the ajax secrity key to the URL
                    url += ((queryIndex < 0) ? '?' : '&') + scrbParam + window.ajaxSecKey + hash;
                }
                gotoLocation(url);
            } else {
                LinkUtil.secureUrl(url, true).then(function(sUrl){
                    gotoLocation(sUrl);
                });
            }
            function gotoLocation(sUrl) {
                try {
                    if (windowOptions) {
                        window.open(sUrl, windowOptions.name || '_blank', windowOptions.specs || 'menubar=1,location=1,status=1,resizable=1,scrollbars=1', windowOptions.replace);
                    } else {
                        window.location.href = sUrl;
                    }
                } catch (ex) {
                    /*
                    * Swallow error that may result because of onbeforeunload
                    * halting the new page from loading in IE
                    */
                }
            }
        },

        /**
         * You can use this as the handler for pressing on a link object.
         * 
         * @example new sap.m.Button({press:surj.util.LinkUtil.handle})
         */
        handle : function(oLink) {
            // There is a copy of this code in idl-surj-web/src/main/webapp/ui/surj/js/util/LinkUtil.js
            if (typeof oLink)
                var sOnClick = oLink.onclick;
            var sUrl = oLink.url;
            if (sOnClick && typeof sOnClick == 'string') {
                // UI-10007 This is more equivalent to the JUIC code that protects against escaped markup like "&amp;"
                // WEF-1175 Dynamically generate a temporary tag in maybeUnescapePlainText to get the "onclick" code as unescaped HTML.
                Util.dangerouslyEvalScript("(function(){" + Util.maybeUnescapePlainText(sOnClick) + "})()");
            } else if (typeof sOnClick == 'function') {
                sOnClick();
            } else if (typeof sUrl == 'string') {
                var windowOptions = undefined;
                if (oLink.target == '_blank') {
                    windowOptions = {};
                }
                this.gotoURL(sUrl, false, windowOptions);
            }
        },
        /**
         * No need to secure relative URLs, or URLs that are considered base domain, or start with the current origin.
         * Only full URLs (with protocol/domain/etc) which lead to other domains that need it.
         */
        isSecureRequired: function(url) {
            return !Util.isBizXDomain(url) && url.indexOf(Util.getLocationOrigin()) !== 0 && url.match(/^https?:?\/\//);
        },
        secureUrl: function(url, async) {
            var res, rej;
            function handle() {
              if (window.secureUrl) {
                return secureUrl(url);
              } else if (!LinkUtil.isSecureRequired(url)) {
                return url;
              } else if (async) {
                SMRF.loadPromise(['/ui/juic/js/GlobalFunctions.js']).then(function() {
                   res(secureUrl(url));
                }, rej);
              } else {
                SMRF.loadSync(['/ui/juic/js/GlobalFunctions.js']);
                return secureUrl(url);
              }
            }
            if (async) {
              return new Promise(function(res1, rej1) {
                 res = res1;
                 rej = rej1;
                 var v = handle();
                 if (v != null) {
                   res(v);
                 }
              });
            }
            return Promise.resolve(handle());
        },
    };
    
    $.sap.setObject('sap.sf.surj.shell.util.LinkUtil', LinkUtil);
    return LinkUtil;

});