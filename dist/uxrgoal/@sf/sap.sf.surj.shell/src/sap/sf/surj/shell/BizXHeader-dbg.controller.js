sap.ui.define('sap/sf/surj/shell/BizXHeader.controller', [
    // START: External Imports
    'jquery.sap.global',
    'sap/ui/Device',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/core/Icon',
    'sap/m/Dialog',
    // END: External Imports

    // START: Internal Imports
    './util/Util',
    './util/DeferredUtil',
    './util/ActionSearchUtil',
    './util/Logger',
    './util/AnimateUtil',
    './util/A11yPreferences',
    './util/SearchUtil',
    './util/JamUtil',
    './util/ShowMeUtil',
    './util/LinkUtil',
    './util/CookiePolicyUtil',
    './util/ProxyUtil',
    './util/FLPServices',
    './controls/BizXMenuListItem',
    './controls/BizXSuggestionItem',
    './controls/BizXMenuPopover',
    './controls/GlobalAssignmentMenuItem',
    './controls/IntroSuggestionItem',
    './controls/PeopleSuggestionItem',
    './controls/ShowMoreSuggestionItem',
    './controls/ResponsiveSidePanel',
    './controls/BizXSearchField',
    './core/BizXResourceModel',
    './quickcard/QuickcardHandler',
    // END: Internal Imports

    // START: dependencies with side-effects
    // IMPORTANT: These must be listed at the end, since it will not be mentioned in the callback argument list, avoiding unused variables
    './util/Polyfill',          // any necessary polyfills
    'jquery.sap.storage',       // initializes the `jQuery.sap.storage` global
    './util/PeopleSearchUtil',  // Registers People as a search type
    './library'                 // Adds the sap.sf.surj.shell's library.css to the page
    // END: dependencies with side-effects
], function (
    // External
    $, Device, JSONModel, Fragment, Icon, Dialog,
    
    // Internal
    Util, DeferredUtil, ActionSearchUtil, Logger, AnimateUtil, A11yPreferences, SearchUtil, JamUtil, ShowMeUtil, LinkUtil, CookiePolicyUtil, ProxyUtil, FLPServices, 
    BizXMenuListItem, BizXSuggestionItem, BizXMenuPopover, GlobalAssignmentMenuItem, IntroSuggestionItem, PeopleSuggestionItem, ShowMoreSuggestionItem, ResponsiveSidePanel, BizXSearchField, 
    BizXResourceModel, QuickcardHandler

    ) {
    "use strict";
    var oCore = sap.ui.getCore();
    var rb = oCore.getLibraryResourceBundle('sap.sf.surj.shell.i18n');
    var LOG = Logger.getLogger('BizXShell.controller');
    var TODO_PANEL_PKG = 'sap.sf.todo.util.PanelManager';
    var SCROLL_THRESHOLD = 50;
    var SUPPORTED_SEARCH_TYPES = [ 'ActionPeople', 'People', 'Jam', 'JamGroup' ];
    var PEOPLE_SEARCH_KEYS = [ 'TITLE', 'PHONE' ];
    var ICON_MAPPING = {
        LOGOUT : 'sap-icon://log',
        OPTIONS : 'sap-icon://action-settings',
        SWITCH_TO_ASSIGNMENT : 'sap-icon://visits',
        SELECTED_ASSIGNMENT : 'sap-icon://employee-approvals',
        HOME_ASSIGNMENT : 'sap-icon://home',
        GLOBAL_ASSIGNMENT : 'sap-icon://globe',
        PRIMARY_ASSIGNMENT : 'sap-icon://favorite',
        ADMIN : 'sap-icon://technical-object',
        FEEDBACK : 'sap-icon://notification-2',
        PROXY_NOW : 'sap-icon://citizen-connect',
        DEFAULT : 'sap-icon://shortcut',
        TILE_CATALOG : 'sap-icon://grid',
        TODO_ACTION : 'sap-icon://sys-enter',
        SHOW_VERION_INFO : 'sap-icon://hint'
    };
    var SECTION_TITLES = {
        Action : rb.getText('COMMON_ACTIONS'),
        CopilotAction : rb.getText('COMMON_COPILOT_ACTIONS'),
        People : rb.getText('COMMON_People')
    };
    var msgs = window.MSGS || {};
    var SEARCH_CONFIG = {
        ActionPeople : {
            label : rb.getText('COMMON_Action_or_people_search'),
            placeholder : rb.getText('COMMON_Search_for_actions_or_people'),
            intro : rb.getText('COMMON_Global_Action_Search_Intro')
        },
        People : {
            label : rb.getText('COMMON_People'),
            placeholder : rb.getText('COMMON_Search_for_people')
        },
        Jam : {
            label : msgs.COMMON_Jam_search || rb.getText('COMMON_Jam_search'),
            placeholder : msgs.COMMON_Global_Jam_Search_Placeholder || rb.getText('COMMON_Global_Jam_Search_Placeholder')
        },
        JamGroup : {
            placeholder : rb.getText('COMMON_Global_Jam_Group_Search_Placeholder')
        }
    };
    var SIDE_PANEL_TYPE = {todos:'todos', notifications: 'notif'};
    var SIDE_PANEL_PARAM = 'side-panel';
    var FIORI_3_HEADER = 3; 

    return sap.ui.controller('sap.sf.surj.shell.BizXHeader', {
        onInit : function() {
            var oModel = this.mModel = oCore.getModel('pageHeader');

            if (!oModel && window.pageHeaderJsonData) {
                oModel = this.mModel = new JSONModel(window.pageHeaderJsonData);
                oCore.setModel(oModel, 'pageHeader');
            }

            this._normalizeModelData(oModel); // Normalize the data in the model so it matches what we expect
            this._handleSapShellParam();

            var aUtilityLinks = oModel.getProperty('/utilityLinks/links');

            // This code was moved (and refactored) from /ui/uicore/js/template/header.js
            if (!Util.isRunningBaseDomain()) {
                // Remove the "Proxy Now" and "Become Self" (UI-3736/PTCH-19391) utility link since it only works
                // when the page is running in the same domain as the base URL
                aUtilityLinks = aUtilityLinks && aUtilityLinks.filter(function(oLink) {
                    var id = oLink.id;
                    return !(id == 'PROXY_NOW' || id == 'PROXY_BECOME_SELF');
                });
                oModel.setProperty('/utilityLinks/links', aUtilityLinks);

                // Remove the "Show Me" functionality since it only works
                // when the page is running in the same domain as the base URL
                // Same with global to-do list
                oModel.setProperty('/showMeInfo', null);

                // Remove the Global Notification which doesn't work on non-Base Domain pages yet
                oModel.setProperty('/settings/showGlobalNotification', 'false');

                // Todos are only allowed with CORS or smart proxy
                if (!Util.isBaseDomainCORSEnabled() && !oModel.getProperty('/odataProxyUrl')) {
                    oModel.setProperty('/enableGlobalTodos', false);
                }
            }

            var aActionLinks = [];
            var aActiveEmployments = [];

            var that = this;
            var aGlobalAssignmentLinks = oModel.getProperty('/globalAssignmentLinks');
            aGlobalAssignmentLinks && $.each(aGlobalAssignmentLinks, function(nIdx, oGlobalAssignmentLink) {
                var oLink = $.extend({}, oGlobalAssignmentLink);

                // The left aligned icon
                if (oLink.isSelected) {
                    oLink.icon = ICON_MAPPING.SELECTED_ASSIGNMENT;
                } else {
                    oLink.icon = ICON_MAPPING.SWITCH_TO_ASSIGNMENT;
                }

                // Employee Differentiators
				oModel.setProperty('/bEmploymentDifferentiatorsFlag',oLink.employeeDifferentiatorsInfo);

				// The label
				var sLabel = '';
				if(oModel.getProperty('/bEmploymentDifferentiatorsFlag')){
					sLabel = oLink.empDifferentiators || rb.getText('COMMON_Search_No_Title_Placeholder');
				}
				else{
					sLabel = oLink.employeeTitle || rb.getText('COMMON_Search_No_Title_Placeholder');
				}


                if (!oLink.isActive) {
                    var sInactive = rb.getText('COMMON_InActive');
                    oLink.dimmedText = ' ' + rb.getText('COMMON_PARENTHETICAL_PHRASE', [sInactive]);
                }
                oLink.label = sLabel;

                // Optional supplemental icon
                var sIconSrc;
                var sAssignmentTypeText;
                if (oLink.isPrimaryAssignment) {
                    sIconSrc = ICON_MAPPING.PRIMARY_ASSIGNMENT;
                    sAssignmentTypeText = rb.getText('COMMON_Primary_Employment');
                    oLink.assignment = 'primaryAssignment';
                } else if (oLink.isGlobalAssignment) {
                    sIconSrc = ICON_MAPPING.GLOBAL_ASSIGNMENT;
                    sAssignmentTypeText = rb.getText('COMMON_Global_Assignment');
                    oLink.assignment = 'globalAssignment';
                } else if (oLink.isHomeAssignment) {
                    sIconSrc = ICON_MAPPING.HOME_ASSIGNMENT;
                    sAssignmentTypeText = rb.getText('COMMON_Home_Assignment');
                    oLink.assignment = 'homeAssignment';
                }
                if (sAssignmentTypeText) {
                    oLink.assignmentTypeText = sAssignmentTypeText;
                }
                if (sIconSrc) {
                    oLink.supplementalIcons = [{
                        src: sIconSrc,
                        tooltip: sAssignmentTypeText
                    }];
                }
                that._updateGlobalAssignmentLink(oLink);
                // mobile
                if (Device.system.phone) {
                    aActionLinks.push(oLink);
                }
                aActiveEmployments.push(oLink);
                if (oGlobalAssignmentLink.isSelected) {
                    var oSelectedAssignment = $.extend({}, oGlobalAssignmentLink);
                    oSelectedAssignment.label = that._unescape(oSelectedAssignment.label);
                    oModel.setProperty('/selectedAssignment', oSelectedAssignment);
                }
            });

            if (aActiveEmployments.length == 0) {
                aActiveEmployments.push({
                    userId: oModel.getProperty('/userInfo/id')
                });
            }

            var bEnableGlobalTodos = oModel.getProperty('/enableGlobalTodos');
            if (bEnableGlobalTodos && Device.system.phone) {
                this._todoActionPath = '/actionLinks/' + aActionLinks.length;
                aActionLinks.push({
                    id : 'TODO_ACTION',
                    icon : ICON_MAPPING.TODO_ACTION,
                    label : 'TODO_ACTION',
                    visible : false
                });
            }

            oModel.setProperty('/activeEmployments', aActiveEmployments);

            aUtilityLinks && $.each(aUtilityLinks, function(nIdx, oUtilityLink) {
                var oLink = $.extend({}, oUtilityLink);
                oLink.icon = ICON_MAPPING[oLink.id] || ICON_MAPPING.DEFAULT;
                if (oLink.id === 'LOGOUT') {
                    that._prependOnClick(oLink, 'if (window.BizXHeaderController) {BizXHeaderController.onBeforeLogout()}');
                }
                aActionLinks.push(oLink);
            });

            var oUserInfo = oModel.getProperty('/userInfo');
            
            var sPhotoSrc = oUserInfo.photoSrc;
            if(!sPhotoSrc) {
	            sPhotoSrc = {
	                urlType : 'eduPhoto',
	                photoType : 'liveProfile',
	                mod : oUserInfo.mod
	            };
	            if (oUserInfo.userIdEncoded) {
	                sPhotoSrc.userIdEncoded = oUserInfo.userIdEncoded;
	            } else {
	                sPhotoSrc.userId = oUserInfo.id;
	            }
            }
            oModel.setProperty('/userTopNav', {
                /*
                 * UI-7345 Must unescape the full name since the
                 * PageHeaderController already escapes it.
                 */
                fullName : this._unescape(oModel.getProperty('/utilityLinks/label/label')),
                photoSrc : sPhotoSrc
            });

            oModel.setProperty('/actionLinks', aActionLinks);


            if (window.SFGuidedTourRegistry) {
                SFGuidedTourRegistry.register('sfGuidedTour_NavigationMenu', {
                    id: 'customHeaderModulePickerBtn'
                });
            }

            this.mNoResultItem = new IntroSuggestionItem({
                introSnippet : '<div class="noSearchResults">' + rb.getText('COMMON_No_Results') + '</div>'
            });
            this.mIntroItem = new IntroSuggestionItem({
                introSnippet : '{universalSearch>/introSnippet}'
            });

            this._unescapeLabels(oModel, '/actionLinks');
            this._unescapeLabels(oModel, '/activeEmployments');

            this._initDialogPosFix();
            this._initSearchConfig();
            this._initGlobalNotificationCount();
            this._initShowMe();
            this._initTodos();
            this._initShowCookiePolicy();
            this._initSecurityPolicy();

            this._mouseEnterSuggestion = $.proxy(this._mouseEnterSuggestion, this);
            this._mouseLeaveSuggestion = $.proxy(this._mouseLeaveSuggestion, this);

            // Make sure the global instance reference is populated
            var sGlobalInstanceRef = oModel.getProperty('/globalInstanceRef');
            var oView = this.getView();
            if (sGlobalInstanceRef) {
                window[sGlobalInstanceRef] = window[sGlobalInstanceRef] || oView;
            }
            
            /*
             * Expose certain public controller functions onto the view.
             */
            var oThis = this;
            oView.setModel(oModel, 'pageHeader');
            oView.setModel(oCore.getModel('i18n') || new BizXResourceModel, 'i18n');
            oView.setModel(oCore.getModel('universalSearch'), 'universalSearch');
            var aPublicMethods = [ 'clearAddedSubTabs', 'clearSubTabs', 'addSubTabs', 'getJamBaseUrl', 'getUrlOfSubTabWithId', 'setUrlOfSubTabWithId', 'getSubTab', 'setSelectedSubTab', 'updateJamGroupSearchInfo' ];
            $.each(aPublicMethods, function(i, sMethodName) {
                oView[sMethodName] = function() {
                    return oThis[sMethodName].apply(oThis, arguments);
                };
            });

            // UI-9775 When allowEmbeddableMode is turned on, this should hide the header & footer
            if ( oModel.getProperty('/allowEmbeddableMode') 
                && window.top != window.self 
                && !oModel.getProperty('/useSimplifiedHeader')) {
                $('body').addClass('bizXEmbeddedMode');
            }

            // UI-9352 Added to expose certain header functionalities to the window
            // Ex: BizXHeaderController.disableGlobalNotificationButtonClick()
            window.BizXHeaderController = this;
            this._initFooter();

            // Check if this page was redirected to activate an action by checking the request parameter
            ActionSearchUtil.checkRedirectAction();

            this._initSessionTimeout();

            var oDowntime = oModel.getProperty('/downtimeNotification');
            if (oDowntime) {
                this._initDowntime(oDowntime);
            }

            var sBodyClasses = oModel.getProperty('/bodyClasses');
            if (sBodyClasses) {
                $('body').addClass(sBodyClasses);
            }

            var oSettings = oModel.getProperty('/settings');
            if (Util.isRunningBaseDomain() && oSettings) {
                if (oSettings.feedBackFeatureEnabled == 'true') {
                    Util.initFeedback();
                }
                if (oSettings.isKbaAnswerRequired == 'true') {
                    Util.initKBA();
                }
                if (oSettings.isPwdChangeRequired == 'true') {
                    Util.initPwdChange();
                }
                if (oSettings['ui5-content-density-support'] === 'true') {
                    $('html, body').addClass(Device.support.touch ? 'sapUiSizeCozy' : 'sapUiSizeCompact');
                }
                var sCurrentTheme = oCore.getConfiguration().getTheme();
                if (oSettings['sync-high-contrast-with-ui5'] == 'true') {
                    $('html').addClass(sCurrentTheme.indexOf('sap_belize_hc') == 0 ? 'syncHighContrastWithUI5' : 'syncHighContrastWithUI5Off');
                }
            }

            if (oSettings && oSettings.userAssistEnabled == 'true') {
                if (Util.isRunningBaseDomain() || Util.isUASupportedExternalModule()) {
                    sap.ui.require(['sap/sf/userassistance/userAssistanceUtil'], function(userAssistanceUtil) {
                        userAssistanceUtil.init(oSettings);
                    });
                }
            }

            if (Util.isRunningBaseDomain()) {
                this._handleSidePanelParam();
            }

            Util.addPageInitScripts();

            if (oSettings && oSettings.inProductSupportEnabled == 'true') {
                //If it on same base domain, we always enable IPS (like regular bizX page)
                //If CORS is enabled, which means "they" have an valid bizX session, then we can run the IPS iFrame (like LMS)
                if (Util.isRunningBaseDomain() || Util.isBaseDomainCORSEnabled()) {
                    Util.initIPS();
                }
            }

            if (this._isFiori3HeaderEnabled()) {
                $('body').addClass('fioriShellBarEnabled');
            }

            Util.setHeaderController(this);

            if (oSettings && oSettings.liteMode == 'true') {
                var self = this;
                var oPageInfo = oModel.getProperty('/pageInfo');
                var sModuleId = oPageInfo.moduleId;
                var sPageId = oPageInfo.pageId;
                var sLanguage = oModel.getProperty('/userLocale');
                var sUserId = oModel.getProperty('/userInfo/id');
                Util.fetchPageNavigations({
                    moduleId : sModuleId,
                    pageId : sPageId,
                    language : sLanguage,
                    userId : sUserId
                }).then(function(oResult) {
                    var modules = oResult.modules || [];
                    var subTabs = oResult.subTabs || [];
                    var pageHeaderJsonData = window.pageHeaderJsonData;
                    if (pageHeaderJsonData) {
                        pageHeaderJsonData.modules = modules;
                        pageHeaderJsonData.subTabs = subTabs;
                    }
                    oModel.setProperty('/modules', modules);
                    oModel.setProperty('/subTabs', subTabs);
                    self._initPageNavigations(oModel);
                }).catch(function(error) {
                    LOG.error(error);
                });
            } else {
                this._initPageNavigations(oModel);
            }
        },

        // WEF-1225
        // Override the onclick behavior of the GA/CE context switcher links to logout of the SPs and then navigate to the URL
        _updateGlobalAssignmentLink: function(oLink) {
            if (oLink.url) {
                // Check if TopNavLogout exists, which will be true for most legacy pages, but maybe not shell:app or react pages
                // If it does not exist, then require it first, and then use it to logout the SPs.
                // In the case of a Strict CSP policy and sap.ui.require can't insert <script> tags on the page
                // Then this require the preload of TopNavLogout.js added to the page before this runs, otherwise the sap.ui.require
                // will fail and fallback to modifying the window.location.href to the URL instead (bypassing this change entirely)
                var onclick = 
                '!function(u){'+
                    'function e(){TopNavLogout.navigateAfterLoggingOutFromSPs(u)}'+
                    'if(window.TopNavLogout){'+
                        'e()'+
                    '}else{'+
                        'sap.ui.require(["sap/sf/surj/shell/util/TopNavLogout"],e,function(){window.location.href=u})'+
                    '}'+
                '}('+JSON.stringify(oLink.url)+')';
                if (oLink.onclick) {
                    onclick += ';' + oLink.onclick;
                }
                oLink.onclick = onclick;
                oLink.url = null;
            }
        },

        _initPageNavigations: function(oModel) {
            var oData = oModel.getData();

            /*
             * The selected module shall serve as the title of the page.
             * Manually find it and update the data.
             */
            var aModules = oData.modules || [];
            var nModuleIndex = -1;
            var oHomeModule = false;
            for (var i = 0; i < aModules.length; i++) {
                var oModule = aModules[i];
                if (nModuleIndex < 0 && oModule.isSelected) {
                    nModuleIndex = i;
                }
                if (oModule.id === 'HOME') {
                    oHomeModule = oModule;
                }
            }

            oModel.setProperty('/selectedModule', nModuleIndex >= 0 ? aModules[nModuleIndex] : null);
            oModel.setProperty('/title',  aModules[nModuleIndex >= 0 ? nModuleIndex : 0].label);
            oModel.setProperty('/homeModule', oHomeModule);

            this._setEnableHomeIcon(oModel, oHomeModule);

            var iSubTabsLength = oData.subTabs.length;
            oModel.setProperty('/initialTabLength', iSubTabsLength);

            if (iSubTabsLength > 0) {
                for (var i=0; i<iSubTabsLength; i++) {
                    this.registerSubTab(oData.subTabs[i]);
                }
            }

            if (!this.isSubTabsVisible()) {
                $('body').addClass('globalNavigationSansSubNav');
            }

            this._unescapeLabels(oModel, '/subTabs');
            this._unescapeLabels(oModel, '/modules');

            this._postMessagePageTitle(oModel);
        },

        _postMessagePageTitle: function (oModel) {
            var sPageTitle;
            if (FLPServices.isSupported()) {
                sPageTitle = this._getPageTitle(oModel);
                if (sPageTitle) {
                    FLPServices.ShellUIService.setTitle(sPageTitle);
                }
            } else if (window.PostMessageAPI) { // UI-13567
                sPageTitle = this._getPageTitle(oModel);
                if (sPageTitle) {
                    PostMessageAPI.sendMessage('navToApp', {
                        title: sPageTitle
                    });
                }
            }
        },

        /**
         * Depending on if OData is used or not, the Model data structure can change slightly.
         * This function will normalize the structure.
         */
        _normalizeModelData : function(oModel) {
            oModel.setData(DeferredUtil.normalizeODataResponse(oModel.getData()));
            
            // The universalSearchConfig requires first letter to be capitalized (for backwards compatibility)
            var oSearchConfig = oModel.getProperty('/universalSearchConfig');
            var oCompatible = {};
            var bChanged = false;
            for (var sSearchType in oSearchConfig) {
                var sCompatibleType = sSearchType.substring(0, 1).toUpperCase() + sSearchType.substring(1);
                oCompatible[sCompatibleType] = oSearchConfig[sSearchType];
                bChanged = bChanged || sCompatibleType != sSearchType;
            }
            if (bChanged) {
                oModel.setProperty('/universalSearchConfig', oCompatible);
            }
        },

        _setEnableHomeIcon : function (oModel, oHomeModule) {
            if (!oHomeModule || (!oHomeModule.onclick && !oHomeModule.url)) {
                oModel.setProperty('/enableHomeIcon', false);
            }
         },

        _getPageTitle : function(oModel) {
            var sPageTitle = oModel.getProperty('/modulePageTitle');
            var oSelectedModule = this._getSelectedItem(oModel.getProperty('/modules'));
            var oSelectedSubTab = this._getSelectedItem(oModel.getProperty('/subTabs'));

            /*
             * A module page can customize the page title by setting pageHeaderJsonData.modulePageTitle
             * if that has not been set, then we will use the selected module/selected sub tab.
             */
            if (!sPageTitle) {
                var sModuleTitle = oSelectedModule && oSelectedModule.label;
                var sSubtabTitle = oSelectedSubTab && oSelectedSubTab.label;
                // Ignore the subtab title if it is the same as the module title
                if (sSubtabTitle == sModuleTitle) {
                    sSubtabTitle = null;
                }
                // If both module and subtab have a title, then concatenate them together
                if (sModuleTitle && sSubtabTitle) {
                    sPageTitle = sModuleTitle + ': ' + sSubtabTitle;
                } else {
                    sPageTitle = sSubtabTitle || sModuleTitle;
                }
                /*
                 * If no module was selected and no subtab, then try the document title
                 * which is the text that displays in the Browser/Tab title bar
                 * and is usually like this "SuccessFactors: <Page Title>" in BizX;
                 * however, ignore the "SuccessFactors:" prefix.
                 */
                if (!sPageTitle) {
                    sPageTitle = document.title.trim();
                    var sIgnorePrefix = 'SuccessFactors:';
                    if (sPageTitle.indexOf(sIgnorePrefix) == 0) {
                        sPageTitle = sPageTitle.substring(sIgnorePrefix.length).trim();
                    }
                }
            }

            return sPageTitle;
        },

        _getSelectedItem : function(aItems) {
            if (aItems) {
                for (var i=0; i<aItems.length; i++) {
                    var oItem = aItems[i];
                    if (oItem.isSelected) {
                        return oItem;
                    }
                }
            }
            return null;
        },

        _prependOnClick : function(link, clickFunc) {
            if (link.onclick) {
                link.onclick = clickFunc + ';' + link.onclick;
            } else {
                link.onclick = clickFunc;
                if (link.href || link.url) {
                    link.onclick += ';return true';
                }
            }
        },

        onAfterRendering : function() {
            /*
             * Make the Header invisible until the UI5 Library CSS is ready
             * which prevents the flash of unstyled DOM in the header which looks bad
             * in cold cache scenarios.
             */
            var bImmediate = true;
            var oThis = this;
            var $loading = $('#sfLoadBlockerLayer');
            var hasLoading = $loading.length > 0;
            var oLibPromise = DeferredUtil.whenUI5LibraryCSSReady().done(function() {
                if (!bImmediate) {
                    if(hasLoading) {
                        $loading.hide();
                    } else {
                        oThis._$().css('visibility', 'visible');
                    }
                }
            });

            bImmediate = false;
            if (oLibPromise.state() == 'pending') {
                    if(hasLoading) {
                        //reuse loading indicator but without blocking full screen
                        $loading.css('background-color', 'transparent').show();
                    } else {
                        this._$().css('visibility', 'hidden');
                    }
            }

            if (this.mModel.getProperty('/options/ultraWideHeader')) {
                $(window).scroll($.proxy(this._adjustUltraWideHeader, this));
                $(window).resize($.proxy(this._adjustUltraWideHeader, this));
                SFBodyEventDispatcher.addResizeListener(this, '_adjustUltraWideHeader');
                this._adjustUltraWideHeader();
            }

            var pageHeaderJsonData = window.pageHeaderJsonData;
//            if (pageHeaderJsonData && pageHeaderJsonData.chatbotSupportEnabled) {
//                this._initializeChatbotSupport();
//            }

            this._testInvalidate();

            if (this._isFiori3HeaderEnabled()) {
                var adjustPlacematHeight = this._adjustPlacematHeight.bind(this);
                $(window).resize(adjustPlacematHeight);
                setTimeout(adjustPlacematHeight, 0);
            }

            //UI-20271 If user photo is disabled, the user full name cannot vertically center in some pages.
            //There is no difference in style, comparing with the utility menu that has vertical placed full name.
            //The root cause cannot be figured out. Use the hack here to set the line-height if the full name is not wrapped.
            if (!this.mModel.getProperty('/userInfo/photoEnabled')) {
                var $fullNameSpan = $('.surjUtilityLinksMenu span.sapMBtnContent');
                if ($fullNameSpan.css('max-Width') != $fullNameSpan.css('width')) {
                    $fullNameSpan.css('line-height', '2.375rem');
                }
            }
        },

        _adjustPlacematHeight: function() {
            var $globalPlacemat = $('div.globalPlacemat').first();
            if ($globalPlacemat.length == 0) {
                return;
            }
            var $globalFooter = $('div.globalFooter');
            var $globalHeader = $('.globalHeader');
            var iDeltaHeight = 0;
            if ($globalHeader.length > 0) {
                iDeltaHeight = $globalHeader.is(":visible") ? $globalHeader.outerHeight(true) : 0;
            }
            if ($globalFooter.length > 0 ) {
                iDeltaHeight += $globalFooter.outerHeight(true);
            }
            $globalPlacemat.outerHeight(window.innerHeight - iDeltaHeight, true);
        },
        adjustNameSize: function(oEvent) {
            if (typeof this._nameInterval == 'undefined') {
                this._nameInterval = setInterval($.proxy(function() {
                    var oName = $('.surjUtilityLinksMenu .sapMBtnContent,.surjTopNavHeaderBar .surjUserPhotoName');
                    var maxHeight = parseInt(oName.css('max-height'));
                    if (!isNaN(maxHeight)) {
                        clearInterval(this._nameInterval);
                        this._nameInterval = undefined;
                        var oEl = oName[0];
                        var iFontSize = 13;
                        while (oEl.scrollHeight > oEl.offsetHeight && iFontSize > 10) {
                            oName.css('font-size', iFontSize + 'px');
                            iFontSize--;
                        }
                    }
                }, this), 10);
            }
        },

        _testInvalidate : function() {
            /*
             * UI-15172 In IE sometimes the header is messed up after rendering - I don't know why
             * I can only detect the scenario as the Left section has 0px width, then invalidate the view
             * That corrects the problem.
             */
            if (!this._hasInvalidated && !$('body').hasClass('bizXEmbeddedMode')) { // only do this logic once
                this._hasInvalidated = true;
                var oView = this.getView();
                setTimeout(function() {
                    if ($('.sapMBarLeft', oView.$()).css('width') == '0px') {
                        oView.invalidate();
                    }
                }, 100);
            }
        },

        _onAfterRenderingNotification : function() {
            var inboxPopover = $.sap.getObject('jamApp.InboxPopover');
            if (inboxPopover && inboxPopover.bindNotificationBellEvent) {
                inboxPopover.bindNotificationBellEvent('#current-user-notification-count');
                this.disableGlobalNotificationButtonClick();
            }
            var oNotificationButton = oCore.byId('current-user-notification-count');
            if(oNotificationButton) {
                oNotificationButton.$().attr({
                    'aria-expanded': false,
                    'aria-controls': 'globalNotificationPanel'
                });
            }
        },

        _adjustUltraWideHeader : function() {
            var oEl = this._$();
            var oPlaceholder = $('#bizXHeaderPlaceholder');
            if (oPlaceholder.length == 0) {
                var oOffset = oEl.offset();
                this._iTopOffset = oOffset.top;
                this._iLeftOffset = oOffset.left;
                if (oCore.getConfiguration().getRTL()) {
                    this._iLeftOffset += $("body").prop("scrollWidth") - $(window).width();
                }
                this._iHorizMargin = this._iLeftOffset * 2 - oEl.outerWidth() + oEl.innerWidth();
                oPlaceholder = $('<div id="bizXHeaderPlaceholder"></div>').css({
                    height : oEl.outerHeight() + 'px'
                }).insertBefore(oEl);
            }
            var sWidth = ($(window).width() - this._iHorizMargin - AnimateUtil.getHtmlOffset()) + 'px';
            oEl.css({
                position: 'fixed',
                top : (this._iTopOffset - $(window).scrollTop()) + 'px',
                width: sWidth
            });
            $('#globalHeaderFullWidthBackground').css({
                left : $(window).scrollLeft() + 'px',
                width : sWidth
            });
        },

        isLegacyEscaped : function() {
            return this.mModel.getProperty('/legacyEscaped')
        },

        _unescape : function(sText) {
            return this.isLegacyEscaped() ? $('<div>' + sText + '</div>').text() : sText;
        },

        _unescapeLabels : function(oModel, sPath) {
            if (this.isLegacyEscaped()) {
                var aLinks = oModel.getProperty(sPath);
                for (var i = 0; i < aLinks.length; i++) {
                    var oLink = aLinks[i];
                    var sLabel = this._unescape(oLink.label);
                    var sTitle = this._unescape(oLink.title);
                    var sPrefix = sPath + '/' + i + '/';
                    oModel.setProperty(sPrefix + 'label', sLabel);
                    oModel.setProperty(sPrefix + 'title', sTitle);
                }
            }
        },

        _initSearchConfig : function() {
            var oConfig = this.mModel.getProperty('/universalSearchConfig') || {};

            // Some external users expect this value to populated on the view
            this.getView()._universalSearchConfig = oConfig;

            var oThrottle = SearchUtil.createThrottle();
            oThrottle.attachEvent('pageReady', $.proxy(this.showSearchResultPage, this));
            oThrottle.attachEvent('error', $.proxy(this.showSearchError, this));
            oThrottle.attachEvent('pending', $.proxy(this.showSearchPending, this));
            this.mSearchThrottle = oThrottle;

            this._initSearchTypeItems();
        },

        /**
         * @private
         */
        _initSearchTypeItems : function() {
            var oConfig = this.mModel.getProperty('/universalSearchConfig') || {};
            var oData = {};
            var aSearchTypeItems = [];
            var sDefaultSearchType = null;
            var nVisibleSearchTypes = 0;
            var bSearchEnabled = false;

            if (!Util.isRunningBaseDomain()) {
                var oActionPeople = oConfig.ActionPeople;
                var bActionPeople = oActionPeople && oActionPeople.searchEnabled;
                var oPeople = oConfig.People;
                if (Util.isBaseDomainCORSEnabled()) {
                    if (!bActionPeople && oPeople) {
                        oPeople.searchEnabled = oPeople.searchEnabled || bActionPeople;
                        oPeople.autoCompletionEnabled = false;
                    }
                } else {
                    if (bActionPeople) {
                        oActionPeople.searchEnabled = false;
                    }
                    if (oPeople) {
                        oPeople.searchEnabled = oPeople.searchEnabled || bActionPeople;
                        oPeople.autoCompletionEnabled = false;
                    }
                }
            }

            SUPPORTED_SEARCH_TYPES.forEach(function(sSearchType) {
                var oSearchConfig = oConfig[sSearchType];

                if (!oSearchConfig) {
                    if (sSearchType == 'JamGroup') {
                        var groupId = JamUtil.getDefaultGroupId();
                        oSearchConfig = $.extend({}, oConfig.Jam, {
                            groupId : groupId,
                            label : JamUtil.getDefaultGroupLabel(),
                            searchEnabled : groupId != null
                        });
                    } else {
                        oSearchConfig = {
                            searchEnabled : false
                        };
                    }
                }

                if (sSearchType == 'People' && oSearchConfig.searchEnabled && oConfig.ActionPeople && oConfig.ActionPeople.searchEnabled) {
                    oSearchConfig.searchEnabled = false;
                }

                if (oSearchConfig.searchEnabled) {
                    var bVisible = sSearchType != 'JamGroup' || !!oSearchConfig.groupId;

                    if (bVisible) {
                        nVisibleSearchTypes++;
                    }

                    aSearchTypeItems.push({
                        searchType : sSearchType,
                        label : oSearchConfig.label || SEARCH_CONFIG[sSearchType].label || '???',
                        visible : bVisible
                    });

                    if (oSearchConfig.selectedByDefault) {
                        sDefaultSearchType = sSearchType;
                    }
                }

                if (oSearchConfig.searchEnabled) {
                    bSearchEnabled = true;
                }

                oData[sSearchType] = oSearchConfig;
            });

            if (!sDefaultSearchType && aSearchTypeItems.length > 0) {
                sDefaultSearchType = aSearchTypeItems[0].searchType;
            }

            this.mDefaultSearchType = sDefaultSearchType;
            $.extend(oData, {
                searchEnabled : bSearchEnabled,
                externalSearchText : rb.getText('ACTIONSEARCH_Employee_Directory'),
                searchTypeItems : aSearchTypeItems,
                searchTypeVisible : nVisibleSearchTypes > 1
            });

            var oModel = oCore.getModel('universalSearch');

            if (oModel) {
                oModel.setData(oData);
            } else {
                oCore.setModel(new JSONModel(oData), 'universalSearch');
            }

            // Reset the search if some search is available
            if (bSearchEnabled) {
                this.resetSearch();
            }
        },

        /**
         * Called by Jam any time the Jam group information changes.
         */
        updateJamGroupSearchInfo : function() {
            this._initSearchTypeItems();
        },

        /**
         * Called when the search dialog is closed.
         */
        clearSearch : function() {
            var oModel = oCore.getModel('universalSearch');
            oModel.setProperty('/filter', '');
        },

        reset : function() {
            var oModel = oCore.getModel('universalSearch');
            var oAction = oModel.getProperty('/transitiveAction');
            oModel.setProperty('/filter', '');
            if (oAction != null) {
                this.resetSearch('ActionPeople');
            } else {
                this.resetSearch(oModel.getProperty('/searchType'));
            }
        },

        /**
         * Reset the search back to its original state.
         */
        resetSearch : function(sSearchType) {
            sSearchType = sSearchType || this.mDefaultSearchType;

            this.mSearchThrottle.abort();

            var oResults = oCore.byId('bizXSearchField');
            var oSearchConfig = SEARCH_CONFIG[sSearchType];
            var oModel = oCore.getModel('universalSearch');

            var sPlaceholder = oSearchConfig ? oSearchConfig.placeholder : "";

            var bTransitive = sSearchType ? (sSearchType.indexOf('Transitive') == 0) : false;

            if (sSearchType == 'JamGroup') {
                var sGroupName = oModel.getProperty('/JamGroup/label');
                sPlaceholder = jQuery.sap.formatMessage(sPlaceholder, [sGroupName]);
            }

            if (bTransitive) {
                var oTransitiveAction = oModel.getProperty('/transitiveAction');
                sPlaceholder = oTransitiveAction && oTransitiveAction.actionLabel;
            }

            var oSettings = {
                query : '',
                searchType : sSearchType,
                placeholder : sPlaceholder,
                tooltip : sPlaceholder,
                externalSearchVisible : false
            };

            if (!bTransitive) {
                $.extend(oSettings, {
                    transitiveAction : null
                });
            }

            for ( var sAttr in oSettings) {
                oModel.setProperty('/' + sAttr, oSettings[sAttr]);
            }

            this._showAllClicked = false;

            var iMinimumFilterLength = this.getMinimumFilterLength();
            var sMsgKey = {
                ActionPeople:'COMMON_ActionSearch_AutoComplete_A11y',
                Action:'COMMON_ActionSearch_AutoComplete_A11yActions',
                People:'COMMON_ActionSearch_AutoComplete_A11yPeople'
            }[sSearchType] || 'COMMON_ActionSearch_AutoComplete_A11yGeneric';
            var sA11yLabel = rb.getText(sMsgKey, [iMinimumFilterLength]);
            var sItemDescription = null;
            var bNoTransitiveAction = !oModel.getProperty('/transitiveAction');

            if (bNoTransitiveAction && oResults && oResults._oSuggest && oResults._oSuggest.isOpen() && this._hasResults && !this._quickcardFocused) {
                sItemDescription = sA11yLabel;
            }
            this._hasResults = false;

            oModel.setProperty('/a11yAnnouncement', sItemDescription);
            oModel.setProperty('/enableSuggestions', this.isAutoCompleteEnabled());
            oModel.setProperty('/enableExternalSearch', this.isExternalSearchEnabled());
            oModel.setProperty('/minimumFilterLength', iMinimumFilterLength);
            oModel.setProperty('/a11yLabel', sA11yLabel);

            if (bNoTransitiveAction && oResults) {
                oResults.removeAllSuggestionItems();

                var intro = oSearchConfig ? oSearchConfig.intro : null;
                if (intro) {
                    // Prepend action search accessibility instruction if enhanced keyboard navigation is enabled
                    if (A11yPreferences.isKeyboardOnlyNavigationEnabled()) {
                        intro = '<div class="globalActionSearchIntro actionSearchA11yInstruction">' + sA11yLabel + '</div>' + intro;
                    }
                    oModel.setProperty('/introSnippet', intro);
                    oResults.addSuggestionItem(this.mIntroItem);
                }
            }

            if (oResults && oResults._oSuggest) {
                oResults._oSuggest.setHighlightedExternalSearch(false);
            }
        },

        afterSuggestClose : function() {
            setTimeout($.proxy(function() {
                if (!this._quickcardFocused) {
                    this.getQuickcardHandler().hideActiveQuickcard();
                }
            }, this), 10);
        },

        /**
         * @return {boolean}
         */
        isExternalSearchEnabled : function() {
            var oModel = oCore.getModel('universalSearch');
            var sSearchType = oModel.getProperty('/searchType');
            // UI-10423 External search is allowed for either Jam or JamGroup
            return !this.isAutoCompleteEnabled() || (sSearchType && sSearchType.indexOf('Jam') == 0);
        },

        /**
         * @return {boolean}
         */
        isAutoCompleteEnabled : function() {
            var oModel = oCore.getModel('universalSearch');
            var sSearchType = oModel.getProperty('/searchType');

            // External search for ActionPeople is not yet supported
            if (sSearchType == 'ActionPeople' || oModel.getProperty('/transitiveAction')) {
                return true;
            }

            var oConfig = oModel.getProperty('/' + sSearchType);
            return oConfig && oConfig.autoCompletionEnabled;
        },

        /**
         * @return {Boolean}
         */
        isShowQuickcardOnSelect : function() {
            var oModel = oCore.getModel('universalSearch');
            var sSearchType = oModel.getProperty('/searchType');
            var oConfig = oModel.getProperty('/' + sSearchType);
            return oConfig && oConfig.showQuickcardOnSelect;
        },

        /**
         * The minimum number of characters required before the search will
         * return some results.
         *
         * @return {Integer}
         */
        getMinimumFilterLength : function() {
            var oModel = oCore.getModel('universalSearch');
            var sSearchType = oModel.getProperty('/searchType');
            if (oModel.getProperty('transitiveAction')) {
                sSearchType = 'ActionPeople';
            }
            var oConfig = oModel.getProperty('/' + sSearchType);
            // If allowOneCharQuery will be true for Chinese
            return (oConfig && oConfig.allowOneCharQuery) ? 1 : 2;
        },

        /**
         * Called in Mobile devices to open the search suggestion dialog after
         * clicking the search icon.
         */
        openSearchSuggestion : function() {
            if (this.isAutoCompleteEnabled()) {
                oCore.byId('bizXSearchField').suggest(true);
            } else {
                var that = this;
                var oSearchField = new BizXSearchField({
                    resetOnBlur : true,
                    showRefreshButton : true,
                    showSearchButton : false,
                    value : '{universalSearch>/filter}',
                    placeholder : '{universalSearch>/placeholder}',
                    tooltip : '{universalSearch>/tooltip}',
                    enableExternalSearch : true,
                    externalSearch : [ this.externalSearch, this ],
                    enableSuggestions : false,
                    showSearchType : '{universalSearch>/searchTypeVisible}',
                    pressSearchType : [ this.showSearchType, this ]
                });
                var oDialog = new Dialog('BizXSearchDialog-autocompleteDisabled', {
                    showHeader : false,
                    content : oSearchField,
                    afterOpen : function() {
                        oSearchField.focus();
                    },
                    afterClose : function() {
                        oDialog.destroy();
                    },
                    buttons : [
                        new sap.m.Button({
                            text : rb.getText('COMMON_Cancel'),
                            press : function() {
                                oDialog.close();
                            }
                        }),
                        new sap.m.Button({
                            text : rb.getText('COMMON_Ok'),
                            press : function() {
                                that.externalSearch();
                                oDialog.close();
                            }
                        })
                    ]
                });
                oDialog.setParent(this.getView());
                oDialog.open();
            }
        },

        /**
         * When the job picker button is pressed.
         */
        pressJobPicker : function(oEvent) {
        	var empDiffFlag = this.mModel.getProperty("/bEmploymentDifferentiatorsFlag");
        	var empDiffTextForSwitcherClass=empDiffFlag?'empDiffTextForSwitcher':'';
        	var supplementalIconForSwitcherClass=empDiffFlag?'supplementalIconForSwitcher':'';
        	this.showMenu(oEvent.getSource(), {
        		menuStyleClass : 'gaMenuItems',
        		from : 'end',
        		itemPath : 'pageHeader>/activeEmployments',
        		showArrow : true,
        		showIcons : true,
        		showHeader : true,
        		title : rb.getText('COMMON_Current_Employments'),
        		menuItemTemplate : new GlobalAssignmentMenuItem({
        			templateShareable : true,
        			icon : '{pageHeader>icon}',
        			label : '{pageHeader>label}',
        			url : '{pageHeader>url}',
        			onclick : '{pageHeader>onclick}',
        			secondaryText : {
        				parts : [ {
        					path : 'pageHeader>subtitle'
        				} ],
        				formatter : function(subTitleInfo) {
        					if(empDiffFlag){return "";}
        					return subTitleInfo;
        				}
        			} ,
        			tooltip:{
        				parts:[{path:'pageHeader>label'},{path:'pageHeader>assignmentTypeText'}],
        				formatter:function(a,b){
        					if(empDiffFlag){
        						if(b == undefined){return a;}
        						else{return a+" "+b;}
        					}
        					return null;
        				}
        			},
        			dimmedText : '{pageHeader>dimmedText}',
        			assignmentTypeText : '{pageHeader>assignmentTypeText}',
        			supplementalIcons : {
        				path : 'pageHeader>supplementalIcons',
        				template : new Icon({
        					templateShareable : true,
        					decorative : false,
        					src : '{pageHeader>src}',
        					tooltip : {
        						parts:[{path:'pageHeader>tooltip'}],
        						formatter:function(tooltipText){
        							if(empDiffFlag){return null;}
        							return tooltipText;
        						}
        					}

        				}).addStyleClass(supplementalIconForSwitcherClass)
        			}
        		}).addStyleClass(empDiffTextForSwitcherClass)
        	});

        },

        search : function(oEvent) {
            // external search will fire directly instead of going through search event
        },

        /**
         * Happens when you initiate a search.
         *
         * @param {Event} oEvent
         */
        searchSuggest : function(oEvent) {
            var oModel = oCore.getModel('universalSearch');
            var sSearchType = oModel.getProperty('/searchType');
            var oTransitiveAction = oModel.getProperty('/transitiveAction');
            var sQuery = oModel.getProperty('/filter');
            var oSearchField = oCore.byId('bizXSearchField');

            if (sSearchType == 'ActionPeople' && oTransitiveAction) {
                // TODO: finalize mapping with back-end for this mapping
                sSearchType = 'TransitiveAction';
                oModel.setProperty('/searchType', sSearchType);
            }

            // UI-10030 Copy the sfActionSearchBox.js trim query
            sQuery = sQuery && sQuery.trim();

            if (sQuery && sQuery.length >= oModel.getProperty('/minimumFilterLength')) {
                if (this.isAutoCompleteEnabled()) {
                    var oSearchResults = oCore.byId('surjTopNavSearchResults');
                    var sActionId = oTransitiveAction && oTransitiveAction.actionId;
                    var oCriteria = {
                        searchValue : sQuery,
                        maxresults : 10,
                        keys : PEOPLE_SEARCH_KEYS
                    };
                    if (sActionId) {
                        oCriteria.actionId = sActionId;
                        oCriteria.queryType = this._getTransitiveSearchType(oTransitiveAction);
                    }
                    if (sSearchType == 'JamGroup') {
                        oCriteria.groupId = JamUtil.getDefaultGroupId();
                    }
                    oModel.setProperty('/query', sQuery);
                    oModel.setProperty('/externalSearchVisible', false);
                    oSearchField.removeAllSuggestionItems();
                    this.mSearchThrottle.change(sSearchType, oCriteria);
                } else {
                    this.externalSearch();
                }
            } else if (!oTransitiveAction) {
                this.resetSearch(sSearchType);
            }

            // UI-9463 Clear any selection any time the search string changes
            oSearchField._oSuggest && oSearchField._oSuggest.setSelected(-1);
        },

        /**
         * @private
         * @return {String}
         */
        _getTransitiveSearchType : function(/*oTransitiveAction*/) {
            // at some point we might want transitive search on other types
            return 'people';
        },

        /**
        * @private
        * @param {object} config
        * @param {string} config.panel_title
        * @param {string} config.button_selector
        * @param {string} config.panel_type
        */
        _createCrossOriginSidePanel : function(config) {
            var panel_title = config.panel_title;
            var panel_type = config.panel_type;
            var button_selector = config.button_selector;
            var link_href = Util.ensureBaseDomain("/sf/home?" + SIDE_PANEL_PARAM + "=" + panel_type);
            var link_tooltip_rb;
            switch(panel_type) {
                case SIDE_PANEL_TYPE.todos:
                    link_tooltip_rb = "COMMON_CROSS_ORIGIN_Go_to_Todos";
                    break;
                case SIDE_PANEL_TYPE.notifications:
                    link_tooltip_rb = "COMMON_CROSS_ORIGIN_Go_to_Notifications";
                    break;
                default:
            }

            var view = this.getView();
            var self = this;
            return new Promise(function(res, rej) {
                sap.ui.require(['sap/m/MessagePage', 'sap/m/Button'], function(MessagePage, Button) {
                    var oSidePanel = new ResponsiveSidePanel({
                        top : self._getHeaderHeight(),
                        from: 'end',
                        refocusRef: oCore.byId(button_selector),
                        content: new MessagePage({
                            title: panel_title,
                            icon: "sap-icon://generate-shortcut",
                            text: "",
                            description: rb.getText("COMMON_FUTURE_Feature_Support"),
                            buttons: [
                                new Button({
                                    text: rb.getText("COMMON_Go_Now"),
                                    press: function(){ LinkUtil.handle({ url:link_href }) },
                                    tooltip: link_tooltip_rb ? rb.getText(link_tooltip_rb) : "",
                                })
                            ]
                        })
                    });
                    oSidePanel.setParent(view);
                    res(oSidePanel, rej);
                });
            });
        },

        _createSuggestionItem : function(sType, oItem, sSectionTitle, iActiveIndex, iTotalCount) {
            var oSuggestionItem = null;
            switch (sType) {
            case 'Jam':
                oSuggestionItem = new BizXSuggestionItem({
                    text : oItem.Name,
                    highlightedText : '{universalSearch>/query}'
                });
                var customCss = oItem.CssClass;
                if(customCss) {
                    //customCss is over imgUrl for Jam header for icon fonts
                    oSuggestionItem.setCustomCss(oItem.CssClass);
                } else {
                    oSuggestionItem.setIcon(oItem.ImgUrl);
                }
                break;
            case 'Action':
            case 'CopilotAction':
                oSuggestionItem = new BizXSuggestionItem({
                    text : oItem.actionLabel,
                    highlightedText : '{universalSearch>/query}'
                });
                break;
            case 'People':
                oSuggestionItem = new PeopleSuggestionItem({
                    user : oItem,
                    highlightedText : '{universalSearch>/query}',
                    enablePhoto : this._enablePhoto && oItem.photoViewable
                });
                break;
            case 'showMore':
                var sMsg;
                var iMoreCount = oItem.totalCount - oItem.items.length;
                switch (oItem.type) {
                case 'People':
                    sMsg = iMoreCount > 100 ?
                        rb.getText('COMMON_Show_100_more_people') :
                        rb.getText('COMMON_Show_x_more_people', iMoreCount);
                    break;
                case 'Action':
                case 'CopilotAction':
                    sMsg = iMoreCount > 100 ?
                        rb.getText('COMMON_Show_100_more_actions') :
                        rb.getText('COMMON_Show_x_more_actions', iMoreCount);
                    break;
                }
                oSuggestionItem = new ShowMoreSuggestionItem({
                    text : sMsg
                });
                break;
            }
            if (oSuggestionItem.setSectionTitle) {
                oSuggestionItem.setSectionTitle(sSectionTitle);
            }
            if (oSuggestionItem) {
                oSuggestionItem.__itemType = sType;
                oSuggestionItem.__item = oItem;
                oSuggestionItem.__activeIndex = iActiveIndex;
                oSuggestionItem.__totalCount = iTotalCount;
            }
            return oSuggestionItem;
        },

        showSearchResultPage : function(oEvent) {
            /*
             * { criteria : Object, totalCount : int, hasMore : boolean, items :
             * Array, moreAvailable : boolean }
             */
            var oParameters = this.oSearchResultsParams = oEvent.getParameters();
            var aItems = oParameters.items;
            var oModel = oCore.getModel('universalSearch');
            var that = this;
            var oSearchField = oCore.byId('bizXSearchField');
            var iItemOffset = oParameters.itemOffset;
            var bHasPeople = false;

            var enablePhoto = $('#autocomplete\\.enablePhotoForActionSearchAndQuickcard');
            if (enablePhoto.length > 0) {
                this._enablePhoto = (enablePhoto.attr('content') != 'false');
            } else {
                var pageHeaderJsonData = window.pageHeaderJsonData;
                var settings = pageHeaderJsonData && pageHeaderJsonData.settings;
                // Default is true if not specified
                this._enablePhoto = !settings || settings['autocomplete.enablePhotoForActionSearchAndQuickcard'] !== 'false';
            }

            $.each(aItems, function(i, oItem) {
                if (oItem.items) {
                    var sSectionTitle = SECTION_TITLES[oItem.type];
                    $.each(oItem.items, function(j, oSubItem) {
                        var iActiveIndex = iItemOffset + j;
                        var sType = oItem.type;
                        if (sType == 'People') {
                            bHasPeople = true;
                        }
                        oSearchField.addSuggestionItem(that._createSuggestionItem(sType, oSubItem, j == 0 ? sSectionTitle : null, iActiveIndex, oItem.totalCount));
                    });
                    if (oItem.hasMore) {
                        oSearchField.addSuggestionItem(that._createSuggestionItem('showMore', oItem, null));
                    }
                } else {
                    var iActiveIndex = iItemOffset + i;
                    var sType = oParameters.type;
                    if (sType == 'People') {
                        bHasPeople = true;
                    }
                    oSearchField.addSuggestionItem(that._createSuggestionItem(sType, oItem, null, iActiveIndex, oParameters.totalCount));
                }
            });
            var sSearchType = oModel.getProperty('/searchType');
            var bExternalSearchVisible = sSearchType.indexOf('People') >= 0 && bHasPeople;
            if (aItems.length == 0 && oParameters.first) {
                oSearchField.addSuggestionItem(this.mNoResultItem);
            }
            oModel.setProperty('/externalSearchVisible', bExternalSearchVisible);
            oSearchField.suggest(true);

            var oTransitiveAction = oModel.getProperty('/transitiveAction');
            var sItemDescription = null;
            var oResponse = oParameters.response;
            var bNoResults = false;
            if (oResponse && oResponse.showingMore) {
                var sItemDescription = rb.getText({
                    People:'COMMON_GlobalSearch_Announcement_Showing_More_People',
                    Action:'COMMON_GlobalSearch_Announcement_Showing_More_Actions',
                    CopilotAction:'COMMON_GlobalSearch_Announcement_Showing_More_CopilotActions',
                }[oParameters.type] || 'COMMON_GlobalSearch_Announcement_Showing_More_Items', [oParameters.totalCount]);
                sItemDescription = rb.getText('COMMON_GlobalSearch_Count_Summary', [sItemDescription]);
                oModel.setProperty('/a11yAnnouncement', sItemDescription);
                setTimeout(function() {
                    var list = oSearchField._oSuggest.getList();
                    if (list) {
                        list.selectByIndex(oResponse.items.length - 1, false);
                    }
                }, 100);
            } else if (oParameters.first) {
                var iItemCount = oParameters.totalCount;
                if (iItemCount == undefined) {
                    var oCountLabels = {};
                    iItemCount = 0;
                    $.each(aItems, function(i, oItem) {
                        var type = oItem.type;
                        var itemTotal = oItem.totalCount;
                        var displayCount = oItem.items && oItem.items.length;
                        iItemCount += itemTotal;
                        oCountLabels[oItem.type] = rb.getText('COMMON_GlobalSearch_Announcement_' +type + (displayCount == 1 ? '_Singular' : '_Plural') + (itemTotal > displayCount ? '_Limited' : ''),
                            [itemTotal, displayCount]);
                    });
                    if (iItemCount == 0) {
                        sItemDescription = rb.getText('COMMON_GlobalSearch_Announcement_NoResults');
                        bNoResults = true;
                    } else if (oParameters.type == 'ActionPeople') {
                        sItemDescription = (oCountLabels.CopilotAction ? rb.getText('COMMON_GlobalSearch_Announcement_ActionCopilotPeople', [oCountLabels.Action, oCountLabels.CopilotAction, oCountLabels.People]) : 
                                            rb.getText('COMMON_GlobalSearch_Announcement_ActionPeople', [oCountLabels.Action, oCountLabels.People]));
                    } else {
                        sItemDescription = rb.getText('COMMON_ComboBox_Aria_Item_Count_Announcement', [iItemCount]);
                    }
                } else if (iItemCount > 0) {
                    var msgKey = {
                        People:'COMMON_GlobalSearch_Announcement_People',
                        Action:'COMMON_GlobalSearch_Announcement_Action',
                        CopilotAction:'COMMON_GlobalSearch_Announcement_CopilotAction'
                    }[oParameters.type];
                    if (msgKey) {
                        msgKey += iItemCount == 1 ? '_Singular' : '_Plural';
                    }
                    sItemDescription = rb.getText(msgKey || 'COMMON_ComboBox_Aria_Item_Count_Announcement', [iItemCount]);
                    if (oTransitiveAction) {
                        sItemDescription = this._getTransitiveSearchType(oTransitiveAction) == 'people' ?
                            rb.getText('COMMON_GlobalSearch_Announcement_Transitive_Action_Person', [sItemDescription, oTransitiveAction.actionLabel]) :
                            rb.getText('COMMON_GlobalSearch_Announcement_Transitive_Action', [sItemDescription, oTransitiveAction.actionLabel]);
                    } else {
                        sItemDescription = rb.getText('COMMON_GlobalSearch_Count_Summary', [sItemDescription]);
                    }
                } else {
                    sItemDescription = rb.getText('COMMON_GlobalSearch_Announcement_NoResults');
                    bNoResults = true;
                }
            }

            if (sItemDescription) {
                oModel.setProperty('/a11yAnnouncement', sItemDescription);
            }

            // TODO: Find a better way to do this
            if (!bNoResults) {
                this._hasResults = true;
                setTimeout(function() {
                    if (oSearchField._oSuggest) {
                        var oList = oSearchField._oSuggest.getList();
                        if (oList) {
                            var oEl = oList.$().find('.bizXSuggestionItem');
                            oEl.unbind('mouseenter', that._mouseEnterSuggestion);
                            oEl.bind('mouseenter', that._mouseEnterSuggestion);
                            oEl.unbind('mouseleave', that._mouseLeaveSuggestion);
                            oEl.bind('mouseleave', that._mouseLeaveSuggestion);
                        }
                    }
                }, 100);
            }

            if (oParameters.hasMore) {
                setTimeout(function() {
                    that._checkScroll();
                }, 100);
            }
        },

        /**
         * @return {sap.sf.surj.shell.QuickcardHandler}
         */
        getQuickcardHandler : function() {
            if (!this._quickcardHandler) {
                this._quickcardHandler = new QuickcardHandler();
            }
            return this._quickcardHandler;
        },

        /**
         * When the user presses Ctrl+Shift+1
         */
        focusQuickcard : function(oEvent) {
            this._quickcardFocused = true;
            var oSearchField = (oEvent && oEvent.getSource()) || oCore.byId('bizXSearchField');
            var that = this;
            var quickcardHandler = this.getQuickcardHandler();
            function hiddenCallback() {
                that._quickcardFocused = false;
                quickcardHandler.removeQuickcardHiddenCallback(hiddenCallback);
                oSearchField.focus();
            }
            quickcardHandler.addQuickcardHiddenCallback(hiddenCallback);
            quickcardHandler.focusQuickcard();
        },

        highlightExternalSearch : function() {
            var oModel = oCore.getModel('universalSearch');
            oModel.setProperty('/a11yAnnouncement', rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_Directory_Search'));
            this.getQuickcardHandler().hideActiveQuickcard();
        },

        /**
         * @param {Object} oConfig
         * @param {sap.m.SuggestionItem} oConfig.suggestionItem
         * @param {Integer} oConfig.itemIndex
         */
        quickcardRequest : function(oConfig) {
            if (oConfig && oConfig.getParameters) {
                oConfig = oConfig.getParameters();
            }
            // We do not support quickcard request on phone
            if (!Device.system.phone) {
                // These are "private private" so 2 underscores
                // So, they are set by this controller itself
                var oSuggestionItem = oConfig.suggestionItem;
                var sType = oSuggestionItem.__itemType;
                var oItem = oSuggestionItem.__item;
                var iActiveIndex = oSuggestionItem.__activeIndex;
                var iTotalCount = oSuggestionItem.__totalCount;

                if (!oConfig.noAnnouncement) {
                    var oModel = oCore.getModel('universalSearch');
                    oModel.setProperty('/a11yAnnouncement', '');
                    var oTransitiveAction = oModel.getProperty('/transitiveAction');
                    var bPerson = sType == 'People';
                    var sItemDescription, sEnterActionDescription, sA11yAnnouncement;

                    // Item Description: Describes the item being selected.
                    if (oSuggestionItem.getA11yAnnouncement) {
                        sItemDescription = oSuggestionItem.getA11yAnnouncement();
                    }

                    if (!sItemDescription) {
                        sItemDescription = oSuggestionItem.getSuggestionText();
                    }

                    // Enter Action Description: Describes what happens when the user presses the enter key
                    if (oTransitiveAction) {
                        var aVariables = [oTransitiveAction.actionLabel];
                        sEnterActionDescription = bPerson ?
                            rb.getText('COMMON_GlobalSearch_Announcement_Select_Transitive_Person', aVariables) :
                            rb.getText('COMMON_GlobalSearch_Announcement_Select_Transitive', aVariables);
                    } else if (sType == 'showMore') {
                        sEnterActionDescription = {
                            Person: rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_Show_All_People'),
                            Action: rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_Show_All_Actions'),
                            CopilotAction: rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_Show_All_CopilotActions')
                        }[oItem.type] || rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_Show_All_Items');
                    } else {
                        sEnterActionDescription = {
                            People: rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_Person'),
                            Action: rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_Action'),
                            CopilotAction: rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_CopilotAction')
                        }[sType] || rb.getText('COMMON_GlobalSearch_Announcement_Press_Enter_Item');
                    }

                    if (sType == 'showMore') {
                        // For Show More items, the announcement is the description
                        sA11yAnnouncement = rb.getText('COMMON_GlobalSearch_Announcement_Selected_ShowMore', [sItemDescription, sEnterActionDescription]);
                    } else {
                        // {item description}. Selected {object type} {active index} of {total count}. {enter action description}
                        var aVariables = [sItemDescription, iActiveIndex+1, iTotalCount, sEnterActionDescription];
                        sA11yAnnouncement = {
                            People: rb.getText('COMMON_GlobalSearch_Announcement_Selected_Person', aVariables),
                            Action: rb.getText('COMMON_GlobalSearch_Announcement_Selected_Action', aVariables),
                            CopilotAction: rb.getText('COMMON_GlobalSearch_Announcement_Selected_CopilotAction', aVariables)
                        }[sType] || rb.getText('COMMON_GlobalSearch_Announcement_Selected_Item', aVariables);
                    }

                    oModel.setProperty('/a11yAnnouncement', sA11yAnnouncement);
                }
                return this.getQuickcardHandler().showQuickcardForSuggestion({
                    type : sType,
                    item : oItem,
                    suggestionItem : oSuggestionItem,
                    itemIndex : oConfig.itemIndex,
                    origin : oConfig.origin,
                    immediate : oConfig.immediate,
                    fromHeader : true,
                    a11yAnnouncements : oConfig.noAnnouncement ? null : {
                        focused : rb.getText('COMMON_GlobalSearch_Announcement_Quickcard_Focused'),
                        available : rb.getText('COMMON_GlobalSearch_Announcement_Quickcard_Available')
                    }
                });
            }
            return $.Deferred().reject();
        },

        /**
         * @private
         */
        _mouseEnterSuggestion : function(oEvent) {
            var oTarget = oEvent.currentTarget;
            var oSuggestionItem = oCore.byId(oTarget.id);
            var that = this;
            if (this.mQuickcardRequest) {
                this.mQuickcardRequest.cancel();
            }
            this.mQuickcardRequest = this.quickcardRequest({
                suggestionItem : oSuggestionItem,
                noAnnouncement : true // don't announce quickcard for mouse
            }).always(function() {
                that.mQuickcardRequest = null;
            });
        },

        /**
         * @private
         */
        _mouseLeaveSuggestion : function(oEvent) {
            this.mQuickcardRequest && this.mQuickcardRequest.cancel();
        },

        _checkScroll : function() {
            if (this._isScrolledBottom()) {
                this.mSearchThrottle.more();
            }
        },

        /**
         * @private
         */
        _isScrolledBottom : function() {
            if (this._oScrollDelegate) {
                var iScrollTop = this._oScrollDelegate.getScrollTop();
                var iMaxScrollTop = this._oScrollDelegate.getMaxScrollTop();
                return iMaxScrollTop - iScrollTop < SCROLL_THRESHOLD;
            }
            return false;
        },

        setSearchScrollDelegate : function(oEvent) {
            var oScroller = oEvent.getParameter('scrollDelegate');
            this._oScrollDelegate = oScroller;
            oScroller.setGrowingList($.proxy(this._checkScroll, this));
        },

        showSearchError : function(oEvent) {
            var oModel = oCore.getModel('universalSearch');
            var oResults = oCore.byId('bizXSearchField');
            var sErrorMessage = rb.getText('COMMON_AJAX_DEFAULT_ERROR');
            var oParams = oEvent.getParameters();
            var oResponse = oParams && oParams.response;
            if (oResponse && typeof oResponse != 'string' && typeof oResponse[0] == 'string') {

                //If we know it is an session related Unauthorized odata error, let's give a more friendly error message
                if (oResponse[1] && oResponse[1].statusText == "Unauthorized") {
                    oResponse = msgs.COMMON_SESSION_EXPIRED_MESSAGE_DETAILS || rb.getText('COMMON_SESSION_EXPIRED_MESSAGE_DETAILS');
                } else {
                    oResponse = oResponse[0];
                }
            }
            if (typeof oResponse == 'string') {
                sErrorMessage = oResponse;
            }
            oModel.setProperty('/introSnippet', '<div class="noSearchResults">' + sErrorMessage + '</div>');
            oResults.addSuggestionItem(this.mIntroItem);
            oResults.suggest(true);
        },

        showSearchPending : function(oEvent) {
            var oModel = oCore.getModel('universalSearch');
            var bPending = oEvent.getParameter('pending');
            LOG.info('GlobalSearch pending: ' + bPending);
            oModel.setProperty('/pending', bPending);
        },

        /**
         * Initiate an external search.
         *
         * @public
         */
        externalSearch : function() {
            var oModel = oCore.getModel('universalSearch');
            var sQuery = oModel.getProperty('/filter');
            if (sQuery && sQuery.length > 1) {
                var sSearchType = oModel.getProperty('/searchType');
                var oCriteria = {
                    searchValue : sQuery
                };
                if (sSearchType == 'ActionPeople') {
                    sSearchType = 'People';
                }
                if (sSearchType == 'JamGroup') {
                    oCriteria.groupId = JamUtil.getDefaultGroupId();
                }
                SearchUtil.externalSearch(sSearchType, oCriteria);
            }
        },

        /**
         * When pressing a search type item from the drop down.
         *
         * @param {Event} oEvent
         */
        selectSearchTypeItem : function(oEvent) {
            var oListItem = oEvent.getSource();
            var sSearchType = oListItem.getBindingContext('universalSearch').getProperty('searchType');
            this.resetSearch(sSearchType);
        },

        /**
         * Called when you select an item from the search results.
         *
         * @param {Event} oEvent
         */
        selectSuggestItem : function(oEvent) {
            var that = this;
            var oSuggestionItem = oEvent.getParameter('selectedItem');
            var sType = oSuggestionItem.__itemType;
            var oItem = oSuggestionItem.__item;
            var iActiveIndex = oSuggestionItem.__activeIndex;
            if (oItem) {
                var oModel = oCore.getModel('universalSearch');
                var oSearchField = oCore.byId('bizXSearchField');
                if (sType == 'showMore') {
                    this._showAllClicked = true;
                    oSearchField.removeAllSuggestionItems();
                    // UI-9985 remove the external search during this transition, also reset the filter to the last query text
                    oModel.setProperty('/externalSearchVisible', false);
                    oModel.setProperty('/filter', oModel.getProperty('/query'));
                    this.mSearchThrottle.change(function() {
                        return $.Deferred().resolve($.extend({
                            showingMore: true
                        }, oItem));
                    }, {
                        searchValue : oModel.getProperty('/query')
                    });
                } else if (sType == 'Jam') {
                    window.location.href = oItem.Href;
                } else {
                    var oTransitiveAction = oModel.getProperty('/transitiveAction');
                    var oSubject = null;
                    if (oTransitiveAction) {
                        sType = 'Action';
                        oSubject = oItem;
                        oItem = oTransitiveAction;
                    }
                    if (sType == 'Action' && oItem.transitive && !oSubject) {
                        oModel.setProperty('/searchType', 'TransitiveAction');
                        oModel.setProperty('/transitiveAction', oItem);
                        oModel.setProperty('/filter', '');
                        oModel.setProperty('/placeholder', '');
                        oSearchField.removeAllSuggestionItems();
                        oSearchField.focus();
                    } else {
                        var iTotalCount = this.oSearchResultsParams.totalCount;
                        if (this.oSearchResultsParams.type == 'ActionPeople') {
                            var aItems = this.oSearchResultsParams.items;
                            $.each(aItems, function(i, oItem) {
                                if (oItem.type === sType) {
                                    iTotalCount = oItem.totalCount;
                                    return false;
                                }
                            });
                        }
                        if (this.isShowQuickcardOnSelect() && sType == 'People') {
                            this.quickcardRequest({
                                suggestionItem : oSuggestionItem,
                                immediate : true
                            }).done(function() {
                                that.focusQuickcard();
                            });
                        } else {
                            oSearchField.suggest(false);
                            SearchUtil.selectItem(sType, {
                                item : oItem,
                                subject : oSubject,
                                criteria : this.oSearchResultsParams.criteria,
                                totalCount : iTotalCount,
                                showAllClicked : this._showAllClicked,
                                activateIndex : iActiveIndex,
                                actionArgs: oItem.actionArgs
                            });
                        }
                    }
                }
            }
        },

        /**
         * Handle a navigate action from the view. Examples: Clicking on a
         * module, sub tab, or search result.
         *
         * @param {sap.ui.core.Event} oEvent
         */
        navigate : function(oEvent) {
            var oSource = oEvent.getSource();
            if (oSource instanceof sap.m.SelectList || oSource instanceof sap.m.List) {
                oSource = oSource.getSelectedItem();
            }
            var oLink = oSource.getBindingContext('pageHeader').getObject();
            if (oLink.id == 'TODO_ACTION') {
                this.showTodoPanel();
            } else {
                LinkUtil.handle(oLink);
            }
        },

        navigateToHome : function() {
            var oModule = this.mModel.getProperty('/homeModule');
            if (oModule) {
                LinkUtil.handle(oModule);
            }
        },

        /**
         * Using the globalLogoPositionRevealer, determine how the Company Logo
         * should be aligned.
         */
        getCompanyLogoAlignment : function() {
            var oRevealer = $('<div id="globalLogoPositionRevealer"></div>').appendTo('body');
            var sRevealerValue = oRevealer.css('left');
            oRevealer.remove();
            if (this._isFiori3HeaderEnabled() && sRevealerValue == '0px') {
                sRevealerValue = '-1px';
            }
            return {
                '-1px' : 'Left',
                '0px' : 'Middle',
                '1px' : 'Right'
            }[sRevealerValue];
        },

        detectThemeChanges : function() {
            var oCompanyLogo = oCore.byId('bizXHeaderCompanyLogo');
            var oCustomHeader = oCore.byId('bizXShellCustomHeader');
            this.insertCompanyLogo(oCustomHeader, oCompanyLogo);
        },

        insertCompanyLogo : function(oCustomHeader, oCompanyLogo) {
            switch (this.getCompanyLogoAlignment()) {
            case 'Middle':
                oCustomHeader.addContentMiddle(oCompanyLogo);
                break;
            case 'Left':
                oCustomHeader.insertContentLeft(oCompanyLogo, 0);
                break;
            default:
                oCustomHeader.addContentRight(oCompanyLogo);
                break;
            }
        },

        /**
         * This will make the ajax call to fetch the jam notification and update
         * the model with the data.
         *
         * @private
         */
        _initJamNotificationCount : function() {
            var oModel = new JSONModel();
            var bJamEnabled = JamUtil.isEnabled();
            var bJamActionItem = false;// Device.system.phone;
            oModel.setProperty('/visible', bJamEnabled && !bJamActionItem);
            if (bJamEnabled) {
                JamUtil.getNotificationCount().progress(function(nCount) {
                    // nCount will always be number with JamUtil
                    oModel.setProperty('/newCount', nCount);
                });
            }
            oCore.setModel(oModel, 'jamNotification');
        },

        _initGlobalNotificationCount : function() {
            var oThis = this;
            
            sap.ui.require(['sap/sf/notification/util/Util'], function (NotificationUtil) {
                if (!NotificationUtil) {
                    jQuery.sap.log.error('Cannot load NotificationUtil.');
                    return;
                }
                
                var oModel = NotificationUtil.getNotificationModel();
                var bNotificationEnabled = NotificationUtil.isNotificationEnabled();

                oModel.setProperty('/visible', bNotificationEnabled);

                if (bNotificationEnabled) {
                    NotificationUtil.getGlobalCount().done(function (count) {
                        oModel.setProperty('/newCount', count);
                        oThis._initJamNotificationCount();
                    });
                } else {
                    oThis._initJamNotificationCount();
                }
            }, function (e) {
                jQuery.sap.log.error('Cannot load notification ui5 module.', e);
            });
        },

        /**
         * In case the page would like to disable the notification button click. Jam does this to override the
         * display of the notification panel for its own thing.
         * @public
         */
        disableGlobalNotificationButtonClick : function() {
            this._overrideGlobalNotificationClick = true;
        },

        /**
         * @public
         */
        toggleGlobalNotificationPanel : function() {
            if (!this._hasGlobalNotificationClickBeenOverridden()) {
                if (Util.isRunningBaseDomain() || Util.isBaseDomainCORSEnabled()) {
                    sap.ui.require(['sap/sf/notification/util/Util'], function (NotificationUtil) {
                        NotificationUtil.togglePanel();
                    });
                }
            }
            var oNotificationButton = oCore.byId('current-user-notification-count');
            if(oNotificationButton) {
                oNotificationButton.$().attr('aria-expanded', true);
            }
        },

        /**
         * @private
         * @return {Boolean} true if Jam has overridden the notification onclick
         */
        _hasGlobalNotificationClickBeenOverridden : function() {
            // Check if Jam has called the function to disable the notification button click
            if (this._overrideGlobalNotificationClick) {
                return true;
            }

            // Jam may have overridden it manually by overwriting onclick to be "return false"
            var oOverriddenIndicator = $('#current-user-notification-count').find('[onclick]');
            if (oOverriddenIndicator.length > 0) {
                var onclick = oOverriddenIndicator.attr('onclick');
                // Just in case onclick is a function, use toString to convert it to string
                onclick = onclick && onclick.toString();
                if (onclick.indexOf('return false') >= 0) {
                    return true;
                }
            }
            return false;
        },

        /**
         * @param {Event} oEvent
         */
        showModulePicker : function(oEvent) {
            this.showMenuOrSidePanel(oEvent.getSource(), {
                menuStyleClass : 'moduleDropDownPopup',
                from : 'begin',
                itemPath : 'pageHeader>/modules',
                sidePanelItemTemplate : new sap.m.StandardListItem({
                    icon : '{pageHeader>icon}',
                    title : '{pageHeader>label}'
                }).addStyleClass('globalMenuItem'),
                menuItemTemplate : new BizXMenuListItem({
                    label : '{pageHeader>label}',
                    url : '{pageHeader>url}',
                    onclick : '{pageHeader>onclick}',
                    target :  {
                        parts : [ {
                            path : 'pageHeader>newWindow'
                        } ],
                        formatter : function(bNewWindow) {
                            return bNewWindow == true ? "_blank" : null;
                        }
                    }
                }) /* UI-10079 onclick has moved to showMenu function. */
            });
        },

        /**
         * @param {Event} oEvent
         */
        showUtilityLinks : function(oEvent) {
            var aLinks = this.mModel.getProperty('/actionLinks');
            if (aLinks == null || aLinks.length == 0) {
                return;
            }
            var oBtn = oEvent.getSource();
            var isFiori3HeaderEnabled = this._isFiori3HeaderEnabled();
            var oMenuItemTemplateConfig = {
                label : '{pageHeader>label}',
                url : '{pageHeader>url}',
                onclick : '{pageHeader>onclick}',
                target : '{pageHeader>target}',
                visible : {
                    parts : [ {
                        path : 'pageHeader>visible'
                    } ],
                    formatter : function(bVisible) {
                        return bVisible !== false;
                    }
                }
            };
            if (isFiori3HeaderEnabled) {
                oMenuItemTemplateConfig.icon = '{pageHeader>icon}';
            }
            this.showMenuOrSidePanel(oBtn, {
                showArrow: isFiori3HeaderEnabled,
                showHeader: isFiori3HeaderEnabled,
                header : '{pageHeader>/userTopNav/fullName}',
                from : 'end',
                itemPath : 'pageHeader>/actionLinks',
                contentMinWidth : oBtn.$().width() + 'px',
                sidePanelItemTemplate : new sap.m.StandardListItem({
                    icon : '{pageHeader>icon}',
                    title : '{pageHeader>label}',
                    description : '{pageHeader>dimmedText} ',
                    info : '{pageHeader>assignment}',
                    visible : {
                        parts : [ {
                            path : 'pageHeader>visible'
                        } ],
                        formatter : function(bVisible) {
                            return bVisible !== false;
                        }
                    }
                }).addStyleClass('globalMenuItem').addEventDelegate({
                    onAfterRendering : function(evt) {
                        var ctl = evt.srcControl;
                        var cssClass = ctl.getProperty('info');
                        ctl.addStyleClass(cssClass);
                    }
                }),
                menuItemTemplate : new BizXMenuListItem(oMenuItemTemplateConfig),
                menuStyleClass: 'utilityLinksMenuPopover'
            });
        },

        /**
         * @public
         */
        updateUtilityLinkVisibility : function(utilityLinkId, visibility) {
            var aActionLinks = this.mModel.getProperty('/actionLinks');
            aActionLinks && aActionLinks.forEach(function(oActionLinks) {
                if (oActionLinks.id === utilityLinkId) {
                    oActionLinks.visible = visibility;
                }
            });
        },


        /**
         * @param {Event} oEvent
         */
        showSearchType : function(oEvent) {
            var oSearchField = oEvent.getSource();
            this.showMenu(oSearchField, {
                from : 'end',
                itemPath : 'universalSearch>/searchTypeItems',
                listItemTemplate : new BizXMenuListItem({
                    type : 'Active',
                    label : '{universalSearch>label}',
                    press : [ this.selectSearchTypeItem, this ]
                })
            });
        },

        /**
         * @param {sap.ui.core.Control} oSource
         * @param {Object} config
         */
        showMenu : function(oSource, oConfig) {
            var sId = oSource.getId() + '-menuPopover';
            var oPopover = oCore.byId(sId);
            if (!oPopover) {
                var oItemTemplate = oConfig.menuItemTemplate || oConfig.listItemTemplate;
                oItemTemplate.addEventDelegate({
                    onclick: function(oEvent) {
                        // UI-10017 delay the popover closing
                        // I suspect the popover closing interrupts the item's Action
                        // But it only happens on the iPad when it is NOT being debugged by Safari Developer Tools
                        var iCloseTimeout = 100;
                        setTimeout(function() {
                            oPopover.close();
                        }, iCloseTimeout);
                    },
                    ontap : function(oEvent) {
                        return false;
                    }
                });
                oPopover = new BizXMenuPopover(sId, {
                    from : oConfig.from,
                    title : oConfig.header,
                    showHeader : !!oConfig.showHeader,
                    showArrow : !!oConfig.showArrow,
                    placement : oConfig.placement || 'Bottom',
                    beforeOpen : function() {
                        var $source = oSource.$();
                        $source.children('.sapMBtnInner').addClass('globalModulePickerActive');
                        $source.attr('aria-expanded', 'true');
                        oSource.addStyleClass('bizXMenuShown');
                        oConfig.beforeOpen && oConfig.beforeOpen.apply(oConfig, arguments);
                    },
                    afterClose : function() {
                        setTimeout(function() {
                            var $source = oSource.$();
                            $source.children('.sapMBtnInner').removeClass('globalModulePickerActive');
                            oSource.removeStyleClass('bizXMenuShown');
                            $source.attr('aria-expanded', 'false');
                            $('#customHeaderModulePickerBtn').attr('aria-expanded', false);
                        }, 100);
                        oConfig.afterClose && oConfig.afterClose.apply(oConfig, arguments);
                    },
                    content : new sap.m.List({
                        backgroundDesign : 'Transparent',
                        // UI-10017 Popover closing moved to itemTemplate eventDelegate
                        //itemPress : function() {
                        //    setTimeout(function() {
                        //        oPopover.close();
                        //    }, 100);
                        //},
                        items : {
                            path : oConfig.itemPath,
                            template : oItemTemplate
                        }
                    })
                });
                oPopover.addStyleClass('globalHumanistText');
                if (oConfig.menuStyleClass) {
                    oPopover.addStyleClass(oConfig.menuStyleClass);
                }
                oPopover.setParent(this.getView());
            }

            if (oPopover.isOpen() || oSource.hasStyleClass('bizXMenuShown')) {
                oPopover.close();
            } else {
                oPopover.openBy(oSource);
            }
        },

        showSidePanel : function(oSource, oConfig) {
            var sId = oSource.getId() + '-sidePanel';
            var oSidePanel = oCore.byId(sId);
            if (!oSidePanel) {
                var oScrollContainer = new sap.m.ScrollContainer({
                    vertical : true,
                    horizontal : false,
                    width : '100%',
                    height : '100%'
                });
                var oList = new sap.m.List({
                    backgroundDesign : 'Transparent',
                    headerText : oConfig.header,
                    mode : 'SingleSelectMaster',
                    select : [ function(oEvent) {
                        oSidePanel.hide();
                        this.navigate(oEvent);
                        // to reselect same item when not navigating away
                        oList.removeSelections();
                    }, this ],
                    items : {
                        path : oConfig.itemPath,
                        template : oConfig.sidePanelItemTemplate
                    }
                }).addStyleClass('globalMenu');
                oList.addEventDelegate({
                    onAfterRendering: function () {
                        $('#' + this.getId()).find(':not(:has(*))').addClass('leaf');
                    }
                }, oList);
                oScrollContainer.addContent(oList);
                oSidePanel = new ResponsiveSidePanel(sId, {
                    top : this._getHeaderHeight(),
                    from : oConfig.from,
                    content : oScrollContainer
                }).addStyleClass('bizxHeaderSidePanel');
                oSidePanel.setParent(this.getView());
            }
            if (oSidePanel.isShown()) {
                oSidePanel.hide();
            } else {
                oSidePanel.show();
            }
        },

        showMenuOrSidePanel : function(oSource, oConfig) {
            var bUseSidePanel = $('html').hasClass('sapUiMedia-StdExt-Phone');
            this[bUseSidePanel ? 'showSidePanel' : 'showMenu'](oSource, oConfig);
        },

        pressProductSwitcher : function(oEvent) {
            if (!this._fragPromise) {
                this._fragPromise = Promise.all([Fragment.load({
                    name: "sap.sf.surj.shell.fragments.ProductSwitcher",
                    controller: this
                }), this.getSapProducts()]).then(function(values) {
                    //values[0] is the instance of ProductSwticher fragment, values[1] is the list of products
                    return values[0].setModel(new JSONModel({
                        products: values[1]
                    }));
                });
            }
            var oSource = oEvent.getSource();
            this._fragPromise.then(function(oFragment) {
                oFragment.isOpen() ? oFragment.close() : oFragment.openBy(oSource);
            }).catch(function (oReason) {
                LOG.error(oReason);
                sap.ui.require(['sap/m/MessageBox'], function(MessageBox) {
                    MessageBox.error(rb.getText('COMMON_AJAX_DEFAULT_ERROR'));
                });
            });
        },

        /**
         * @return {Promise.<Array.<Object>>} A promise for the products
         */
        getSapProducts : function() {
            var oStorage = this.getSessionStorage();
            var aProducts = oStorage && oStorage.get('SapProducts-' + this.mModel.getProperty('/userLocale'));
            if (aProducts) {
                return Promise.resolve(aProducts);
            }
            return new Promise(function(res, rej) {
                DeferredUtil.invokeODataService({
                    baseUrl: '/odata/v2/restricted/_PageMetaData_/',
                    serviceName: 'getSapProducts'
                }).then(function(oResponse) {
                    res(oResponse.SapProducts.products.results);
                }, rej);
            });
        },

        openURL: function (url) {
            if (url && url.trim() !== '') {
                sap.m.URLHelper.redirect(url, true);
            }
        },

        /**
         * @private
         */
        _initShowMe : function() {
            ShowMeUtil.init();
        },

        _initDialogPosFix : function() {
            // WEF-1221: HCP platform customers have the ability to use the latest UI5 version. Versions 1.71.16 and greater
            // have a major change where the dialog is positioned fixed vs the old way of positioning absolute.
            // There is an issue when our current version is less than 1.71.16, the dialog will use translate:transform(x,y,z) on top of the new JS calculations,
            // which will move the dialog out of the center and in some cases unreachable and unusable for the end user.
            // We can feature detect if the dialog has the fix and if so, add a special class to the body, so this way we can override the conflicting behavior.
            // For details of the UI5 change, please see: https://git.wdf.sap.corp:8080/c/openui5/+/4712866
            var hasDialogFix = Dialog.prototype._calcCenter;
            if (hasDialogFix) {
                $('body').addClass('withDialogPosFix');
            }
        },

        _initSecurityPolicy: function() {
            // We may add a setting in pageHeaderController to check for specific security configs, if it is truly necessary,
            // since the presumption is that if the backend -- what deals with returning the appropriate HTTP response header to state what is valid for CSP --
            // already won't be returning the response header when the flag is not enabled, then there would not be a need for the UI to specifically check the flag
            Util.initCSP();
        },

        isTodoPanelFullyFeatured : function() {
            // The page must be running in base domain to have the todo panel fully featured
            // Also, either the panel must already be loaded
            return Util.isRunningBaseDomain();
        },

        _initTodos : function() {
            var oModel = this.mModel;
            if (oModel.getProperty('/enableGlobalTodos')) {
                var actionPath = this._todoActionPath;
                var setTodoCount = function (iCount) {
                    oModel.setProperty('/globalTodoCount', iCount);
                    if (actionPath) {
                        oModel.setProperty(actionPath + '/visible', iCount > 0);
                        oModel.setProperty(actionPath + '/label', iCount == 1 ? rb.getText('COMMON_You_Have_Todos_SINGULAR') : rb.getText('COMMON_You_Have_Todos_PLURAL', [ iCount ]));
                    }
                };

                if (this.isTodoPanelFullyFeatured()) {
                    loadTodoPanelDependencies().done(function(PanelManager) {
                        PanelManager.create(
                            setTodoCount,
                            function(errorMessage, err) {
                                oModel.setProperty('/globalTodoErrorMessage', errorMessage);
                                if (err) {
                                    LOG.error('Error getting todo count', err);
                                }
                            }
                        );
                    });
                } else {
                    this.getTodoCountManually().then(setTodoCount, function(err, ex) {
                        LOG.error('Error getting todo count', err, ex);
                    });
                }
            }
        },

        _getHeaderHeight: function () {
            return this.getView().$().outerHeight(true);
        },

        /**
         * Get the Todo Count for shared header since TodoPanel dependencies won't be available.
         * adapted from au-todo ui5 PanelManager.js
         */
        getTodoCountManually : function() {
            var oStorage = this.getSessionStorage();
            var iCount = oStorage && oStorage.get('todoCount');
            if (iCount != null) {
                return $.Deferred().resolve(iCount);
            }
            DeferredUtil.registerODataService({
                serviceName: ['getTodoPanelInitializer', 'getTodoDetails'],
                serviceAlias: '_ToDo_'
            })
            DeferredUtil.finalizeODataRegistry({
                serviceAlias:'_ToDo_'
            });
            return DeferredUtil.invokeService({
                type: 'ODataService',
                serviceName: 'getTodoPanelInitializer'
            }).then(function(oData) {
                var iCount = 0;
                var oTiles = DeferredUtil.normalizeODataResponse(oData, 'TodoPanelInitializer');
                $.each(oTiles.tiles, function (i, tile) {
                    var properties = tile.properties || JSON.parse(tile.propertiesJSON);
                    var numberProperty = properties && properties.numberValue;
            
                    if (numberProperty) {
                      if (typeof numberProperty === 'number') {
                        iCount += numberProperty;
                      } else if (numberProperty.bindModel) {
                        var oModel = sap.ui.getCore().getModel(numberProperty.model);
            
                        if (oModel) {
                          var value = oModel.getProperty(numberProperty.path);
                          if (typeof value === 'number') {
                            iCount += value;
                          }
                        }
                      }
                    } else {
                      iCount += 1;
                    }
                  });

                oStorage && oStorage.put('todoCount', iCount);
                return iCount;
            });
        },

        /**
         * Get a general purpose session storage place for use by the shared header for things like the todo count.
         */
        getSessionStorage : function() {
            var oStorage;
            var sSessionIdentifier = Util.getSessionRef();
            if (sSessionIdentifier) {
                oStorage = $.sap.storage("session", "_bizxheader_" + sSessionIdentifier);
            }
            return oStorage;
        },

        _initShowCookiePolicy : function() {
            CookiePolicyUtil.init();
        },

        showTodoPanel : function() {
            if (this.isTodoPanelFullyFeatured()) {
                loadTodoPanelDependencies().done($.proxy(function(PanelManager) {
                    PanelManager.togglePanel();
                    this.toggleTodoButtonAriaExpanded(PanelManager.getPanel());
                }, this)).fail(function() {
                    // This should not happen if the application is deployed properly
                    // so I am not adding a new user-friendly message for this scenario
                    sap.ui.require(['sap/m/MessageBox'], function(MessageBox) {
                        MessageBox.error(rb.getText('COMMON_AJAX_DEFAULT_ERROR'));
                    });
                });
            } else {
                if (!this._todoPanelPromise) {
                    this._todoPanelPromise = this._createCrossOriginSidePanel({
                        panel_title: rb.getText('COMMON_You_Have_Todos'), 
                        button_selector: 'globalTodos', 
                        panel_type: SIDE_PANEL_TYPE.todos
                    });
                }
                BizXHeaderController._panel = null;
                this._todoPanelPromise.then(function(panel){
                    panel.show();
                    BizXHeaderController._panel = panel;
                });
                this.toggleTodoButtonAriaExpanded(this._todoPanelPromise);
            }
        },

        toggleTodoButtonAriaExpanded : function(oPanel) {
            var oGlobalTodoButton = oCore.byId('globalTodos');
            if (oPanel && oGlobalTodoButton) {
                var $oGlobalTodoButton = oGlobalTodoButton.$();
                if (oPanel instanceof Promise) {
                    oPanel.then(this.ariaUnexpandedAfterHide);
                } else {
                    this.ariaUnexpandedAfterHide(oPanel, $oGlobalTodoButton);
                }
                $oGlobalTodoButton.attr('aria-expanded', true);
            }
        },

        ariaUnexpandedAfterHide : function(oPanel, _$oGlobalTodoButton) {
            var $oGlobalTodoButton = _$oGlobalTodoButton || oCore.byId('globalTodos').$();
            oPanel.attachEvent('afterHide', function () {
                $oGlobalTodoButton.attr('aria-expanded', false);
            });
        },

        getJamBaseUrl : function() {
            return JamUtil.getBaseUrl();
        },

        getUrlOfSubTabWithId : function(id) {
            var oModel = oCore.getModel('pageHeader');
            var aSubTabs = oModel.getProperty('/subTabs');
            for (var i = 0; i < aSubTabs.length; i++) {
                var oTab = aSubTabs[i];
                if (oTab.id == id) {
                    return oTab.url;
                }
            }
            return null;
        },

        setUrlOfSubTabWithId : function(id, url) {
            var oModel = oCore.getModel('pageHeader');
            var aSubTabs = oModel.getProperty('/subTabs');
            var iSubTabsLength = aSubTabs.length;
            if (iSubTabsLength > 0) {
                for (var i = 0; i < aSubTabs.length; i++) {
                    var oTab = aSubTabs[i];
                    if (oTab.id == id) {
                        /*
                         * We must overwrite the tab with a new object so that
                         * the tab is re-created.
                         */
                        oTab = $.extend({}, oTab);
                        oTab.url = url;
                        oModel.setProperty('/subTabs/' + i, oTab);
                    }
                }
            }
        },

        clearAddedSubTabs : function() {
            var oModel = this.mModel;
            var bVisibleBefore = this.isSubTabsVisible();
            var iInitialTabLength = oModel.getProperty('/initialTabLength');

            var aSubTabs = oModel.getProperty('/subTabs');

            for (var index = aSubTabs.length - 1; index >= iInitialTabLength; --index) {
                aSubTabs.pop();
            }

            oModel.setProperty('/subTabs', aSubTabs);

            if (bVisibleBefore && !this.isSubTabsVisible()) {
                $('body').addClass('globalNavigationSansSubNav');
            }
        },

        clearSubTabs : function() {
            var oModel = this.mModel;
            var aSubTabs = oModel.getProperty('/subTabs');

            for (var index = aSubTabs.length - 1; index >= 0; --index) {
                aSubTabs.pop();
            }

            oModel.setProperty('/subTabs', aSubTabs);
            oModel.setProperty('/initialTabLength', 0); //since this is a clear all
            $('body').addClass('globalNavigationSansSubNav');
        },

        addSubTabs : function(subNav) {
            if (!$.isArray(subNav)) {
                if (subNav) {
                    subNav = [ subNav ];
                } else {
                    subNav = [];
                }
            }
            var bVisibleBefore = this.isSubTabsVisible();
            var oModel = this.mModel;
            var aSubTabs = oModel.getProperty('/subTabs');
            var iIndex = aSubTabs.length;
            var iTabCount = subNav.length;
            var bAnySelected = false;
            for (var i = 0; i < iTabCount; i++) {
                var oTab = subNav[i];
                //adding sub tabs from API should always being shown.
                oTab.alwaysShow = true;
                bAnySelected = bAnySelected || oTab.isSelected;
                aSubTabs.push(oTab);
                this.registerSubTab(oTab);
            }
            /* If any of the newly added tabs is selected, ensure all existing tabs are not selected. */
            if (bAnySelected) {
                for (var i = 0; i < iIndex; i++) {
                    aSubTabs[i].isSelected = false;
                }
            }
            oModel.setProperty('/subTabs/', aSubTabs);
            if (!bVisibleBefore && this.isSubTabsVisible()) {
                $('body').removeClass('globalNavigationSansSubNav');
            }
        },

        registerSubTab : function(oSubTab) {
            var sTabId = oSubTab.id;
            if (sTabId) {
                var sDomId = 'bizxSubTab_' + sTabId;
                if (window.SFGuidedTourRegistry) {
                    SFGuidedTourRegistry.registerTopNavLink(sTabId, sDomId, oSubTab.isSelected);
                }
                if(window.ONBHighlighter) {
                    ONBHighlighter.registerTopNavLink(sTabId, sDomId);
                }
            }
        },

        getSubTab : function(iIndex) {
            return this.mModel.getProperty('/subTabs/' + iIndex);
        },

        setSelectedSubTab : function(iIndex) {
            var oModel = this.mModel;
            var aSubTabs = (oModel && oModel.getProperty('/subTabs')) || [];
            aSubTabs.forEach(function(oTab, i) {
                oTab.isSelected = (i === iIndex);
            });
            oModel.setProperty('/subTabs/', null); // adding this so that the correct styles are applied when we change the sub-tab.
            oModel.setProperty('/subTabs/', aSubTabs);
        },

        /**
         * Find the index of a tab with the given id.
         *
         * @param {String} sTabId
         * @return {Integer} the index, or -1 if not found.
         */
        getSubTabIndex : function(sTabId) {
            if (this.mModel) {
                var aSubTabs = this.mModel.getProperty('/subTabs');
                if (aSubTabs != null) {
                    for (var i=0; i<aSubTabs.length; i++) {
                        var oTab = aSubTabs[i];
                        if (oTab && oTab.id == sTabId) {
                            return i;
                        }
                    }
                }
            }
            return -1;
        },


        /**
         * Update a tab with the given tab id.
         *
         * @param {String} sTabId
         * @param {Object|String} oProperties The tab properties to set, or just the label.
         *   possible properties include: label, title
         */
        updateSubTab : function(sTabId, oProperties) {
            var iIndex = this.getSubTabIndex(sTabId);
            var bHasTab = iIndex >= 0;
            if (bHasTab) {
                this.updateSubTabAt(iIndex, oProperties);
            }
            return bHasTab;
        },

        /**
         * Update a tab at a particular index.
         *
         * @param {Integer} iIndex
         * @param {Object|String} oProperties The tab properties to set, or just the label.
         *   possible properties include: label, title
         */
        updateSubTabAt : function(iIndex, oProperties) {
            if (typeof oProperties == 'string') {
                oProperties = {
                    label: oProperties,
                    title: oProperties
                };
            }
            if (this.mModel) {
                var sPath = '/subTabs/' + iIndex;
                var oTab = $.extend(this.mModel.getProperty(sPath), oProperties);
                this.mModel.setProperty(sPath, oTab);
            }
        },

        getModel: function() {
            return this.mModel;
        },

        focusHeader : function() {
            /*
             * This is kind of a hack, since this the handleFocusBackToMe is
             * expecting a key event. Let's pretend like this was a Shift+Tab
             * key event, since that is realistically the only kind of event
             * when user focuses on the lower focus marker.
             */
            sap.ushell.renderers.fiori2.AccessKeysHandler.handleFocusBackToMe({
                shiftKey : true,
                keyCode : 9, // Tab key code
                preventDefault : function() {
                }
            });
        },

        focusContent : function() {
            var oAccessKeysHandler = sap.ushell.renderers.fiori2.AccessKeysHandler;
            var fnExternalKeysHandler = oAccessKeysHandler.fnExternalKeysHandler;
            if (fnExternalKeysHandler && $.isFunction(fnExternalKeysHandler)) {
                /*
                 * This is kind of a hack, since this the handleFocusBackToMe is
                 * expecting a key event. Let's pretend like this was a Tab key
                 * event, since that is realistically the only kind of event
                 * when user focuses on the upper focus marker.
                 */
                fnExternalKeysHandler.call(oAccessKeysHandler, {
                    shiftKey : false,
                    keyCode : 9, // Tab key code
                    preventDefault : function() {
                    }
                }, oAccessKeysHandler.bFocusPassedToExternalHandlerFirstTime);
                oAccessKeysHandler.bFocusPassedToExternalHandlerFirstTime = false;
            }
        },

        /**
         * Determine if the subtabs should display.
         *
         * @return {Boolean}
         */
        isSubTabsVisible : function() {
            var oModel = this.mModel;
            return oModel.getProperty('/subTabs/length') > 1 || !!oModel.getProperty('/subTabs/0/alwaysShow');
        },

        /**
         * @private
         * @return {jQuery}
         */
        _$ : function() {
            return $('#' + this.getView().getId());
        },

        _initializeChatbotSupport: function () {
            $.sap.require('sap.sf.digitalexperience.CopilotServicesUtil');
            $.sap.registerModulePath("sap.cp.ui", "/copilot/ui");
            try {
                $.sap.require('sap.cp.ui.copilot-bootstrap');
                /*
                 * actionTarget must be "<optional js file>|CopilotQuickcardHandler"
                 */
                ActionSearchUtil.registerQuickcardHandler({
                    actionName : 'CopilotQuickcardHandler',
                    /**
                     * both the params or the entire list of arguments for this callback is configurable in the item result object.
                     * @param {Object} params
                     * @param {String} params.actionId
                     */
                    actionHandler : function(oParams) {
                        jQuery.sap.require('sap.cp.ui.services.DigitalAssistant');
                        sap.cp.ui.services.DigitalAssistant.askCoPilot(oParams.actionLabel);
                    }
                });
            } catch(exp) {
                /* Do nothing, wrapping with try/catch so that if for some reason copilot resources doesn't load
                   this will atleast let the user use the rest of the application gracefully. */
            }
        },

        /**
         * @param {String=} refocusRef Optional element to pass focus back to after the VersionInfo popup is closed.
         */
        showVersionInfo : function (refocusRef) {
            /*
             * Use the aboutBoxMarkup from the pageHeader model, if that does not exist try to get it
             * from the <div id="aboutBox"> if it exists.
             */
            if (this._aboutBoxMarkup == null) {
                this._aboutBoxMarkup = this.mModel.getProperty('/aboutBoxMarkup') || $('#aboutBox').html();
            }
            var config = {
                content: this._aboutBoxMarkup, 
                refocusRef: refocusRef || this._getUtilityLinksMenuButton()
            };
            sap.ui.require(['sap/sf/surj/shell/util/AboutBoxUtil'], function(AboutBoxUtil) {
                AboutBoxUtil.open(config);
            });
            return false;
        },

        /**
         * Executed when someone clicks the Proxy Now button in the utility links.
         */
        proxyNow : function() {
            if (Util.isRunningBaseDomain()) {
                ProxyUtil.showDialog();
            } else {
                // TODO: navigate somewhere and open the proxy dialog right away
                // Currently this wouldn't happen because we remove the Proxy link from utility links
            }
        },

        /**
         * Executed before Logout to cleanup things.
         */
        onBeforeLogout : function() {
            if (window.SFSessionStorage) {
                SFSessionStorage.clear();
            }
            if (window.SFSessionTimeout) {
                SFSessionTimeout.disableUIDisplay();
                SFSessionTimeout.endSession();
            }
            if (!window.TopNavLogout) {
                jQuery.sap.require('sap.sf.surj.shell.util.TopNavLogout');
            }
        },

        hideUtilityLinksPopover: function() {
            var oPopover = oCore.byId('utilityLinksMenuId-menuPopover');
            if (oPopover) {
                setTimeout(function () {
                    oPopover.close();
                }, 100);
            }
        },

        _getUtilityLinksMenuButton : function () {
            return jQuery('#utilityLinksMenuId');
        },

        _initDowntime: function(oDowntime) {
            if (oDowntime) {
                var sStorageKey = '_downtimeDisplayed_' + oDowntime.fromDate + "_" + oDowntime.toDate;
                var oStorage = this.getSessionStorage();
                // Only show the downtime notification once
                if (oStorage && !oStorage.get(sStorageKey)) {
                    oStorage.put(sStorageKey, oDowntime);
                    sap.ui.require(['sap/sf/surj/shell/util/DowntimeNotificationUtil'], function(DowntimeNotificationUtil) {
                        DowntimeNotificationUtil.show(oDowntime);
                    });
                }
            }
        },

        _initSessionTimeout : function() {
            var bUseSessionTimeout = window.useSessionTimeout;

            if (!Util.isRunningBaseDomain() && Util.isBaseDomainCORSEnabled() && this.mModel.getProperty('/settings/sessionTimeoutConfigs')) {
                bUseSessionTimeout = true;
            }

            if (bUseSessionTimeout) {
                sap.ui.require(['sap/sf/surj/shell/session/SessionTimer'], function(SessionTimer) {
                    SessionTimer.start();
                });
            }
        },

        /**
         * @private
         * Handles the <code>sap-shell</code> URL parameter.
         * The URL parameter <code>sap-shell=FLP</code> causes the BizXHeader hide, while the <code>sap-shell=false</code> parameter causes it to show up.
         * Not passing the <code>sap-shell</code> URL parameter at all, will have no effect on the BizXHeader, causing it to stick to its previous state (either hidden or visible).
         */
        _handleSapShellParam: function () {
            var sSapShellParam = Util.findURLParam("sap-shell") || "";
            var bHideHeader = sSapShellParam.toUpperCase() === "FLP";
            var oStorage = this.getSessionStorage();

            if (oStorage && !bHideHeader) {
                if (sSapShellParam === "false") {
                    oStorage.remove("allowEmbeddableMode");
                }
                bHideHeader = oStorage.get("allowEmbeddableMode");
            }

            if (bHideHeader) {
                oStorage && oStorage.put("allowEmbeddableMode", true);
                this.mModel.setProperty('/allowEmbeddableMode', true);
                $('body').addClass('bizXEmbeddedMode');
            }
        },

        /**
         * @private
         * Handles the <code>side-panel</code> URL parameter.
         * <code>side-panel=todos</code>: opens todos side panel
         * <code>side-panel=notif</code>: opens global notifications side panel
         */
        _handleSidePanelParam : function() {
            var sSidePanelParam = Util.findURLParam(SIDE_PANEL_PARAM) || "";
            switch(sSidePanelParam) {
                case SIDE_PANEL_TYPE.todos:
                    this.showTodoPanel();
                    return;
                case SIDE_PANEL_TYPE.notifications:
                    this.toggleGlobalNotificationPanel();
                    return;
                default:
                    return;
            }
        },

        _isFiori3HeaderEnabled : function() {
            var oModel = this.mModel || oCore.getModel('pageHeader');
            var iHeaderVersion = oModel.getProperty('/headerVersion');
            return iHeaderVersion >= FIORI_3_HEADER;
        },

        _initFooter : function() {
            var sFooterMarkup = this.mModel.getProperty('/footer');
            if (sFooterMarkup) {
                var oFooter = $('#footer');
                if (oFooter.length == 0) {
                    oFooter = $(sFooterMarkup);
                    var oPlacemat = $('.globalPlacemat');
                    if (oPlacemat.length > 0) {
                        oFooter.insertAfter(oPlacemat);
                    }
                }
            } else {
                $('body').addClass('hideGlobalFooter');
            }
        }
    });

    var TODO_PANEL_DEPS;

    /**
     * @inner
     * @return {Promise}
     */
    function loadTodoPanelDependencies() {
        if (!TODO_PANEL_DEPS) {
            TODO_PANEL_DEPS = $.Deferred();
            
            var oPanelManager = $.sap.getObject(TODO_PANEL_PKG);
            if (oPanelManager) {
                TODO_PANEL_DEPS.resolve(oPanelManager);
            } else {
                sap.ui.require(['sap/sf/todo/util/PanelManager'], function (PanelManager) {
                    TODO_PANEL_DEPS.resolve(PanelManager);
                }, function (e) {
                    var reason = 'Could not load TodoPanel.';
                    jQuery.sap.log.error(reason, e);
                    TODO_PANEL_DEPS.reject(reason);
                });
            }
        }
        return TODO_PANEL_DEPS;
    }
});
