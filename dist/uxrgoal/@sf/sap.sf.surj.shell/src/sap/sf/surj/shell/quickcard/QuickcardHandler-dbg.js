
/**
 * Use the QuickcardHandler to open Quickcards associated with a Suggestion
 * popup like BizXSuggest.
 * 
 * @name sap.sf.surj.shell.quickcard.QuickcardHandler
 * @constructor
 */
sap.ui.define('sap/sf/surj/shell/quickcard/QuickcardHandler', [
        'jquery.sap.global',
        'sap/sf/surj/shell/util/Logger',
        'sap/sf/surj/shell/util/SMRF',
        'sap/sf/surj/shell/util/Util'
      ], function ($, Logger, SMRF, Util) {

      /*
       * A user must request a quickcard for this number of milliseconds before
       * the quickcard is shown so short lived requests will be ignored.
       */
      var SHORT_REQUEST_THRESHOLD = 500;

      var LOG = Logger.getLogger('QuickcardHandler');
    
      var QuickcardHandler = function() {
        var oActiveQuickcard;
        var aHiddenCallbacks = [];

        var oSelf = this;
        $.extend(oSelf, {
            /**
             * Show a quickcard for a suggestion that appeared from a
             * sap.m.Suggest popup.
             * 
             * @param {Object} oConfig
             * @param {String} oConfig.type The type of data requested, like
             *            "People", "Action", etc.
             * @param {Object} oConfig.item The raw data for the item used to
             *            create the SuggestionItem instance.
             * @param {sap.m.SuggestionItem} oConfig.suggestionItem The Control
             *            that rendered the SuggestionItem
             */
            showQuickcardForSuggestion : function(oConfig) {
                LOG.info('Quickcard requested', oConfig);
                var bCanceled = false;
                var that = this;
                var oIgnore = ignoreShortLivedRequests(oConfig);
                return $.extend(oIgnore.then(function() {
                    return $.when(that.getOrCreateQuickcard(oConfig)).done(function(oQuickcard) {
                        if (oQuickcard !== oActiveQuickcard) {
                            that.hideActiveQuickcard();
                            if (oQuickcard) {
                                var oOrigin = oConfig.origin || oConfig.suggestionItem.$()[0];
                                oActiveQuickcard = oQuickcard;
                                oQuickcard.show(oOrigin, false, oConfig.refocusId);
                            }
                        }
                    }).fail(function(ex) {
                        LOG.error.apply(LOG, arguments);
                    });
                }, function() {
                    LOG.info('Quickcard request was canceled');
                }), {
                    cancel : $.proxy(oIgnore.cancel, oIgnore),
                    config : oConfig
                });
            },

            /**
             * 
             * @param oConfig
             * @return {Promise.<Quickcard>} A promise to create the quickcard
             */
            getOrCreateQuickcard : function(oConfig) {
                switch (oConfig.type) {
                case 'People':
                    return getOrCreateQuickcardForPerson(oConfig);
                }
                return $.Deferred().resolve();
            },

            /**
             * Handle when the user used a short cut, such as clicking.
             */
            focusQuickcard : function() {
                if (oActiveQuickcard && oActiveQuickcard.isRegistered()) {
                    oActiveQuickcard.setFocus();

                    var that = this;

                    // When the quickcard hides, stop listening to the escape key
                    this.addQuickcardHiddenCallback(this._removeKeyListeners = this._removeKeyListeners || function() {
                        $(window).off(that._keyListeners);
                        that.removeQuickcardHiddenCallback(that._removeKeyListeners);
                    });

                    $(window).on(this._keyListeners = this._keyListeners || {
                        keydown : function(event) {
                            if (event.keyCode == $.sap.KeyCodes.ESCAPE) {
                                setTimeout(function() {
                                    that.hideActiveQuickcard(true);
                                }, 0);
                            }
                        }
                    });
                }
            },

            /**
             * Hide any active quickcard.
             */
            hideActiveQuickcard : function(force) {
                if (oActiveQuickcard && oActiveQuickcard.isRegistered()) {
                    oActiveQuickcard.hide(force);
                }
            },

            /**
             * Add a callback when the active quickcard is hidden.
             */
            addQuickcardHiddenCallback : function(oHandler) {
                if ($.inArray(oHandler, aHiddenCallbacks) < 0) {
                    aHiddenCallbacks.push(oHandler);
                }
            },

            /**
             * Remove the callback when active quickcard is hidden.
             */
            removeQuickcardHiddenCallback : function(oHandler) {
                var i = $.inArray(oHandler, aHiddenCallbacks);
                if (i >= 0) {
                    aHiddenCallbacks.splice(i, 1);
                }
            }
        });

        var SHORT_EXPIRE = null;

        /**
         * Ignore any short lived requests, the first request will kick off
         * loading quickcard dependencies, unless it was already loaded on the
         * page.
         * 
         * @return {Promise} A promise that your request is not short lived
         */
        function ignoreShortLivedRequests(oConfig) {
            var oDfd = $.Deferred();
            var bAlive = true;
            var fCancel;
            SHORT_EXPIRE && SHORT_EXPIRE();
            SHORT_EXPIRE = function() {
                SHORT_EXPIRE = null;
                bAlive = false;
                oDfd.reject();
            }
            var iStartTime = new Date().getTime();
            // Prevent loading the quickcard for action items
            var deps = oConfig.type == 'Person' || oConfig.type == 'People' ? loadQuickcardDeps() : $.Deferred().resolve();
            deps.then(function() {
                if (bAlive) {
                    SHORT_EXPIRE = null;
                    var iShortThreshold = oConfig.immediate ? 0 : SHORT_REQUEST_THRESHOLD;
                    var iLoadTime = new Date().getTime() - iStartTime;
                    var iRemainingTime = iShortThreshold - iLoadTime;
                    if (iRemainingTime <= 0) {
                        oDfd.resolve();
                    } else {
                        var iTimeout = window.setTimeout(function() {
                            SHORT_EXPIRE = null;
                            oDfd.resolve();
                        }, iRemainingTime);
                        SHORT_EXPIRE = fCancel = function() {
                            window.clearTimeout(iTimeout);
                            oDfd.reject();
                        }
                    }
                }
            }, function(reason) {
              $.sap.log.error('Could not load Quickcard', reason);
            });
            return $.extend(oDfd.promise(), {
                cancel : function() {
                    fCancel && fCancel();
                }
            });
        }

        var PERSON_INFO_MODELS = {};

        function getModelKey(oConfig) {
            var oPerson = oConfig.item;
            return oPerson.userId + ',' + oPerson.personId + ',' + oConfig.itemIndex + ',' + oConfig.fromHeader;
        }

        /**
         * 
         * @param oConfig
         * @return {Promise.<Quickcard>} A promise to create the quickcard
         */
        function getOrCreateQuickcardForPerson(oConfig) {
            var aCallbacks = aHiddenCallbacks;
            var oPerson = oConfig.item;
            var sKey = getModelKey(oConfig);
            var fFactory = null;
            // try to use the global window.Quickcard.newInstance
            // if that's not available then directly use QuickcardInternal constructor if available
            if (window.Quickcard) {
              fFactory = window.Quickcard.newInstance;
            } else {
              var fConstructor = $.sap.getObject('sap.sf.quickcard.QuickcardInternal');
              if (!fConstructor) {
                return $.Deferred().reject('QuickcardInternal not available');
              }
              fFactory = function(oConfig) {
                return new fConstructor(oConfig);
              }
            }
            try {
                oQuickcard = fFactory({
                    personId : oPerson.personId,
                    userId : oPerson.userId,
                    itemIndex : oConfig.itemIndex,
                    fromHeader : oConfig.fromHeader,
                    a11yAnnouncements : oConfig.a11yAnnouncements,
                    personInfoModel : PERSON_INFO_MODELS[sKey]
                });
            } catch(e) {
                return $.Deferred().reject(e);
            }
            oQuickcard.addEventListener('hide', {
                handleEvent : function() {
                    $.each(aCallbacks, function(i, callback) {
                        if (typeof callback == 'function') {
                            callback();
                        }
                    });
                }
            });
            $.when(oQuickcard.getDAO()).done(function(dao) {
                dao.addEventListener('personInfoAvailable', {
                    handleEvent : function(personInfoModel) {
                        PERSON_INFO_MODELS[sKey] = personInfoModel;
                    }
                });
            });
            
            return oQuickcard;
        }

        var QUICKCARD_DEPS;

        /**
         * Load the quickcard dependencies before using it.
         * 
         * @inner
         * @return {Promise} a promise that the quickcard dependencies will load
         */
        function loadQuickcardDeps() {
            if (window.Quickcard) {
                return Promise.resolve();
            } else if (!QUICKCARD_DEPS) {
                
                var plUrl;
                var metaUi5QC = document.getElementById('ui5QC');
                if (metaUi5QC && metaUi5QC.getAttribute('content') == "true") {
                    plUrl = sap.ui.resource('sap.sf.quickcard', 'library-preload.js');
                    var haUrl = sap.ui.resource('sap.sf.surj.preload.resources', 'header-aux-bundle.js');
                    return Promise.all([
                        Util.dangerouslyIncludeScript(haUrl),
                        Util.dangerouslyIncludeScript(plUrl)
                        ]).then(function() {
                        return sap.ui.getCore().loadLibrary('sap.sf.quickcard', {async: true}).then(function(){
                            return new Promise(function (res, rej) {
                                sap.ui.require(['sap/sf/quickcard/QuickcardInternal'], res, rej);
                            });
                        });
                    });
                } else {
                    QUICKCARD_DEPS = SMRF.loadPromise(['/ui/quickcard/js/quickcard.js']).catch(function (reason) {
                        $.sap.log.error('SMRF could not load quickcard dependency: ' + reason);
                        plUrl = sap.ui.resource('sap.sf.quickcard', 'library-preload.js');
                        Util.dangerouslyIncludeScript(plUrl).then(function(){
                            return sap.ui.getCore().loadLibrary('sap.sf.quickcard', {async: true}).then(function(){
                                return new Promise(function (res, rej) {
                                    sap.ui.require(['sap/sf/quickcard/QuickcardInternal'], res, rej);
                                });
                            });
                        });
                    });
                }
            }
            return QUICKCARD_DEPS;
        }
    };

    $.sap.setObject('sap.sf.surj.shell.quickcard.QuickcardHandler', QuickcardHandler);
    return QuickcardHandler;
});