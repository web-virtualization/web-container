sap.ui.define('sap/sf/surj/shell/util/TopNavLogout', 
    ['jquery.sap.global'], 
    function ($) {

// This file cannot have any hard dependencies
var gTopNavLogoutComponent = null;

/**
 * Number of milliseconds to wait for the /sf/logout deeplink to work before the inframe logout
 * window is closed. The deep link should be fast.
 */
TopNavLogout.INFRAME_LOGOUT_WAIT_TIME = 1000;

/**
 * Customizable flag to indicate if an inframe logout attempt should be made with an iframe. Only set to true
 * if we know that the landing page after logout does not have iframe-busting logic.
 */
TopNavLogout.INFRAME_LOGOUT_USES_IFRAME = false;

TopNavLogout.gotoURL = function(url) {
    /*
     * UI-12820
     *
     * If the logout was initiated by a postMessage from OneFLP and the page is displayed inside of an
     * iframe, then we need to open the given URL in a separate window (either a popup or another iframe).
     *
     * Using an iframe for this URL instead of a Popup window is the preferred User Experience; however, using
     * a Popup is safer because it would ensure that iframe-busting on the logout would not interrupt the outer
     * frame.
     *
     * We cannot simply call "Util.gotoURL" because we cannot control the content of the page but we still
     * need to notify the parent application that the logout is finished.
     */
    if (TopNavLogout._inframeLogoutAttempted) {
        /** @inner */
        function complete() {
            if (win) {
                win.close();
            }
            PostMessageAPI.sendMessage("logoutComplete");
        }
        var useIframe = TopNavLogout.INFRAME_LOGOUT_USES_IFRAME;
        var waitTime = TopNavLogout.INFRAME_LOGOUT_WAIT_TIME;
        var win, iframe;
        if (!useIframe) {
            win = window.open(url,'bizxLogoutPopup','resizable=1,scrollbars=1,status=1,height=200,width=400');
            useIframe = !win; // checking for popup blockers
        }
        if (useIframe) {
            iframe = document.createElement('iframe');
            var style = iframe.style;
            style.position = 'absolute';
            style.visibility = 'hidden';
            style.left = 0;
            style.top = 0;
            style.width = 0;
            style.height = 0;
            document.body.appendChild(iframe);
            /*
             * Some browsers don't seem to start the request if you 
             * set the src on the iframe too soon.
             */
            setTimeout(function() {
                iframe.src = url;
                setTimeout(complete, waitTime);
            }, 0);
        } else {
            setTimeout(complete, waitTime);
        }
    } else {
        if (window.Util && Util.gotoURL) {
            Util.gotoURL(url);
        } else {
            window.location.href = url;
        }
    }
};

if (window.PostMessageAPI && PostMessageAPI.addMessageListener) {
    PostMessageAPI.addMessageListener("logout", function(event) {
        TopNavLogout._inframeLogoutAttempted = window.top !== window.self;
        TopNavLogout.startLogout();
    });
}

/**
 * UI-22880 Invoke the logout code, using a dynamically generated script tag
 */
TopNavLogout.startLogout = function() {
    var win = window;
    var links;
    if (win.sap && sap.ui && sap.ui.getCore) {
        var pageHeader = sap.ui.getCore().getModel('pageHeader');
        links = pageHeader && pageHeader.getProperty('/actionLinks');
    }
    if (links == null && win.pageHeaderJsonData && pageHeaderJsonData.utilityLinks) {
        links = pageHeaderJsonData.utilityLinks.links;
    }
    for (var i=0; i<links.length; i++) {
        if (links[i].id == 'LOGOUT') {
            var doc = document;
            var onclick = links[i].onclick;

            // Dynamically generate a temporary tag to get the "onclick" code as unescaped HTML
            var div = doc.createElement('div');
            div.innerHTML = '<span data-onclick="' + onclick + '"></span>';
            doc.body.appendChild(div);
            onclick = div.firstChild.getAttribute('data-onclick');

            // See if there is a script nonce defined for the page
            var snonce = (doc.querySelector('meta[name=snonce]') || {}).content;

            // Invoke the logout code via a dynamically created script tag
            var script = doc.createElement('script');
            if (snonce) {
                script.nonce = snonce;
            }
            script.text = '(function(){' + onclick + '})();';
            doc.body.appendChild(script);
            
            return true;
        }
    }
    return false;
}

TopNavLogout.logout = function(logoutUrl, companyId) {

    // clear last page so that we don't redirect to it in this case
    if (window.SFSessionTimeout) {
        SFSessionTimeout.clearLastPageVisited();
    }

    if (arguments.length == 1) {
        TopNavLogout.gotoURL(logoutUrl);
    }
    else {
        var args = Array.prototype.slice.call(arguments); // turn arguments into an Array object
        spUrls = args.slice(2); // the first sp logout urls starts at arguments index 2

        TopNavLogout.requireBusyDialog(function(BusyDialog) {
            var logoutDiv = document.createElement("div");
            logoutDiv.id = "renderLogout";
            window.document.body.appendChild(logoutDiv);

            var loading = new BusyDialog();
            var t = setTimeout(function () {
                loading.close();
                gTopNavLogoutComponent.logoutCore()
            }, 5000);

            gTopNavLogoutComponent = new TopNavLogout(logoutDiv.id, logoutUrl, t, companyId, spUrls);
            gTopNavLogoutComponent.logoutSP();

            loading.open();
        })
    }
}

TopNavLogout.requireBusyDialog = function(callback) {
    // If sapui5 is available, use the BusyDialog
    if (window.sap && sap.ui && sap.ui.require) {
        sap.ui.require(['sap/m/BusyDialog'], callback);
    } else {
        // Just mock the BusyDialog, open/close will do nothing.
        callback(function() {
            this.open = this.close = function() {}
        });
    }
}

TopNavLogout.logoutEditableForm = function(redirectTokenParam, redirectTokenValue, redirectKeyParam, redirectKeyValue, companyId) {

    var spUrls = Array.prototype.slice.call(arguments); // turn arguments into an Array object
    spUrls = spUrls.slice(5); // the first sp logout urls starts at arguments index 5

    TopNavLogout.requireBusyDialog(function(BusyDialog) {
        var logoutDiv = document.createElement("div");
        logoutDiv.id = "renderLogout";
        window.document.body.appendChild(logoutDiv);

        var loading = new BusyDialog();
        var t = setTimeout(function () {
            loading.close();
            gTopNavLogoutComponent.logoutCoreForm()
        }, 5000);

        gTopNavLogoutComponent = new TopNavLogout("renderLogout", redirectKeyValue, t, companyId, spUrls);
        gTopNavLogoutComponent._initFormLogout(redirectTokenParam, redirectTokenValue,
            redirectKeyParam, redirectKeyValue);
        gTopNavLogoutComponent.logoutSP();

        loading.open();
    });
}

TopNavLogout.updateResponseCount = function() {
    gTopNavLogoutComponent.updateResponseCount();
}

/**
 * Navigates after logging out from the service providers
 *
 * @param {string} url URL to navigate to
 */
TopNavLogout.navigateAfterLoggingOutFromSPs = function (url) {
    var pageHeaderJsonData = window.pageHeaderJsonData,
        spLogoutUrls,
        companyId,
        params;
    do {
        if (!pageHeaderJsonData) {
            alert("WARNING: pageHeaderJsonData global var is unexpectedly not defined!");
            break;
        }
        spLogoutUrls = pageHeaderJsonData.spLogoutUrls;
        if (!spLogoutUrls || (spLogoutUrls.length <= 0)) {
            break;
        }
        companyId = pageHeaderJsonData.companyId;
        if (!companyId) {
            alert("WARNING: pageHeaderJsonData.companyId property is unexpectedly not defined!");
            break;
        }
        params = [url, companyId].concat(spLogoutUrls);
        TopNavLogout.logout.apply(TopNavLogout, params);
        return;
    } while (false);

    // Default is to simply go to the URL
    TopNavLogout.gotoURL(url);
};

function TopNavLogout(id, logoutUrl, timeoutHandler, companyId, urls) {
    this._divId = id;
    this._init(logoutUrl, timeoutHandler, companyId, urls);
}
(function() {
    var methods = { // removing dependency on juic.set and reduce diffs
        _init : function(logoutUrl, timeoutHandler, companyId, urls) {
            this._logoutUrl = logoutUrl;
            this._companyId = companyId;
            this._numberOfLogout = 0;
            this._spLogoutFrameList = new Array();
            this._isLogoutForm = false;
            this._initFrames(urls);
            this._timeoutHandler = timeoutHandler;
            var h = [];
            this.renderHtml(h);
            var el = document.getElementById(this._divId);
            if(!el) {
                el = document.createElement("div");
                el.id = "renderLogout";
            }
            el.innerHTML = h.join('');

        },
        _initFormLogout : function(redirectTokenParam, redirectTokenValue, 
                                   redirectKeyParam, redirectKeyValue) {
            this._isLogoutForm = true;
            this._redirectTokenParam = redirectTokenParam;
            this._redirectTokenValue = redirectTokenValue;
            this._redirectKeyParam = redirectKeyParam;
            this._redirectKeyValue = redirectKeyValue;
        },
        _initFrames : function(urls) {
            for (var i=0; i<urls.length; i++) {
                var spLogoutUrl = urls[i];
                var frame = new SPLogoutFrame(spLogoutUrl, this._companyId, i);
                this._spLogoutFrameList.push(frame);
                this._numberOfLogout += 1;
            }
        },
        renderHtml : function(h) {
            for (var i=0; i<this._spLogoutFrameList.length; i++) {
                this._spLogoutFrameList[i].renderHtml(h);
            }
        },
        logoutSP : function() {
            for (var i=0; i < this._spLogoutFrameList.length; i++) {
                this._spLogoutFrameList[i].submitLogout();
            }
        },
        updateResponseCount : function() {
            this._numberOfLogout -= 1;

            if (this._numberOfLogout < 1) {
                this.stopTimer();
                if (!this._isLogoutForm) {
                    this.logoutCore();
                }
                else {
                    this.logoutCoreForm();
                }
            }
        },
        stopTimer : function() {
            clearTimeout(this._timeoutHandler);
        },
        logoutCore : function() {
            TopNavLogout.gotoURL(this._logoutUrl);
        },
        logoutCoreForm : function() {
            setField(this._redirectTokenParam, this._redirectTokenValue);
            setFieldAndSubmit(this._redirectKeyParam, this._redirectKeyValue);
        }
    };
    for (var methodName in methods) {
        TopNavLogout.prototype[methodName] = methods[methodName];
    }
})();

function SPLogoutFrame(logoutUrl, companyId, index) {
    this._init(logoutUrl, companyId, index);
}

(function() {
    var methods = { // removing dependency on juic.set and reduce diffs
        _init : function(logoutUrl, companyId, index) {
            this._logoutUrl = logoutUrl;
            this._companyId = companyId;
            this._formName = 'spLogoutUrlForm' + index;
            this._frameName = 'spLogoutUrlFrame' + index;
        },
        renderHtml : function(h) {
            var pageHeaderJsonData = window.pageHeaderJsonData;
            // The effective base URL is the default one if the browser's
            // current URL starts with the default one; otherwise, we use
            // the company's base URL.  This allows the abnormal case where
            // CS/PS people login via Partner Provisioning, and they are
            // NOT using the "Reverse Proxy Url Prefix" value (that is
            // configured for the company in provisioning) as the Partner
            // Provisioning base URL.
            // Also, even though companies are supposed to be using the
            // "Reverse Proxy Url Prefix" -- if configured -- when they login,
            // if they don't use it, and instead, use the default Core BizX
            // base URL, we still want the Logout to work, if possible, for
            // the correct Logout URL, so this is another reason for
            // this fix.  Note, however, that if this JavaScript code
            // is running in a different domain than the
            // "Reverse Proxy Url Prefix" and the default Core BizX domains,
            // then this code will end up using "Reverse Proxy Url Prefix"
            // irrespective of which domain the user actually has the
            // login session for.  (For example, if Jam is using the shared
            // header that uses this JavaScript code, and the company instance
            // has a "Reverse Proxy Url Prefix" configured, but the user actually
            // entered via the default Core BizX base URL, then the logout won't
            // be executed from the default Core BizX base URL as we would want,
            // since the shared header that Jam got from BizX doesn't know about
            // what URL the user logged-in from.)
            var baseUrl = (pageHeaderJsonData && pageHeaderJsonData.defaultBaseUrl);
            if (baseUrl && (window.location.href.indexOf(baseUrl) != 0)) {
                baseUrl = null;
            }
            if (!baseUrl) {
                baseUrl = (pageHeaderJsonData && pageHeaderJsonData.baseUrl) || '';
            }
            var ajaxSecKey = window.ajaxSecKey;
            h.push('<form name="' + this._formName + '" action="' + baseUrl + '/sf/idp/SAML2/slo' + (ajaxSecKey ? '?_s.crb=' + ajaxSecKey : '') + '" target="'+ this._frameName + '" method="POST">');
            h.push('<input type="hidden" name="LogoutUrl" value="' + this._logoutUrl + '" />');
            h.push('<input type="hidden" name="company" value="' + this._companyId + '" />');
            h.push('</form>');
            h.push('<iframe name="' + this._frameName + '" src="" width="0px" height="0px" style="visibility: hidden"></iframe>');
        },
        submitLogout : function() {
            document.forms[this._formName].submit();
        }
    };
    for (var methodName in methods) {
        SPLogoutFrame.prototype[methodName] = methods[methodName];
    }
})();

    $.sap.setObject('sap.sf.surj.shell.util.TopNavLogout', TopNavLogout);
    return (window.TopNavLogout = TopNavLogout);

});